import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth/middleware';
import { Role } from '@prisma/client';
import { invalidateCache, clearAllCache, ReportType } from '@/lib/utils/report-cache';

const ALLOWED_ROLES: Role[] = [Role.ADMIN];

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    
    if (!user) {
      return unauthorizedResponse();
    }

    if (!ALLOWED_ROLES.includes(user.role as Role)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'No tienes permisos para realizar esta acción',
          },
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    let deletedCount = 0;

    if (type) {
      // Validate type
      const validTypes: ReportType[] = [
        'REVENUE',
        'AGING',
        'TOP_CUSTOMERS',
        'TOP_PRODUCTS',
        'PRICE_TRENDS',
        'TOP_PERFORMERS' // Although not used yet, it's in the type definition
      ];

      if (!validTypes.includes(type as ReportType)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_PARAMETER',
              message: `Tipo de reporte inválido. Tipos válidos: ${validTypes.join(', ')}`,
            },
          },
          { status: 400 }
        );
      }

      deletedCount = await invalidateCache(type as ReportType);
    } else {
      // Clear all cache
      deletedCount = await clearAllCache();
    }

    return NextResponse.json({
      success: true,
      deleted: deletedCount,
    });

  } catch (error) {
    console.error('[CACHE_INVALIDATION_ERROR]', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error al invalidar caché',
        },
      },
      { status: 500 }
    );
  }
}
