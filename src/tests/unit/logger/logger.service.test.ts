import { LoggerService } from '@/lib/infrastructure/logger.service';
import winston from 'winston';

jest.unmock('@/lib/infrastructure/logger.service');
jest.unmock('@/lib/logger/logger.service');

import * as Sentry from '@sentry/node';

// Mock Next.js headers
jest.mock('next/headers', () => ({
  headers: jest.fn(),
}), { virtual: true });

// Mock Winston
jest.mock('winston', () => {
  const mLogger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  return {
    format: {
      combine: jest.fn(),
      timestamp: jest.fn(),
      errors: jest.fn(),
      json: jest.fn(),
      colorize: jest.fn(),
      simple: jest.fn(),
    },
    transports: {
      Console: jest.fn(),
      DailyRotateFile: jest.fn(),
    },
    createLogger: jest.fn(() => mLogger),
  };
});

// Mock Sentry
jest.mock('@sentry/node', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  withScope: jest.fn((cb) => {
    const scope = {
      setContext: jest.fn(),
      setLevel: jest.fn(),
    };
    cb(scope);
  }),
}));

jest.mock('@sentry/profiling-node', () => ({
  nodeProfilingIntegration: jest.fn(),
}));

// Mock Daily Rotate File
jest.mock('winston-daily-rotate-file', () => {
  return jest.fn();
});

describe('LoggerService', () => {
  let winstonLogger: any;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset singleton instance
    (LoggerService as any).instance = undefined;
    
    // Setup winston mock return value
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    winstonLogger = (winston.createLogger as jest.Mock)().debug ? (winston.createLogger as jest.Mock)() : {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    };
    (winston.createLogger as jest.Mock).mockReturnValue(winstonLogger);
    
    // Default headers mock
    const headersMock = require('next/headers').headers;
    headersMock.mockReturnValue({
        get: jest.fn().mockReturnValue(null)
    });
  });

  it('should be a singleton', () => {
    const instance1 = LoggerService.getInstance();
    const instance2 = LoggerService.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should initialize Winston and Sentry', () => {
    process.env.SENTRY_DSN = 'https://example@sentry.io/123';
    process.env.NODE_ENV = 'production';
    
    LoggerService.getInstance();
    
    expect(Sentry.init).toHaveBeenCalledWith(expect.objectContaining({
      dsn: 'https://example@sentry.io/123',
      environment: 'production',
    }));
    
    expect(winston.createLogger).toHaveBeenCalled();
  });

  it('should log debug messages', () => {
    const instance = LoggerService.getInstance();
    instance.debug('Test debug', { foo: 'bar' });
    
    expect(winstonLogger.debug).toHaveBeenCalledWith('Test debug', {
      context: { foo: 'bar', correlationId: undefined }
    });
  });

  it('should log info messages with correlation ID from headers', () => {
    const mockHeaders = new Map();
    mockHeaders.set('x-correlation-id', 'test-uuid');
    
    const headersMock = require('next/headers').headers;
    headersMock.mockReturnValue({
        get: (key: string) => mockHeaders.get(key)
    });

    const instance = LoggerService.getInstance();
    instance.info('Test info', { foo: 'bar' });
    
    expect(winstonLogger.info).toHaveBeenCalledWith('Test info', {
      context: { foo: 'bar', correlationId: 'test-uuid' }
    });
  });

  it('should log warn messages and send to Sentry in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.SENTRY_DSN = 'https://example@sentry.io/123';
    
    const instance = LoggerService.getInstance();
    const error = new Error('Test warning');
    instance.warn('Test warn', { foo: 'bar' }, error);
    
    expect(winstonLogger.warn).toHaveBeenCalledWith('Test warn', expect.objectContaining({
      context: expect.objectContaining({ foo: 'bar' }),
      error: expect.objectContaining({ message: 'Test warning' })
    }));
    
    expect(Sentry.captureMessage).toHaveBeenCalledWith('Test warn');
  });

  it('should log error messages and send to Sentry in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.SENTRY_DSN = 'https://example@sentry.io/123';
    
    const instance = LoggerService.getInstance();
    const error = new Error('Test error');
    instance.error('Test error msg', error, { userId: '123' });
    
    // Check Winston
    expect(winstonLogger.error).toHaveBeenCalledWith('Test error msg', expect.objectContaining({
      context: expect.objectContaining({ userId: '123' }),
      error: expect.objectContaining({ message: 'Test error' })
    }));
    
    // Check Sentry
    expect(Sentry.withScope).toHaveBeenCalled();
    expect(Sentry.captureException).toHaveBeenCalledWith(error);
  });

  it('should NOT send to Sentry in development even with DSN', () => {
    process.env.NODE_ENV = 'development';
    process.env.SENTRY_DSN = 'https://example@sentry.io/123'; // DSN is present
    
    const instance = LoggerService.getInstance();
    const error = new Error('Test error');
    instance.error('Test error msg', error);
    
    expect(Sentry.captureException).not.toHaveBeenCalled();
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
  });

  it('should capture message in Sentry if error is not an Error object', () => {
    process.env.NODE_ENV = 'production';
    process.env.SENTRY_DSN = 'https://example@sentry.io/123';
    
    const instance = LoggerService.getInstance();
    instance.error('Test error string', 'Some string error', { userId: '123' });
    
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      'Test error string: "Some string error"',
      'error'
    );
  });
});

