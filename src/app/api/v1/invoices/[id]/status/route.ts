import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth/middleware';
import { invoicesService } from '@/lib/services/invoices.service';
import { Role, InvoiceStatus } from '@prisma/client';
import { z } from 'zod';

const ALLOWED_ROLES: Role[] = [Role.ADMIN, Role.ACCOUNTING];

const changeStatusSchema = z.object({
  status: z.nativeEnum(InvoiceStatus),
  reason: z.string().max(500).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    if (!ALLOWED_ROLES.includes(user.role as Role)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'No tienes permisos para cambiar el estado de facturas',
          },
        },
        { status: 403 },
      );
    }

    const body = await req.json();
    const validation = changeStatusSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.error.errors[0].message,
          },
        },
        { status: 400 },
      );
    }

    try {
      const invoice = await invoicesService.changeStatus(
        params.id,
        validation.data.status,
        user.userId,
      );

      return NextResponse.json({ success: true, data: invoice });
    } catch (error: any) {
      if (error.message.includes('Invoice not found')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Factura no encontrada',
            },
          },
          { status: 404 },
        );
      }

      if (error.message.includes('Invalid status transition')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'BAD_REQUEST',
              message: 'Transición de estado no válida para esta factura',
            },
          },
          { status: 400 },
        );
      }

      throw error;
    }
  } catch (error) {
    console.error('[INVOICE_STATUS_PATCH]', error);
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

