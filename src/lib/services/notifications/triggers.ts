import prisma from '@/lib/db';
import { InvoiceStatus } from '@prisma/client';
import { NotificationsService } from '@/lib/services/notifications/service';
import { sendWhatsAppMessage } from '@/lib/services/notifications/twilio';
import { whatsAppService } from '@/lib/services/bot/whatsapp.service';

export const NotificationTriggers = {
  async handleInvoiceStatusChange(
    invoiceId: string,
    previousStatus: InvoiceStatus,
    newStatus: InvoiceStatus,
  ): Promise<void> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: {
        id: true,
        number: true,
        total: true,
        customerId: true,
        customer: { select: { name: true, phone: true, email: true } },
      },
    });

    if (!invoice) return;

    const recent = await prisma.auditLog.findMany({
      where: {
        entityType: 'notification',
        entityId: invoice.id,
        createdAt: { gte: oneHourAgo },
      },
      take: 1,
    });

    if (recent.length === 0 && invoice.customer?.phone) {
      try {
        const to = `whatsapp:${whatsAppService.formatWhatsAppNumber(invoice.customer.phone)}`;
        const total = Number(invoice.total).toFixed(2);
        const text = `Hola ${invoice.customer.name || ''}, tu factura ${invoice.number} ha cambiado a estado ${newStatus}. Total: ${total} CAD.`.trim();
        await sendWhatsAppMessage(to, text);

        await prisma.auditLog.create({
          data: {
            userId: null,
            action: 'NOTIFICATION_SENT',
            entityType: 'notification',
            entityId: invoice.id,
            changes: { trigger: 'status_change', channel: 'whatsapp', to },
            ipAddress: null,
          },
        });
      } catch (e) {
        await NotificationsService.triggerStatusChange(
          invoice.id,
          invoice.customerId,
          previousStatus,
          newStatus,
        );
      }
    } else {
      await NotificationsService.triggerStatusChange(
        invoice.id,
        invoice.customerId,
        previousStatus,
        newStatus,
      );
    }
  },

  async handleDueDateNotification(): Promise<void> {
    const today = new Date();
    const todayDateOnly = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

    const invoices = await prisma.invoice.findMany({
      where: {
        status: InvoiceStatus.PENDING,
        dueDate: todayDateOnly,
      },
      select: {
        id: true,
        customerId: true,
        dueDate: true,
      },
    });

    for (const invoice of invoices) {
      await NotificationsService.triggerDueDate(
        invoice.id,
        invoice.customerId,
        invoice.dueDate.toISOString(),
      );
    }
  },

  async handleOverdueNotification(): Promise<void> {
    const today = new Date();
    const todayDateOnly = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

    const invoices = await prisma.invoice.findMany({
      where: {
        status: InvoiceStatus.OVERDUE,
        dueDate: {
          lt: todayDateOnly,
        },
      },
      select: {
        id: true,
        customerId: true,
        dueDate: true,
      },
    });

    for (const invoice of invoices) {
      const daysOverdue = Math.max(
        1,
        Math.floor(
          (todayDateOnly.getTime() - invoice.dueDate.getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      );

      await NotificationsService.triggerOverdue(
        invoice.id,
        invoice.customerId,
        invoice.dueDate.toISOString(),
        daysOverdue,
      );
    }
  },
};
