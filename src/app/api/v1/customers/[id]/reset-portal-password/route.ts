import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth/middleware';
import { CustomerService } from '@/lib/services/customers.service';
import { Role } from '@prisma/client';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    if (user.role !== Role.ADMIN) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'No tiene permisos para realizar esta acción' } },
        { status: 403 }
      );
    }

    try {
      const result = await CustomerService.resetPortalPassword(params.id);
      return NextResponse.json({ success: true, data: result });
    } catch (error: any) {
      if (error.message === 'Customer not found') {
        return NextResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: 'Cliente no encontrado' } },
          { status: 404 }
        );
      }
      console.error('[CUSTOMER_RESET_PASSWORD] Error:', error);
      return NextResponse.json(
        { success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[CUSTOMER_RESET_PASSWORD]', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
      { status: 500 }
    );
  }
}
