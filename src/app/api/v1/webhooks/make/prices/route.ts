import { NextRequest, NextResponse } from 'next/server';
import { ProductPriceService } from '@/lib/services/product-prices/product-prices.service';

export async function POST(req: NextRequest) {
  try {
    const apiKeyHeader = req.headers.get('x-api-key');
    const expectedApiKey = process.env.MAKE_WEBHOOK_API_KEY;

    if (!expectedApiKey || !apiKeyHeader || apiKeyHeader !== expectedApiKey) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_API_KEY', message: 'API Key inválida' } },
        { status: 401 }
      );
    }

    const body = await req.json();

    if (!body || !Array.isArray(body.prices)) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Estructura de payload inválida' } },
        { status: 400 }
      );
    }

    const result = await ProductPriceService.bulkUpdateFromMake(body);

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
      { status: 500 }
    );
  }
}

