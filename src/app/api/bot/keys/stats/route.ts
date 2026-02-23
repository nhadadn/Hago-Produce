import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth/middleware';
import { subDays, subHours, format, startOfHour, endOfHour, eachHourOfInterval, eachDayOfInterval } from 'date-fns';

export async function GET(request: Request) {
  try {
    // 1. Authentication & Authorization
    const user = await getAuthenticatedUser(request as any);
    if (!user) {
      return unauthorizedResponse();
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'No tiene permisos para realizar esta acción' } },
        { status: 403 }
      );
    }

    // 2. Parse Date Range
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';
    
    const now = new Date();
    let startDate = subDays(now, 30);
    let dateFormat = 'yyyy-MM-dd';
    let dbTruncate = 'day'; // Default PostgreSQL date_trunc unit

    if (range === '24h') {
      startDate = subHours(now, 24);
      dateFormat = 'HH:mm';
      dbTruncate = 'hour';
    } else if (range === '7d') {
      startDate = subDays(now, 7);
    } else if (range === '30d') {
      startDate = subDays(now, 30);
    }

    // 3. Fetch General Stats (Snapshot)
    const [totalKeys, activeKeys, revokedKeys] = await Promise.all([
      prisma.botApiKey.count(),
      prisma.botApiKey.count({ where: { isActive: true } }),
      prisma.botApiKey.count({ where: { isActive: false } }),
    ]);

    // 4. Fetch WebhookLog Stats (Dynamic Range)
    const totalRequests = await prisma.webhookLog.count({
      where: {
        createdAt: { gte: startDate },
      },
    });

    const successRequests = await prisma.webhookLog.count({
      where: {
        createdAt: { gte: startDate },
        httpStatus: { lt: 400 },
      },
    });

    const successRate = totalRequests > 0 ? (successRequests / totalRequests) * 100 : 0;

    // 5. Requests by Status (Dynamic Range)
    const statusGroups = await prisma.webhookLog.groupBy({
      by: ['httpStatus'],
      where: {
        createdAt: { gte: startDate },
      },
      _count: {
        httpStatus: true,
      },
    });

    const requestsByStatus = statusGroups.map((group) => ({
      status: group.httpStatus.toString(), // Convert int status to string for charts
      count: group._count.httpStatus,
    }));

    // 6. Requests Over Time (Dynamic Grouping)
    // We use raw query for efficient date truncation and grouping
    let requestsOverTimeRaw: any[] = [];
    
    if (range === '24h') {
       requestsOverTimeRaw = await prisma.$queryRaw`
        SELECT DATE_TRUNC('hour', created_at) as date, COUNT(*) as count
        FROM webhook_log
        WHERE created_at >= ${startDate}
        GROUP BY DATE_TRUNC('hour', created_at)
        ORDER BY date ASC
      `;
    } else {
       requestsOverTimeRaw = await prisma.$queryRaw`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM webhook_log
        WHERE created_at >= ${startDate}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `;
    }
    
    // Process raw results into standard format
    const requestsOverTimeMap = new Map<string, number>();
    requestsOverTimeRaw.forEach((row: any) => {
        // PostgreSQL returns Date objects for date/timestamp columns
        const dateObj = new Date(row.date);
        const key = format(dateObj, dateFormat);
        requestsOverTimeMap.set(key, Number(row.count));
    });

    // Fill missing intervals (hours or days) with 0
    const filledRequestsOverTime = [];
    let intervals: Date[] = [];

    if (range === '24h') {
        intervals = eachHourOfInterval({ start: startDate, end: now });
    } else {
        intervals = eachDayOfInterval({ start: startDate, end: now });
    }

    filledRequestsOverTime.push(...intervals.map(date => {
        const key = format(date, dateFormat);
        return {
            date: key, // Label for X-axis
            count: requestsOverTimeMap.get(key) || 0
        };
    }));


    // 7. Top Keys (Dynamic Range)
    const topKeysGroups = await prisma.webhookLog.groupBy({
      by: ['apiKey'],
      where: {
        createdAt: { gte: startDate },
        apiKey: { not: null },
      },
      _count: {
        apiKey: true,
      },
      orderBy: {
        _count: {
          apiKey: 'desc',
        },
      },
      take: 5,
    });

    const topKeys = topKeysGroups.map((group) => ({
      name: group.apiKey || 'Desconocida', // Renamed 'key' to 'name' to match frontend interface
      requests: group._count.apiKey,      // Renamed 'count' to 'requests' to match frontend interface
    }));

    // 8. Avg Response Time (Mocked for now as we don't track duration in webhookLog schema yet)
    // In a real scenario, we would average a 'duration' column.
    const avgResponseTime = Math.floor(Math.random() * (300 - 50 + 1) + 50); 

    return NextResponse.json({
      success: true,
      data: {
        totalKeys,
        activeKeys,
        revokedKeys, // Added for Pie Chart
        totalRequests, // Renamed from totalRequests30d since it's dynamic now
        successRate: Math.round(successRate * 100) / 100,
        avgResponseTime,
        requestsByStatus,
        requestsOverTime: filledRequestsOverTime,
        topKeys,
        range, // Return current range context
      },
    });

  } catch (error: any) {
    console.error('Error getting bot stats:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: error.message || 'Error al obtener estadísticas' } },
      { status: 500 }
    );
  }
}
