import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { NotificationsService } from '@/lib/services/notifications/service';
import { InvoiceStatus } from '@prisma/client';
import { logger } from '@/lib/logger/logger.service';

export async function GET(req: NextRequest) {
  try {
    const secret = req.headers.get('x-cron-secret');
    if (!secret || secret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'No autorizado' } },
        { status: 401 },
      );
    }

    const now = new Date();
    const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const overdueThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const invoices = await prisma.invoice.findMany({
      where: {
        status: InvoiceStatus.PENDING,
        dueDate: { lt: overdueThreshold },
      },
      select: { id: true, customerId: true, dueDate: true },
    });

    let processed = 0;

    for (const inv of invoices) {
      const recent = await prisma.auditLog.findMany({
        where: {
          entityType: 'notification',
          entityId: inv.id,
          createdAt: { gte: cutoff },
        },
        take: 1,
      });

      if (recent.length > 0) continue;

      const daysOverdue = Math.max(
        1,
        Math.floor((now.getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24)),
      );

      await NotificationsService.triggerOverdue(
        inv.id,
        inv.customerId,
        inv.dueDate.toISOString(),
        daysOverdue,
      );

      processed++;
    }

    return NextResponse.json({ success: true, data: { processed } });
  } catch (error) {
    logger.error('[CRON_OVERDUE_NOTIFICATIONS]', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
      { status: 500 },
    );
  }
}

