import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth/middleware';
import { ProductPriceService } from '@/lib/services/product-prices/product-prices.service';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return unauthorizedResponse('Token inválido o expirado');
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Solo administradores pueden realizar esta acción' } },
        { status: 403 }
      );
    }

    const body = await req.json();

    if (!body.prices || !Array.isArray(body.prices)) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Invalid payload structure' } },
        { status: 400 }
      );
    }

    const result = await ProductPriceService.bulkUpdateFromMake(body);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error in bulk update:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'Error interno del servidor' } },
      { status: 500 }
    );
  }
}
