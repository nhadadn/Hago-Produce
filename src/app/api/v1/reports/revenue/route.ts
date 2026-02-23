import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth/middleware';
import { Role } from '@prisma/client';
import { getRevenueMetrics } from '@/lib/services/reports';
import { revenueReportSchema } from '@/lib/validation/reports';
import { getUserRateLimitKey, isRateLimited } from '@/lib/rate-limit';

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
    const validation = revenueReportSchema.safeParse(body);

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

    const { startDate, endDate, customerId } = validation.data;

    const start = new Date(startDate);
    const end = new Date(endDate);

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

    const metrics = await getRevenueMetrics(start, end, { customerId: customerId || undefined });

    return NextResponse.json({ success: true, data: metrics });
  } catch (error) {
    console.error('[REPORTS_REVENUE_POST]', error);
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

