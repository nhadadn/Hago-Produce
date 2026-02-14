import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth/middleware';
import { CustomerService } from '@/lib/services/customers.service';
import { updateCustomerSchema } from '@/lib/validation/customers';
import { Role } from '@prisma/client';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const customer = await CustomerService.getById(params.id);
    if (!customer) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Cliente no encontrado' } }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: customer });
  } catch (error) {
    console.error('[CUSTOMER_GET]', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    if (user.role !== Role.ADMIN) {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'No tiene permisos para realizar esta acción' } }, { status: 403 });
    }

    const json = await req.json();
    const validation = updateCustomerSchema.safeParse(json);

    if (!validation.success) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: validation.error.errors[0].message } }, { status: 400 });
    }

    try {
      const customer = await CustomerService.update(params.id, validation.data);
      return NextResponse.json({ success: true, data: customer });
    } catch (error: any) {
       if (error.message.includes('already exists')) {
        return NextResponse.json({ success: false, error: { code: 'DUPLICATE_ENTRY', message: error.message } }, { status: 409 });
      }
      if (error.code === 'P2025') {
          return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Cliente no encontrado' } }, { status: 404 });
      }
      console.error('[CUSTOMER_PATCH] Update Error:', error);
      return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } }, { status: 500 });
    }
  } catch (error) {
    console.error('[CUSTOMER_PATCH]', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    if (user.role !== Role.ADMIN) {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'No tiene permisos para realizar esta acción' } }, { status: 403 });
    }

    try {
      await CustomerService.delete(params.id);
      return NextResponse.json({ success: true, data: { message: 'Cliente eliminado correctamente' } });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Cliente no encontrado' } }, { status: 404 });
      }
      console.error('[CUSTOMER_DELETE] Delete Error:', error);
      return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } }, { status: 500 });
    }
  } catch (error) {
    console.error('[CUSTOMER_DELETE]', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } }, { status: 500 });
  }
}
