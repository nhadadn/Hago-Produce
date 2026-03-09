

import winston from 'winston';
import 'winston-daily-rotate-file';
import * as Sentry from '@sentry/node';
// import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { requestContext } from '../context';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface ILogger {
  debug(message: string, context?: Record<string, any>): void;
  info(message: string, context?: Record<string, any>): void;
  warn(message: string, context?: Record<string, any>, error?: unknown): void;
  error(message: string, error?: unknown, context?: Record<string, any>): void;
}

/**
 * LoggerService implementation using Winston and Sentry.
 * Acts as a Singleton for the application (Next.js context).
 */
export class LoggerService implements ILogger {
  private static instance: LoggerService;
  private logger: winston.Logger;
  private isProduction: boolean;

  private constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    
    // Initialize Sentry if DSN is available
    if (process.env.SENTRY_DSN) {
      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        integrations: [
          // nodeProfilingIntegration(),
        ],
        // Performance Monitoring
        tracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE ? parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE) : 1.0,
        // Set sampling rate for profiling - this is relative to tracesSampleRate
        profilesSampleRate: 1.0,
        environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
      });
    }

    // Configure Winston
    const logFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    );

    const transports: winston.transport[] = [
      new winston.transports.Console({
        level: process.env.LOG_LEVEL || (this.isProduction ? 'info' : 'debug'),
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
      }),
    ];

    // Add file transport in production or if configured
    if (this.isProduction || process.env.LOG_TO_FILE === 'true') {
      transports.push(
        new winston.transports.DailyRotateFile({
          filename: process.env.LOG_FILE_PATH ? `${process.env.LOG_FILE_PATH}/application-%DATE%.log` : 'logs/application-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
          format: logFormat,
        })
      );
      
      // Separate error log
      transports.push(
        new winston.transports.DailyRotateFile({
          filename: process.env.LOG_FILE_PATH ? `${process.env.LOG_FILE_PATH}/error-%DATE%.log` : 'logs/error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '30d',
          level: 'error',
          format: logFormat,
        })
      );
    }

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || (this.isProduction ? 'info' : 'debug'),
      format: logFormat,
      defaultMeta: { service: 'hago-produce-api' },
      transports,
    });
  }

  public static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  private formatError(error: unknown): any {
    if (error instanceof Error) {
      return {
        message: error.message,
        name: error.name,
        stack: error.stack,
        cause: error.cause,
      };
    }
    return error;
  }

  private getCorrelationId(): string | undefined {
    // 1. Try AsyncLocalStorage (if initialized via wrapper)
    const store = requestContext.getStore();
    if (store?.correlationId) return store.correlationId;

    // 2. Try Next.js Headers (if in App Router context)
    try {
      // Dynamic require to avoid build issues in non-server contexts if any
      const { headers } = require('next/headers'); // eslint-disable-line
      const headerList = headers();
      return headerList.get('x-correlation-id') || undefined;
    } catch (e) {
      // Ignore error (e.g. called outside request context)
      return undefined;
    }
  }

  public debug(message: string, context?: Record<string, any>): void {
    const correlationId = this.getCorrelationId();
    this.logger.debug(message, { context: { ...context, correlationId } });
  }

  public info(message: string, context?: Record<string, any>): void {
    const correlationId = this.getCorrelationId();
    this.logger.info(message, { context: { ...context, correlationId } });
  }

  public warn(message: string, context?: Record<string, any>, error?: unknown): void {
    const correlationId = this.getCorrelationId();
    const mergedContext = { ...context, correlationId };
    const errorObj = error ? this.formatError(error) : undefined;
    
    this.logger.warn(message, { context: mergedContext, error: errorObj });

    // Send to Sentry as warning
    if (this.isProduction && process.env.SENTRY_DSN) {
       Sentry.withScope((scope) => {
          scope.setLevel('warning');
          if (mergedContext) scope.setContext('application', mergedContext);
          Sentry.captureMessage(message);
       });
    }
  }

  public error(message: string, error?: unknown, context?: Record<string, any>): void {
    const correlationId = this.getCorrelationId();
    const mergedContext = { ...context, correlationId };
    const errorObj = error ? this.formatError(error) : undefined;
    
    // Log to Winston
    this.logger.error(message, { error: errorObj, context: mergedContext });

    // Send to Sentry in production
    if (this.isProduction && process.env.SENTRY_DSN) {
      Sentry.withScope((scope) => {
        scope.setLevel('error');
        if (mergedContext) {
          scope.setContext('application', mergedContext);
        }
        if (error instanceof Error) {
          Sentry.captureException(error);
        } else {
          Sentry.captureMessage(`${message}: ${JSON.stringify(error)}`, 'error');
        }
      });
    }
  }
}

export const logger = LoggerService.getInstance();
