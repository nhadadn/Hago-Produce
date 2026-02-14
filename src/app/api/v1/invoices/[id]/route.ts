import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth/middleware';
import { invoicesService } from '@/lib/services/invoices.service';
import { updateInvoiceSchema } from '@/lib/validation/invoices';
import { Role } from '@prisma/client';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const invoice = await invoicesService.findOne(params.id);
    if (!invoice) {
        return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Factura no encontrada' } }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: invoice });
  } catch (error) {
    console.error('[INVOICE_GET]', error);
    if (error instanceof Error && error.message.includes('not found')) {
        return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Factura no encontrada' } }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();
    
    if (user.role === Role.CUSTOMER) {
        return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'No tiene permisos para editar facturas' } }, { status: 403 });
    }

    const json = await req.json();
    const validation = updateInvoiceSchema.safeParse(json);

    if (!validation.success) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: validation.error.errors[0].message } }, { status: 400 });
    }

    try {
        const invoice = await invoicesService.update(params.id, validation.data);
        return NextResponse.json({ success: true, data: invoice });
    } catch (error: any) {
        if (error.message.includes('Only draft')) {
            return NextResponse.json({ success: false, error: { code: 'BAD_REQUEST', message: error.message } }, { status: 400 });
        }
        if (error.message.includes('not found')) {
            return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Factura no encontrada' } }, { status: 404 });
        }
        throw error;
    }
  } catch (error) {
    console.error('[INVOICE_PUT]', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } }, { status: 500 });
  }
}
