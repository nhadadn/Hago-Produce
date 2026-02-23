import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth/middleware';
import { userService } from '@/lib/services/users.service';
import { updateUserSchema } from '@/lib/validation/users';
import { Role } from '@prisma/client';

// Helper for self or admin check
function canModify(currentUser: any, targetUserId: string) {
  return currentUser.role === Role.ADMIN || currentUser.userId === targetUserId;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();
    
    // Admin can see anyone, User can see themselves
    if (user.role !== Role.ADMIN && user.userId !== params.id) {
       return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'No tienes permisos' } },
        { status: 403 }
      );
    }

    const targetUser = await userService.getUserById(params.id);
    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Usuario no encontrado' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: targetUser });
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

    if (!canModify(user, params.id)) {
        return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'No tienes permisos' } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validation = updateUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: validation.error.errors[0].message } },
        { status: 400 }
      );
    }

    // Only Admin can change Role or IsActive
    let dataToUpdate = { ...validation.data };
    
    if (user.role !== Role.ADMIN) {
      delete dataToUpdate.role;
      delete dataToUpdate.isActive;
    }

    const updatedUser = await userService.updateUser(params.id, dataToUpdate);

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error) {
     console.error('Update user error:', error);
     return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    // Only Admin can delete
    if (user.role !== Role.ADMIN) {
        return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Solo el administrador puede eliminar usuarios' } },
        { status: 403 }
      );
    }

    await userService.deleteUser(params.id);

    return NextResponse.json({ success: true, message: 'Usuario desactivado correctamente' });
  } catch (error) {
     console.error('Delete user error:', error);
     return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
      { status: 500 }
    );
  }
}
