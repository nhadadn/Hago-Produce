import prisma from '@/lib/db';

export type NotificationChannel = 'EMAIL' | 'WHATSAPP' | 'TELEGRAM';
export type NotificationStatus = 'SENT' | 'FAILED' | 'PENDING';

export interface CreateNotificationLogParams {
  channel: NotificationChannel;
  recipient: string;
  status: NotificationStatus;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Registra un intento de envío de notificación en la base de datos.
 * @param params Parámetros del log de notificación
 */
export async function createNotificationLog(params: CreateNotificationLogParams) {
  try {
    return await prisma.notificationLog.create({
      data: {
        channel: params.channel,
        recipient: params.recipient,
        status: params.status,
        error: params.error,
        metadata: params.metadata || {},
      },
    });
  } catch (error) {
    console.error('Error creating notification log:', error);
    // No lanzamos error para no interrumpir el flujo principal si el log falla,
    // pero lo registramos en consola para debugging.
    return null;
  }
}
