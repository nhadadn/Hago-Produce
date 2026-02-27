import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth/middleware';
import { Role } from '@prisma/client';
import { NotificationTriggers } from '@/lib/services/notifications/triggers';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    if (user.role !== Role.ADMIN && user.role !== Role.ACCOUNTING) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'No tiene permisos para disparar notificaciones',
          },
        },
        { status: 403 },
      );
    }

    const body = await req.json();
    const type = body?.type as string;

    if (type === 'status_change') {
      const { invoiceId, previousStatus, newStatus } = body;
      if (!invoiceId || !previousStatus || !newStatus) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'invoiceId, previousStatus y newStatus son obligatorios',
            },
          },
          { status: 400 },
        );
      }
      await NotificationTriggers.handleInvoiceStatusChange(
        invoiceId,
        previousStatus,
        newStatus,
      );
    } else if (type === 'due_date') {
      await NotificationTriggers.handleDueDateNotification();
    } else if (type === 'overdue') {
      await NotificationTriggers.handleOverdueNotification();
    } else {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Tipo de trigger inválido',
          },
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: { processed: true, type },
      },
      { status: 200 },
    );
  } catch (error) {
    logger.error('[NOTIFICATIONS_POST]', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error interno del servidor',
        },
      },
      { status: 500 },
    );
  }
}

