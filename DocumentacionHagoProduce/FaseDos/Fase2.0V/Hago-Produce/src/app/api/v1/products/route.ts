import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth/middleware';
import { ProductService } from '@/lib/services/productService';
import { productFilterSchema, productSchema } from '@/lib/validation/product';

export async function GET(req: NextRequest) {
  try {
    // Autenticación
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return unauthorizedResponse('Token inválido o expirado');
    }

    // Validación de permisos
    if (!['ADMIN', 'ACCOUNTING', 'MANAGEMENT'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'No tienes permisos para realizar esta acción' } },
        { status: 403 }
      );
    }

    // Obtener parámetros de búsqueda
    const { searchParams } = new URL(req.url);
    const filters = {
      search: searchParams.get('search') || undefined,
      category: searchParams.get('category') || undefined,
      isActive: searchParams.get('isActive') as any, // validado por zod luego
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
    };

    // Validar filtros
    const validationResult = productFilterSchema.safeParse(filters);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Parámetros inválidos', details: validationResult.error.errors } },
        { status: 400 }
      );
    }

    // Obtener productos
    const result = await ProductService.getAll(validationResult.data);

    return NextResponse.json({
      success: true,
      data: result.products,
      meta: result.meta,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'Error interno del servidor' } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Autenticación
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return unauthorizedResponse('Token inválido o expirado');
    }

    // Validación de permisos (Solo ADMIN)
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Solo administradores pueden crear productos' } },
        { status: 403 }
      );
    }

    // Parsear body
    const body = await req.json();

    // Validar body
    const validationResult = productSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos', details: validationResult.error.errors } },
        { status: 400 }
      );
    }

    // Crear producto
    const newProduct = await ProductService.create(validationResult.data);

    return NextResponse.json(
      { success: true, data: newProduct },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'Error al crear producto' } },
      { status: 500 }
    );
  }
}
