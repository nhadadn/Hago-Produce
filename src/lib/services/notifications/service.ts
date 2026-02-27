import prisma from '@/lib/db';
import { logger } from '@/lib/logger/logger.service';
import { NotificationChannel, NotificationPayload } from '@/lib/services/notifications/types';
import { getCustomerChatId, sendNotification as sendTelegramNotification } from '@/lib/services/telegram.service';

interface SendOptions {
  maxRetries?: number;
}

const DEFAULT_MAX_RETRIES = 3;

async function sendEmailNotification(payload: NotificationPayload): Promise<void> {
  logger.info('[NOTIFICATION_EMAIL]', {
    trigger: payload.trigger,
    invoiceId: payload.invoiceId,
    customerId: payload.customerId,
  });
}

async function sendWebhookNotification(payload: NotificationPayload): Promise<void> {
  const webhookUrl = process.env.NOTIFICATIONS_WEBHOOK_URL;
  
  if (!webhookUrl) {
    logger.info('[NOTIFICATION_WEBHOOK_SKIPPED]', {
      trigger: payload.trigger,
      invoiceId: payload.invoiceId,
      reason: 'Missing NOTIFICATIONS_WEBHOOK_URL',
    });
    return;
  }

  await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

async function getNotificationContent(payload: NotificationPayload): Promise<{ title: string; message: string; type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' }> {
  switch (payload.trigger) {
    case 'status_change':
      return {
        title: 'Estado de Factura Actualizado',
        message: `La factura ha cambiado de estado.`,
        type: 'INFO',
      };
    case 'due_date':
      return {
        title: 'Factura por Vencer',
        message: `Una factura está próxima a vencer.`,
        type: 'WARNING',
      };
    case 'overdue':
      return {
        title: 'Factura Vencida',
        message: `Una factura se encuentra vencida.`,
        type: 'ERROR',
      };
    default:
      return {
        title: 'Notificación del Sistema',
        message: 'Tiene una nueva notificación.',
        type: 'INFO',
      };
  }
}

async function logNotification(
  payload: NotificationPayload,
  channel: NotificationChannel,
  status: 'success' | 'failed',
  attempts: number,
  errorMessage?: string,
): Promise<void> {
  // 1. Log to AuditLog (Keep existing functionality)
  await prisma.auditLog.create({
    data: {
      userId: null,
      action: 'NOTIFICATION_SENT',
      entityType: 'notification',
      entityId: payload.invoiceId,
      changes: {
        trigger: payload.trigger,
        channel,
        customerId: payload.customerId,
        status,
        attempts,
        errorMessage: errorMessage || null,
      },
      ipAddress: null,
    },
  });

  // 2. Persist to Notification table if status is success
  if (status === 'success' && channel === 'email') { // Only persist once per logical notification, using email as primary channel trigger
    try {
      // Find users associated with this customer
      const users = await prisma.user.findMany({
        where: { customerId: payload.customerId },
      });

      if (users.length > 0) {
        const content = await getNotificationContent(payload);

        // Create notification for each user
        await prisma.notification.createMany({
          data: users.map(user => ({
            userId: user.id,
            type: content.type,
            title: content.title,
            message: content.message,
            isRead: false,
          })),
        });
      }
    } catch (error) {
      logger.error('Failed to persist notification to DB:', error);
      // Don't throw here to avoid breaking the notification flow if DB persistence fails
    }
  }
}

async function sendWithRetry(
  channel: NotificationChannel,
  payload: NotificationPayload,
  options?: SendOptions,
): Promise<void> {
  const maxRetries = options?.maxRetries ?? DEFAULT_MAX_RETRIES;
  let attempt = 0;
  let lastError: unknown;

  while (attempt < maxRetries) {
    try {
      attempt += 1;

      if (channel === 'email') {
        await sendEmailNotification(payload);
      } else if (channel === 'webhook') {
        await sendWebhookNotification(payload);
      } else if (channel === 'telegram') {
        const chatId = await getCustomerChatId(payload.customerId);
        if (!chatId) {
          return;
        }

        const content = await getNotificationContent(payload);
        const result = await sendTelegramNotification(chatId, content.message);
        if (!result.success) {
          throw new Error(result.error);
        }
      }

      await logNotification(payload, channel, 'success', attempt);
      return;
    } catch (error) {
      lastError = error;
      if (attempt >= maxRetries) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        await logNotification(payload, channel, 'failed', attempt, message);
      }
    }
  }

  if (lastError) {
    throw lastError;
  }
}

export const NotificationsService = {
  async sendNotification(
    payload: NotificationPayload,
    channels: NotificationChannel[] = ['email', 'webhook'],
    options?: SendOptions,
  ): Promise<void> {
    const uniqueChannels = Array.from(new Set(channels));

    for (const channel of uniqueChannels) {
      await sendWithRetry(channel, payload, options);
    }
  },

  async triggerStatusChange(
    invoiceId: string,
    customerId: string,
    previousStatus: string,
    newStatus: string,
  ): Promise<void> {
    const payload: NotificationPayload = {
      trigger: 'status_change',
      invoiceId,
      customerId,
      previousStatus,
      newStatus,
    };
    await this.sendNotification(payload);
  },

  async triggerDueDate(
    invoiceId: string,
    customerId: string,
    dueDate: string,
  ): Promise<void> {
    const payload: NotificationPayload = {
      trigger: 'due_date',
      invoiceId,
      customerId,
      dueDate,
    };
    await this.sendNotification(payload);
  },

  async triggerOverdue(
    invoiceId: string,
    customerId: string,
    dueDate: string,
    daysOverdue: number,
  ): Promise<void> {
    const payload: NotificationPayload = {
      trigger: 'overdue',
      invoiceId,
      customerId,
      dueDate,
      daysOverdue,
    };
    await this.sendNotification(payload);
  },
};
