import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth/middleware';
import { getProductPriceTrends } from '@/lib/services/reports';
import { priceTrendsReportSchema } from '@/lib/validation/reports';
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
    const validation = priceTrendsReportSchema.safeParse(body);

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

    const { productId, months } = validation.data;

    const trends = await getProductPriceTrends(productId, months ?? 6);

    return NextResponse.json({ success: true, data: trends });
  } catch (error) {
    console.error('[REPORTS_PRICE_TRENDS_POST]', error);
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

