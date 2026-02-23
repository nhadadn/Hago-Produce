import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth/middleware';
import { userService } from '@/lib/services/users.service';
import { createUserSchema } from '@/lib/validation/users';
import { Role } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    // Only Admin can list users
    if (user.role !== Role.ADMIN) {
       return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'No tienes permisos para realizar esta acción' } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;
    const role = searchParams.get('role') as Role | undefined;
    const search = searchParams.get('search') || undefined;
    const isActiveParam = searchParams.get('isActive');
    const isActive = isActiveParam === 'true' ? true : isActiveParam === 'false' ? false : undefined;

    const result = await userService.getUsers({ page, limit, role, search, isActive });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Get users error:', error);
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

    if (user.role !== Role.ADMIN) {
       return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'No tienes permisos para crear usuarios' } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validation = createUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: validation.error.errors[0].message } },
        { status: 400 }
      );
    }

    // Check if user exists
    const existing = await userService.getUserByEmail(validation.data.email);
    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: 'USER_EXISTS', message: 'El usuario ya existe' } },
        { status: 409 }
      );
    }

    const newUser = await userService.createUser(validation.data);

    return NextResponse.json({ success: true, data: newUser }, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
      { status: 500 }
    );
  }
}
