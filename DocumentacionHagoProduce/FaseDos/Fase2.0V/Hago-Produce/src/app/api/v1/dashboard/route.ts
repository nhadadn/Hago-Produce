import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/middleware';
import prisma from '@/lib/db';
import { dashboardService } from '@/lib/services/dashboard.service';

export async function GET(req: NextRequest) {
  try {
    const userPayload = await getAuthenticatedUser(req);
    
    if (!userPayload) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'No autorizado' } },
        { status: 401 }
      );
    }

    // Get full user to check role and customerId
    const user = await prisma.user.findUnique({
      where: { id: userPayload.userId },
      select: { role: true, customerId: true }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'USER_NOT_FOUND', message: 'Usuario no encontrado' } },
        { status: 404 }
      );
    }

    let stats;
    if (user.role === 'CUSTOMER') {
      if (!user.customerId) {
        return NextResponse.json(
          { success: false, error: { code: 'NO_CUSTOMER_LINK', message: 'Usuario no vinculado a un cliente' } },
          { status: 400 }
        );
      }
      stats = await dashboardService.getStats(user.customerId);
    } else {
      // Admin/Management sees all or specific customer if filtered (not implemented yet, showing all)
      stats = await dashboardService.getStats();
    }

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('[DASHBOARD_API]', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Error al obtener métricas' } },
      { status: 500 }
    );
  }
}
