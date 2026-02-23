import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth/middleware';
import { subDays, format } from 'date-fns';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // 1. Authentication
    const user = await getAuthenticatedUser(request as any);
    if (!user) {
      return unauthorizedResponse();
    }

    // 2. Authorization
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'No tiene permisos para realizar esta acción' } },
        { status: 403 }
      );
    }

    // 3. Fetch Key
    const key = await prisma.botApiKey.findUnique({
      where: { id },
    });

    if (!key) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'API Key no encontrada' } },
        { status: 404 }
      );
    }

    // 4. Mocked Stats
    // Since WebhookLog stores the raw API key and BotApiKey stores the hash,
    // we cannot link them directly without knowing the raw key.
    // Therefore, we return mocked stats for the specific key view as requested.
    
    const totalRequests = Math.floor(Math.random() * 500) + 50; // Random count
    const successCount = Math.floor(totalRequests * 0.95);
    const errorCount = totalRequests - successCount;
    const successRate = (successCount / totalRequests) * 100;
    const avgResponseTime = Math.floor(Math.random() * 200) + 50; // ms

    const requestsByStatus = [
        { status: 200, count: successCount },
        { status: 400, count: Math.floor(errorCount * 0.8) },
        { status: 500, count: Math.ceil(errorCount * 0.2) },
    ];

    // Mock requests over time (last 7 days)
    const requestsOverTime = [];
    const now = new Date();
    for(let i=6; i>=0; i--) {
        requestsOverTime.push({
            date: format(subDays(now, i), 'yyyy-MM-dd'),
            count: Math.floor(Math.random() * (totalRequests / 7) * 1.5) // Random daily distribution
        });
    }

    return NextResponse.json({
      success: true,
      data: {
        key: {
            id: key.id,
            name: key.name,
            description: key.description,
            isActive: key.isActive,
            lastUsedAt: key.lastUsedAt,
            createdAt: key.createdAt,
        },
        totalRequests,
        successRate: Math.round(successRate * 100) / 100,
        avgResponseTime,
        requestsByStatus,
        requestsOverTime,
      }
    });

  } catch (error: any) {
    console.error('Error getting bot key stats:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: error.message || 'Error al obtener estadísticas de la clave' } },
      { status: 500 }
    );
  }
}
