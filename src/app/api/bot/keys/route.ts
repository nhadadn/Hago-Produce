import { NextResponse } from 'next/server';
import { BotApiKeyService } from '@/lib/services/bot/api-key.service';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth/middleware';
import { logAudit } from '@/lib/audit/logger';
import { InMemoryRateLimiter } from '@/lib/rate-limit';
import { logger } from '@/lib/logger/logger.service';

export async function GET(request: Request) {
  try {
    // 1. Authentication
    // Casting Request to any because getAuthenticatedUser expects NextRequest but works with Request
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

    const keys = await BotApiKeyService.list();
    return NextResponse.json({ success: true, data: keys });
  } catch (error: any) {
    logger.error('Error listing API keys:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: error.message || 'Error al listar las claves de API' } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
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

    // 4. Rate Limiting (5 requests per minute per user)
    const rateLimiter = InMemoryRateLimiter.getInstance();
    const isAllowed = rateLimiter.check(user.userId, 5, 60 * 1000);
    
    if (!isAllowed) {
      return NextResponse.json(
        { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Ha excedido el límite de creación de API keys (máx 5/min)' } },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { name, description, rateLimit, expiresAt } = body;

    // 5. Input Validation
    if (!name) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'El nombre es obligatorio' } },
        { status: 400 }
      );
    }

    // Sanitize name (alphanumeric, dashes, underscores only)
    const sanitizedName = name.replace(/[^a-zA-Z0-9-_]/g, '');
    if (sanitizedName !== name) {
       return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'El nombre contiene caracteres inválidos' } },
        { status: 400 }
      );
    }

    const result = await BotApiKeyService.create({
      name: sanitizedName,
      description,
      rateLimit: rateLimit ? Number(rateLimit) : undefined,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });
    
    // 3. Audit Logging
    await logAudit({
      action: 'create',
      entityType: 'bot_api_key',
      entityId: result.info.id,
      userId: user.userId,
      changes: {
        name: { old: undefined, new: result.info.name },
        description: { old: undefined, new: result.info.description },
        rateLimit: { old: undefined, new: result.info.rateLimit },
        expiresAt: { old: undefined, new: result.info.expiresAt },
      }
    });

    // Retornamos la clave generada solo una vez
    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: any) {
    logger.error('Error creating API key:', error);
    
    if (error.message === 'Ya existe una API key con ese nombre') {
      return NextResponse.json(
        { success: false, error: { code: 'DUPLICATE_ERROR', message: error.message } },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'Error al crear la clave de API' } }, // Generic message to avoid leaking sensitive info
      { status: 500 }
    );
  }
}
