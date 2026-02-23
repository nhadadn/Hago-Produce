import { NextResponse } from 'next/server';
import { BotApiKeyService } from '@/lib/services/bot/api-key.service';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth/middleware';
import { logAudit } from '@/lib/audit/logger';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function DELETE(request: Request, { params }: RouteParams) {
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

    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'ID es requerido' } },
        { status: 400 }
      );
    }

    // Verificar existencia antes de revocar para audit log correcto
    const existingKey = await BotApiKeyService.getById(id);
    if (!existingKey) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'API Key no encontrada' } },
        { status: 404 }
      );
    }

    await BotApiKeyService.revoke(id);

    // 3. Audit Logging
    await logAudit({
      action: 'revoke',
      entityType: 'bot_api_key',
      entityId: id,
      userId: user.userId,
      changes: {
        isActive: { old: true, new: false }
      }
    });

    return NextResponse.json({ success: true, message: 'API Key revocada exitosamente' });
  } catch (error: any) {
    console.error('Error revoking API key:', error);
    
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: error.message || 'Error al revocar la clave de API' } },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
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

    const { id } = params;
    
    if (!id) {
       return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'ID es requerido' } },
        { status: 400 }
      );
    }

    const existingKey = await BotApiKeyService.getById(id);
    if (!existingKey) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'API Key no encontrada' } },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { action } = body;

    // Caso especial: Rotación de clave
    if (action === 'rotate') {
      const result = await BotApiKeyService.rotate(id);
      
      // Audit Log for Rotation
      await logAudit({
        action: 'rotate',
        entityType: 'bot_api_key',
        entityId: id,
        userId: user.userId,
        changes: {
          hashedKey: { old: '***', new: '***' } // Just indicating it changed
        }
      });

      return NextResponse.json({ 
        success: true, 
        data: result,
        message: 'API Key rotada exitosamente' 
      });
    }

    // Caso normal: Actualización de metadatos
    const { name, description, rateLimit, isActive } = body;
    
    // Validate name if provided
    if (name) {
      const sanitizedName = name.replace(/[^a-zA-Z0-9-_]/g, '');
      if (sanitizedName !== name) {
         return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: 'El nombre contiene caracteres inválidos' } },
          { status: 400 }
        );
      }
    }

    const updatedKey = await BotApiKeyService.update(id, {
      name,
      description,
      rateLimit: rateLimit !== undefined ? Number(rateLimit) : undefined,
      isActive: isActive !== undefined ? Boolean(isActive) : undefined,
    });

    // Audit Log for Update
    // Calculate changes
    const changes: Record<string, { old: any, new: any }> = {};
    if (name && name !== existingKey.name) changes.name = { old: existingKey.name, new: name };
    if (description !== undefined && description !== existingKey.description) changes.description = { old: existingKey.description, new: description };
    if (rateLimit !== undefined && Number(rateLimit) !== existingKey.rateLimit) changes.rateLimit = { old: existingKey.rateLimit, new: Number(rateLimit) };
    if (isActive !== undefined && Boolean(isActive) !== existingKey.isActive) changes.isActive = { old: existingKey.isActive, new: Boolean(isActive) };

    if (Object.keys(changes).length > 0) {
      await logAudit({
        action: 'update',
        entityType: 'bot_api_key',
        entityId: id,
        userId: user.userId,
        changes
      });
    }

    return NextResponse.json({ 
      success: true, 
      data: updatedKey,
      message: 'API Key actualizada exitosamente' 
    });

  } catch (error: any) {
    console.error('Error updating/rotating API key:', error);

    if (error.message === 'API key no encontrada' || error.code === 'P2025') {
       return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'API Key no encontrada' } },
        { status: 404 }
      );
    }

    if (error.message === 'Ya existe una API key con ese nombre') {
      return NextResponse.json(
        { success: false, error: { code: 'DUPLICATE_ERROR', message: error.message } },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: error.message || 'Error al actualizar la clave de API' } },
      { status: 500 }
    );
  }
}
