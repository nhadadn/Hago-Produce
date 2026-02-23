import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth/middleware';
import { CustomerService } from '@/lib/services/customers.service';
import { createCustomerSchema } from '@/lib/validation/customers';
import { Role } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || undefined;
    const isActive = searchParams.get('isActive') || undefined;

    const result = await CustomerService.getAll({ page, limit, search, isActive });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('[CUSTOMERS_GET]', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    if (user.role !== Role.ADMIN) {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'No tiene permisos para realizar esta acción' } }, { status: 403 });
    }

    const json = await req.json();
    const validation = createCustomerSchema.safeParse(json);

    if (!validation.success) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: validation.error.errors[0].message } }, { status: 400 });
    }

    try {
      const customer = await CustomerService.create(validation.data);
      return NextResponse.json({ success: true, data: customer }, { status: 201 });
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        return NextResponse.json({ success: false, error: { code: 'DUPLICATE_ENTRY', message: error.message } }, { status: 409 });
      }
      console.error('[CUSTOMERS_POST] Create Error:', error);
      return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } }, { status: 500 });
    }
  } catch (error) {
    console.error('[CUSTOMERS_POST]', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } }, { status: 500 });
  }
}
