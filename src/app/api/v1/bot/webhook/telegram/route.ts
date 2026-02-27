import { NextRequest, NextResponse } from 'next/server';
import { telegramService } from '@/lib/services/bot/telegram.service';
import { linkTelegramChat } from '@/lib/services/telegram.service';
import { BotQueryService } from '@/lib/services/bot/query.service';
import { commandHandler } from '@/lib/services/bot/command-handler.service';
import { isRateLimited, createRateLimitResponse } from '@/lib/utils/rate-limit';
import prisma from '@/lib/db';
import { logger } from '@/lib/logger/logger.service';

/**
 * POST /api/v1/bot/webhook/telegram
 * Webhook para recibir mensajes de Telegram
 */
export async function POST(req: NextRequest) {
  try {
    // Validar token del webhook (opcional pero recomendado)
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    
    if (token && !telegramService.validateWebhookToken(token)) {
      logger.error('[TELEGRAM_WEBHOOK] Token inválido');
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_TOKEN' } },
        { status: 401 }
      );
    }

    // Parsear el update de Telegram
    let update: any;
    try {
      update = await req.json();
    } catch (error) {
      logger.error('[TELEGRAM_WEBHOOK] Error al parsear JSON:', error);
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_JSON' } },
        { status: 400 }
      );
    }

    const messageData = telegramService.parseWebhookUpdate(update);
    
    if (!messageData) {
      logger.error('[TELEGRAM_WEBHOOK] Update inválido o sin mensaje de texto');
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_UPDATE' } },
        { status: 400 }
      );
    }

    // Verificar rate limiting por chat ID
    if (isRateLimited('telegram', messageData.chatId.toString())) {
      logger.warn(`[TELEGRAM_RATE_LIMIT] Chat ${messageData.chatId} excedió el límite`);
      const rateLimitResponse = createRateLimitResponse('telegram', messageData.chatId.toString(), 'es');
      
      // Enviar mensaje de rate limit al usuario
      try {
        await telegramService.sendMessage(
          messageData.chatId,
          rateLimitResponse.error.message
        );
      } catch (sendError) {
        logger.error('[TELEGRAM_SEND_ERROR] Error al enviar mensaje de rate limit:', sendError);
      }
      
      return NextResponse.json(rateLimitResponse, {
        status: 429,
        headers: { 'Retry-After': rateLimitResponse.error.retryAfter.toString() }
      });
    }

    const isStartCommand = messageData.text.startsWith('/start');

    if (isStartCommand) {
      const parts = messageData.text.trim().split(/\s+/);
      const customerId = parts[1];

      if (customerId) {
        try {
          await linkTelegramChat(customerId, messageData.chatId.toString());
          await telegramService.sendMessage(
            messageData.chatId,
            'Tu chat de Telegram ha sido vinculado correctamente con tu cuenta de cliente.',
          );
        } catch (linkError) {
          logger.error('[TELEGRAM_LINK_ERROR]', linkError);
          await telegramService.sendMessage(
            messageData.chatId,
            'No se pudo vincular tu chat de Telegram con tu cuenta. Verifica tu identificador de cliente e inténtalo de nuevo.',
          );
        }

        return NextResponse.json({ success: true });
      }
    }

    const commandInfo = commandHandler.isCommand(messageData.text);
    
    // Log del mensaje recibido
    let messageRecord;
    try {
      messageRecord = await prisma.message.create({
        data: {
          platform: 'telegram',
          platformUserId: messageData.fromId.toString(),
          platformMessageId: messageData.messageId.toString(),
          message: messageData.text,
          isCommand: commandInfo.isCommand,
          command: commandInfo.command,
          status: 'received',
        },
      });
    } catch (logError) {
      logger.error('[MESSAGE_LOG_ERROR] Error al registrar mensaje:', logError);
    }

    // Procesar el mensaje
    let response: string;
    let intent: string | undefined;
    let confidence: number | undefined;

    try {
      if (commandInfo.isCommand && commandInfo.command) {
        // Manejar comando
        const language = commandHandler.detectLanguage(messageData.text);
        const commandResult = await commandHandler.handleCommand(
          commandInfo.command,
          language,
          commandInfo.args
        );
        response = commandResult.response;
        intent = commandResult.intent;
        confidence = commandResult.confidence;
      } else {
        // Usar el servicio de consultas del bot para procesar el mensaje
        const language = commandHandler.detectLanguage(messageData.text);
        const botQueryService = new BotQueryService();
        const queryResult = await botQueryService.executeQuery({
          query: messageData.text,
          language,
        });

        response = queryResult.response;
        intent = queryResult.intent;
        confidence = queryResult.confidence;
      }
    } catch (error) {
      logger.error('[BOT_QUERY_ERROR]', error);
      response = 'Lo siento, ocurrió un error al procesar tu consulta. Por favor, intenta nuevamente.';
      intent = 'error';
      confidence = 0;
    }

    // Enviar respuesta al usuario
    try {
      await telegramService.sendMessage(messageData.chatId, response, {
        parseMode: 'HTML',
      });
      
      // Actualizar el registro del mensaje con la respuesta
      if (messageRecord) {
        await prisma.message.update({
          where: { id: messageRecord.id },
          data: {
            response,
            intent,
            confidence,
            status: 'processed',
            processedAt: new Date(),
          },
        });
      }
    } catch (sendError) {
      logger.error('[TELEGRAM_SEND_ERROR]', sendError);
      
      // Actualizar el registro con el error
      if (messageRecord) {
        await prisma.message.update({
          where: { id: messageRecord.id },
          data: {
            response: 'Error al enviar respuesta',
            status: 'failed',
            errorMessage: 'Error al enviar mensaje de respuesta',
            processedAt: new Date(),
          },
        });
      }
      
      return NextResponse.json(
        { success: false, error: { code: 'SEND_ERROR' } },
        { status: 500 }
      );
    }

    logger.info(`[TELEGRAM_WEBHOOK] Mensaje procesado exitosamente para chat ${messageData.chatId}`);
    return NextResponse.json({ success: true });

  } catch (error) {
    logger.error('[TELEGRAM_WEBHOOK_ERROR]', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/bot/webhook/telegram
 * Endpoint para configuración del webhook de Telegram
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  
  // Verificar token para operaciones de configuración
  const token = searchParams.get('token');
  if (token && !telegramService.validateWebhookToken(token)) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_TOKEN' } },
      { status: 401 }
    );
  }

  const action = searchParams.get('action');
  
  switch (action) {
    case 'info':
      try {
        const botInfo = await telegramService.getBotInfo();
        return NextResponse.json({
          success: true,
          data: {
            bot: botInfo,
            webhook: 'activo',
            endpoints: ['POST /api/v1/bot/webhook/telegram'],
          },
        });
      } catch (error) {
        logger.error('[TELEGRAM_BOT_INFO_ERROR]', error);
        return NextResponse.json(
          { success: false, error: { code: 'BOT_INFO_ERROR' } },
          { status: 500 }
        );
      }

    default:
      return NextResponse.json({
        success: true,
        message: 'Telegram webhook activo',
        actions: ['info'],
      });
  }
}
