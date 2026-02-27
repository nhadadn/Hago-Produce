import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth/middleware';
import { Role } from '@prisma/client';
import { getTopProducts } from '@/lib/services/reports';
import { topProductsReportSchema } from '@/lib/validation/reports';
import { getUserRateLimitKey, isRateLimited } from '@/lib/rate-limit';
import { logger } from '@/lib/logger/logger.service';

const ALLOWED_ROLES: Role[] = [Role.ADMIN, Role.ACCOUNTING, Role.MANAGEMENT];
const MAX_REQUESTS_PER_MINUTE = 10;

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    if (!ALLOWED_ROLES.includes(user.role as Role)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'No tienes permisos para acceder a este reporte',
          },
        },
        { status: 403 },
      );
    }

    const rateKey = getUserRateLimitKey(user.userId, req);
    if (isRateLimited(rateKey, MAX_REQUESTS_PER_MINUTE)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: 'Demasiadas solicitudes de reportes. Intente de nuevo más tarde.',
          },
        },
        { status: 429 },
      );
    }

    const body = await req.json();
    const validation = topProductsReportSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.error.errors[0].message,
          },
        },
        { status: 400 },
      );
    }

    const { limit, startDate, endDate } = validation.data;

    const now = new Date();
    const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = endDate ? new Date(endDate) : now;

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Rango de fechas inválido',
          },
        },
        { status: 400 },
      );
    }

    const top = await getTopProducts(limit ?? 10, start, end);

    const response = NextResponse.json({ success: true, data: top });
    
    if ((top as any)._fromCache) {
      response.headers.set('X-Cache', 'HIT');
    } else {
      response.headers.set('X-Cache', 'MISS');
    }

    return response;
  } catch (error) {
    logger.error('[REPORTS_TOP_PRODUCTS_POST]', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error interno del servidor',
        },
      },
      { status: 500 },
    );
  }
}

