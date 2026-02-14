import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth/middleware';
import { invoicesService } from '@/lib/services/invoices.service';
import { createInvoiceSchema, invoiceFilterSchema } from '@/lib/validation/invoices';
import { Role } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const { searchParams } = new URL(req.url);
    const params = Object.fromEntries(searchParams);
    
    const validation = invoiceFilterSchema.safeParse(params);
    if (!validation.success) {
         return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: validation.error.errors[0].message } }, { status: 400 });
    }

    const filters = { ...validation.data };

    if (user.role === Role.CUSTOMER) {
        if (!user.customerId) {
             return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Usuario no asociado a un cliente' } }, { status: 403 });
        }
        filters.customerId = user.customerId;
    }

    const result = await invoicesService.findAll(filters);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('[INVOICES_GET]', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    if (user.role === Role.CUSTOMER) {
        return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'No tiene permisos para crear facturas' } }, { status: 403 });
    }

    const json = await req.json();
    const validation = createInvoiceSchema.safeParse(json);

    if (!validation.success) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: validation.error.errors[0].message } }, { status: 400 });
    }

    const invoice = await invoicesService.create(validation.data);
    return NextResponse.json({ success: true, data: invoice }, { status: 201 });
  } catch (error) {
    console.error('[INVOICES_POST]', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } }, { status: 500 });
  }
}
