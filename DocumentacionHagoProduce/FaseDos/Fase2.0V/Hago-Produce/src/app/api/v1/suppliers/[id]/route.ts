import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth/middleware';
import { supplierService } from '@/lib/services/suppliers.service';
import { updateSupplierSchema } from '@/lib/validation/suppliers';
import { Role } from '@prisma/client';

const ALLOWED_ROLES: Role[] = [Role.ADMIN, Role.ACCOUNTING];

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const supplier = await supplierService.getSupplierById(params.id);
    if (!supplier) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Proveedor no encontrado' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: supplier });
  } catch (error) {
     return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    if (!ALLOWED_ROLES.includes(user.role as Role)) {
        return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'No tienes permisos para editar proveedores' } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validation = updateSupplierSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: validation.error.errors[0].message } },
        { status: 400 }
      );
    }

    // Check existence
    const existing = await supplierService.getSupplierById(params.id);
    if (!existing) {
       return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Proveedor no encontrado' } },
        { status: 404 }
      );
    }

    // Check name uniqueness if changing name
    if (validation.data.name && validation.data.name !== existing.name) {
      const duplicate = await supplierService.getSupplierByName(validation.data.name);
      if (duplicate) {
        return NextResponse.json(
          { success: false, error: { code: 'DUPLICATE_ENTRY', message: 'Ya existe un proveedor con este nombre' } },
          { status: 409 }
        );
      }
    }

    const updatedSupplier = await supplierService.updateSupplier(params.id, validation.data);

    return NextResponse.json({ success: true, data: updatedSupplier });
  } catch (error) {
     console.error('Update supplier error:', error);
     return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
      { status: 500 }
    );
  }
}
