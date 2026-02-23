import { NextRequest, NextResponse } from 'next/server';
import { ProductPriceService } from '@/lib/services/product-prices/product-prices.service';

const MAKE_WEBHOOK_SECRET = process.env.MAKE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  try {
    // 1. Verificación de API Key
    const apiKey = req.headers.get('x-api-key');
    
    // ¿Permitir si está en desarrollo y no hay secreto configurado? No, seguro por defecto.
    if (!MAKE_WEBHOOK_SECRET || apiKey !== MAKE_WEBHOOK_SECRET) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid API Key' } },
        { status: 401 }
      );
    }

    const body = await req.json();

    if (!body.prices || !Array.isArray(body.prices)) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Invalid payload structure' } },
        { status: 400 }
      );
    }

    // 3. Procesar
    const result = await ProductPriceService.bulkUpdateFromMake(body);

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error('Error processing Make.com webhook:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'Error processing webhook' } },
      { status: 500 }
    );
  }
}
