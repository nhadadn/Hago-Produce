import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth/middleware';
import { ProductService } from '@/lib/services/productService';
import { productUpdateSchema } from '@/lib/validation/product';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    // Validar permisos
    if (!['ADMIN', 'ACCOUNTING', 'MANAGEMENT'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'No tienes permisos para ver este recurso' } },
        { status: 403 }
      );
    }

    const product = await ProductService.getById(params.id);

    if (!product) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Producto no encontrado' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'Error interno del servidor' } },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    // Solo ADMIN puede editar
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Solo administradores pueden editar productos' } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validationResult = productUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', details: validationResult.error.errors } },
        { status: 400 }
      );
    }

    // Verificar existencia
    const existingProduct = await ProductService.getById(params.id);
    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Producto no encontrado' } },
        { status: 404 }
      );
    }

    const updatedProduct = await ProductService.update(params.id, validationResult.data);

    return NextResponse.json({ success: true, data: updatedProduct });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'Error al actualizar producto' } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    // Solo ADMIN puede eliminar
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Solo administradores pueden eliminar productos' } },
        { status: 403 }
      );
    }

    // Verificar existencia
    const existingProduct = await ProductService.getById(params.id);
    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Producto no encontrado' } },
        { status: 404 }
      );
    }

    await ProductService.delete(params.id);

    return NextResponse.json({ success: true, message: 'Producto eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'Error al eliminar producto' } },
      { status: 500 }
    );
  }
}
