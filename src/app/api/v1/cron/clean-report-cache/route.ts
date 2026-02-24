import { NextRequest, NextResponse } from 'next/server';
import { invalidateCache } from '@/lib/utils/report-cache';

export const dynamic = 'force-dynamic'; // Prevent static optimization

export async function GET(req: NextRequest) {
  try {
    const secret = req.headers.get('x-cron-secret');
    if (!secret || secret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'No autorizado' } },
        { status: 401 },
      );
    }

    // Call invalidateCache without parameters to clear expired caches
    const deletedCount = await invalidateCache();

    return NextResponse.json({
      success: true,
      deleted: deletedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[CRON_CLEAN_REPORT_CACHE]', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
      { status: 500 },
    );
  }
}
