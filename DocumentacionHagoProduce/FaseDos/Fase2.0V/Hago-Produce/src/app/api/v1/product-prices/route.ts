import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth/middleware';
import { ProductPriceService } from '@/lib/services/product-prices/product-prices.service';
import { productPriceFilterSchema, productPriceSchema } from '@/lib/validation/product-price';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return unauthorizedResponse('Token inválido o expirado');
    }

    // Validation of permissions
    if (!['ADMIN', 'ACCOUNTING', 'MANAGEMENT'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'No tienes permisos para realizar esta acción' } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const filters = {
      productId: searchParams.get('product_id') || undefined,
      supplierId: searchParams.get('supplier_id') || undefined,
      isCurrent: searchParams.get('is_current') || undefined,
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '50',
    };

    const validationResult = productPriceFilterSchema.safeParse(filters);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Parámetros inválidos', details: validationResult.error.errors } },
        { status: 400 }
      );
    }

    const result = await ProductPriceService.getAll(validationResult.data);

    return NextResponse.json({
      success: true,
      data: result.prices,
      meta: result.meta,
    });
  } catch (error) {
    console.error('Error fetching product prices:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'Error interno del servidor' } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return unauthorizedResponse('Token inválido o expirado');
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Solo administradores pueden crear precios' } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validationResult = productPriceSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos', details: validationResult.error.errors } },
        { status: 400 }
      );
    }

    const newPrice = await ProductPriceService.create(validationResult.data);

    return NextResponse.json(
      { success: true, data: newPrice },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating product price:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'Error al crear precio' } },
      { status: 500 }
    );
  }
}
