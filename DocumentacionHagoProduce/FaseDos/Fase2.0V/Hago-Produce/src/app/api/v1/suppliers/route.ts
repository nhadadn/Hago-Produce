import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth/middleware';
import { supplierService } from '@/lib/services/suppliers.service';
import { createSupplierSchema } from '@/lib/validation/suppliers';
import { Role } from '@prisma/client';

const ALLOWED_ROLES: Role[] = [Role.ADMIN, Role.ACCOUNTING];

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    // All authenticated users can see suppliers? 
    // Requirement says: Admin and accounting can manage. 
    // Assuming Management can at least VIEW for operations.
    // For now, let's stick to the prompt implication or be permissive on read, strict on write.
    // Prompt says: "Admin and accounting can manage".
    
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || undefined;
    const isActiveParam = searchParams.get('isActive');
    const isActive = isActiveParam === 'true' ? true : isActiveParam === 'false' ? false : undefined;

    const result = await supplierService.getSuppliers({ page, limit, search, isActive });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Get suppliers error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    if (!ALLOWED_ROLES.includes(user.role as Role)) {
       return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'No tienes permisos para crear proveedores' } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validation = createSupplierSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: validation.error.errors[0].message } },
        { status: 400 }
      );
    }

    // Check uniqueness
    const existing = await supplierService.getSupplierByName(validation.data.name);
    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: 'DUPLICATE_ENTRY', message: 'Ya existe un proveedor con este nombre' } },
        { status: 409 }
      );
    }

    const newSupplier = await supplierService.createSupplier(validation.data);

    return NextResponse.json({ success: true, data: newSupplier }, { status: 201 });
  } catch (error) {
    console.error('Create supplier error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
      { status: 500 }
    );
  }
}
