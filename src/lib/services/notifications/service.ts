import prisma from '@/lib/db';
import { NotificationChannel, NotificationPayload, NotificationTrigger } from '@/lib/services/notifications/types';

interface SendOptions {
  maxRetries?: number;
}

const DEFAULT_MAX_RETRIES = 3;

const NOTIFICATIONS_WEBHOOK_URL = process.env.NOTIFICATIONS_WEBHOOK_URL;

async function sendEmailNotification(payload: NotificationPayload): Promise<void> {
  console.info('[NOTIFICATION_EMAIL]', {
    trigger: payload.trigger,
    invoiceId: payload.invoiceId,
    customerId: payload.customerId,
  });
}

async function sendWebhookNotification(payload: NotificationPayload): Promise<void> {
  if (!NOTIFICATIONS_WEBHOOK_URL) {
    console.info('[NOTIFICATION_WEBHOOK_SKIPPED]', {
      trigger: payload.trigger,
      invoiceId: payload.invoiceId,
      reason: 'Missing NOTIFICATIONS_WEBHOOK_URL',
    });
    return;
  }

  await fetch(NOTIFICATIONS_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

async function logNotification(
  payload: NotificationPayload,
  channel: NotificationChannel,
  status: 'success' | 'failed',
  attempts: number,
  errorMessage?: string,
): Promise<void> {
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
      } else {
        await sendWebhookNotification(payload);
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

