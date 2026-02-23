import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth/middleware';
import { invoiceNotesService } from '@/lib/services/invoices/notes';
import { invoiceNoteCreateSchema } from '@/lib/validation/invoice-notes';
import { Role } from '@prisma/client';

const READ_ROLES: Role[] = [Role.ADMIN, Role.ACCOUNTING, Role.MANAGEMENT];
const WRITE_ROLES: Role[] = [Role.ADMIN, Role.ACCOUNTING];

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    if (!READ_ROLES.includes(user.role as Role)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'No tienes permisos para ver notas de facturas',
          },
        },
        { status: 403 },
      );
    }

    const notes = await invoiceNotesService.listByInvoice(params.id);

    return NextResponse.json({ success: true, data: notes });
  } catch (error) {
    console.error('[INVOICE_NOTES_GET]', error);
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

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    if (!WRITE_ROLES.includes(user.role as Role)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'No tienes permisos para agregar notas a facturas',
          },
        },
        { status: 403 },
      );
    }

    const body = await req.json();
    const validation = invoiceNoteCreateSchema.safeParse(body);

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

    const note = await invoiceNotesService.create(
      params.id,
      user.userId,
      validation.data,
    );

    return NextResponse.json({ success: true, data: note }, { status: 201 });
  } catch (error) {
    console.error('[INVOICE_NOTES_POST]', error);

    if (error instanceof Error && error.message.includes('Invoice not found')) {
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

