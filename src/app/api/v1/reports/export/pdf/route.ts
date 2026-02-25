import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth/middleware';
import { Role } from '@prisma/client';
import { getUserRateLimitKey, isRateLimited } from '@/lib/rate-limit';
import {
  getRevenueMetrics,
  getAgingReport,
  getTopCustomers,
  getTopProducts,
  getProductPriceTrends,
} from '@/lib/services/reports';
import { buildPDF, ReportType } from '@/lib/services/reports/export';

const ALLOWED_ROLES: Role[] = [Role.ADMIN, Role.ACCOUNTING, Role.MANAGEMENT];
const MAX_REQUESTS_PER_MINUTE = 10;

const exportPDFSchema = z.object({
  reportType: z.enum(['revenue', 'aging', 'top-customers', 'top-products', 'price-trends']),
  filters: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    customerId: z.string().optional(),
    asOfDate: z.string().optional(),
    productId: z.string().optional(),
    months: z.number().int().min(1).max(24).optional(),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    if (!ALLOWED_ROLES.includes(user.role as Role)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'No tienes permisos para exportar reportes' } },
        { status: 403 }
      );
    }

    const rateKey = getUserRateLimitKey(user.userId, req);
    if (isRateLimited(rateKey, MAX_REQUESTS_PER_MINUTE)) {
      return NextResponse.json(
        { success: false, error: { code: 'RATE_LIMITED', message: 'Demasiadas solicitudes de exportación. Intente de nuevo más tarde.' } },
        { status: 429 }
      );
    }

    const body = await req.json();
    const validation = exportPDFSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: validation.error.errors[0].message } },
        { status: 400 }
      );
    }

    const { reportType, filters } = validation.data;

    let data: any;
    switch (reportType) {
      case 'revenue': {
        if (!filters.startDate || !filters.endDate) {
          return NextResponse.json(
            { success: false, error: { code: 'VALIDATION_ERROR', message: 'startDate y endDate son requeridos para revenue' } },
            { status: 400 }
          );
        }
        const start = new Date(filters.startDate);
        const end = new Date(filters.endDate);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
          return NextResponse.json(
            { success: false, error: { code: 'VALIDATION_ERROR', message: 'Rango de fechas inválido' } },
            { status: 400 }
          );
        }
        data = await getRevenueMetrics(start, end, { customerId: filters.customerId });
        break;
      }
      case 'aging': {
        const asOf = filters.asOfDate ? new Date(filters.asOfDate) : new Date();
        if (Number.isNaN(asOf.getTime())) {
          return NextResponse.json(
            { success: false, error: { code: 'VALIDATION_ERROR', message: 'asOfDate inválida' } },
            { status: 400 }
          );
        }
        data = await getAgingReport(asOf, { customerId: filters.customerId });
        break;
      }
      case 'top-customers': {
        const now = new Date();
        const start = filters.startDate ? new Date(filters.startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
        const end = filters.endDate ? new Date(filters.endDate) : now;
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
          return NextResponse.json(
            { success: false, error: { code: 'VALIDATION_ERROR', message: 'Rango de fechas inválido' } },
            { status: 400 }
          );
        }
        data = await getTopCustomers(10, start, end);
        break;
      }
      case 'top-products': {
        const now = new Date();
        const start = filters.startDate ? new Date(filters.startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
        const end = filters.endDate ? new Date(filters.endDate) : now;
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
          return NextResponse.json(
            { success: false, error: { code: 'VALIDATION_ERROR', message: 'Rango de fechas inválido' } },
            { status: 400 }
          );
        }
        data = await getTopProducts(10, start, end);
        break;
      }
      case 'price-trends': {
        if (!filters.productId) {
          return NextResponse.json(
            { success: false, error: { code: 'VALIDATION_ERROR', message: 'productId es requerido para price-trends' } },
            { status: 400 }
          );
        }
        data = await getProductPriceTrends(filters.productId, filters.months ?? 6);
        break;
      }
      default:
        throw new Error(`ReportType no soportado: ${reportType}`);
    }

    const { buffer, filename } = buildPDF(reportType as ReportType, data);

    return new NextResponse(new Blob([buffer as any]), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('[REPORTS_EXPORT_PDF]', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
      { status: 500 }
    );
  }
}