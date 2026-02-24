import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth/middleware';
import { getAgingReport } from '@/lib/services/reports';
import { agingReportSchema } from '@/lib/validation/reports';
import { getUserRateLimitKey, isRateLimited } from '@/lib/rate-limit';

const MAX_REQUESTS_PER_MINUTE = 10;

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

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
    const validation = agingReportSchema.safeParse(body);

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

    const { asOfDate, customerId } = validation.data;

    const asOf = asOfDate ? new Date(asOfDate) : new Date();
    if (Number.isNaN(asOf.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Fecha de corte inválida',
          },
        },
        { status: 400 },
      );
    }

    const report = await getAgingReport(asOf, { customerId: customerId || undefined });

    const response = NextResponse.json({ success: true, data: report });
    
    if (report._fromCache) {
      response.headers.set('X-Cache', 'HIT');
    } else {
      response.headers.set('X-Cache', 'MISS');
    }

    return response;
  } catch (error) {
    console.error('[REPORTS_AGING_POST]', error);
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

