import prisma from '@/lib/db';
import { InvoiceStatus } from '@prisma/client';
import { NotificationsService } from '@/lib/services/notifications/service';

export const NotificationTriggers = {
  async handleInvoiceStatusChange(
    invoiceId: string,
    previousStatus: InvoiceStatus,
    newStatus: InvoiceStatus,
  ): Promise<void> {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: {
        id: true,
        customerId: true,
      },
    });

    if (!invoice) {
      return;
    }

    await NotificationsService.triggerStatusChange(
      invoice.id,
      invoice.customerId,
      previousStatus,
      newStatus,
    );
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

