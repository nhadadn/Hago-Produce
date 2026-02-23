import { NextRequest, NextResponse } from 'next/server';
import { whatsAppService } from '@/lib/services/bot/whatsapp.service';
import { BotQueryService } from '@/lib/services/bot/query.service';
import { commandHandler } from '@/lib/services/bot/command-handler.service';
import { isRateLimited, createRateLimitResponse } from '@/lib/utils/rate-limit';
import prisma from '@/lib/db';

/**
 * POST /api/v1/bot/webhook/whatsapp
 * Webhook para recibir mensajes de WhatsApp mediante Twilio
 */
export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('x-twilio-signature');
    const url = req.url;
    // Twilio webhook validation requires the raw body and the exact URL
    // Next.js req.text() consumes the body, so we need to clone it if we use it later,
    // but here we use it immediately for validation and parsing.
    const body = await req.text();
    
    // TAREA 2: Validación de Firma en Producción
    // En producción, es obligatorio validar la firma para asegurar que el request viene de Twilio
    if (process.env.NODE_ENV === 'production') {
      if (!signature || !process.env.TWILIO_AUTH_TOKEN) {
        console.error('[WHATSAPP_WEBHOOK] Falta firma o token de autenticación en producción');
        return NextResponse.json(
          { error: 'Unauthorized', code: 'MISSING_SIGNATURE' },
          { status: 401 }
        );
      }

      const isValid = whatsAppService.validateWebhookSignature(
        signature,
        process.env.TWILIO_WEBHOOK_URL || url, // Use configured URL if behind proxy/load balancer
        body,
        process.env.TWILIO_AUTH_TOKEN
      );

      if (!isValid) {
        console.error('[WHATSAPP_WEBHOOK] Firma inválida en producción');
        return NextResponse.json(
          { error: 'Unauthorized', code: 'INVALID_SIGNATURE' },
          { status: 401 }
        );
      }
    } else {
       // En desarrollo, logueamos si la firma es inválida pero permitimos el paso (útil para testing con Postman/ngrok)
       if (signature && process.env.TWILIO_AUTH_TOKEN) {
         const isValid = whatsAppService.validateWebhookSignature(
           signature,
           url,
           body,
           process.env.TWILIO_AUTH_TOKEN
         );
         if (!isValid) {
           console.warn('[WHATSAPP_WEBHOOK_DEV] Firma inválida (permitido en desarrollo)');
         }
       }
    }

    // Parsear mensaje de WhatsApp usando helper que maneja x-www-form-urlencoded
    // El body de Twilio viene como form-urlencoded string
    const params = new URLSearchParams(body);
    const messageData = {
      from: params.get('From'),
      to: params.get('To'),
      body: params.get('Body'),
      messageSid: params.get('MessageSid'),
      numMedia: params.get('NumMedia'),
    };
    
    if (!messageData.from || !messageData.body) {
      console.error('[WHATSAPP_WEBHOOK] Datos del mensaje incompletos');
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_DATA' } },
        { status: 400 }
      );
    }
    
    // Normalizar datos para uso interno
    const fromNumber = messageData.from.replace('whatsapp:', '');
    const messageText = messageData.body;

    // Verificar rate limiting por número de teléfono
    if (isRateLimited('whatsapp', fromNumber)) {
      console.warn(`[WHATSAPP_RATE_LIMIT] Usuario ${fromNumber} excedió el límite`);
      const rateLimitResponse = createRateLimitResponse('whatsapp', fromNumber, 'es');
      
      // Enviar mensaje de rate limit al usuario
      try {
        await whatsAppService.sendMessage(
          messageData.from!,
          rateLimitResponse.error.message
        );
      } catch (sendError) {
        console.error('[WHATSAPP_SEND_ERROR] Error al enviar mensaje de rate limit:', sendError);
      }
      
      return NextResponse.json(rateLimitResponse, {
        status: 429,
        headers: { 'Retry-After': rateLimitResponse.error.retryAfter.toString() }
      });
    }

    // Log del mensaje recibido
    let messageRecord;
    try {
      messageRecord = await prisma.message.create({
        data: {
          platform: 'whatsapp',
          platformUserId: fromNumber,
          platformMessageId: messageData.messageSid,
          message: messageText!,
          status: 'received',
        },
      });
    } catch (logError) {
      console.error('[MESSAGE_LOG_ERROR] Error al registrar mensaje:', logError);
    }

    // Procesar el mensaje
    let response: string;
    let intent: string | undefined;
    let confidence: number | undefined;

    try {
      // Detectar si es un comando
      const commandInfo = commandHandler.isCommand(messageText!);
      
      if (commandInfo.isCommand && commandInfo.command) {
        // Manejar comando
        const commandResult = await commandHandler.handleCommand(
          commandInfo.command,
          'es',
          commandInfo.args
        );
        response = commandResult.response;
        intent = commandResult.intent;
        confidence = commandResult.confidence;
      } else {
        // Usar el servicio de consultas del bot para procesar el mensaje
        const botQueryService = new BotQueryService();
        const queryResult = await botQueryService.executeQuery({
          query: messageText!,
          language: 'es',
        });

        response = queryResult.response;
        intent = queryResult.intent;
        confidence = queryResult.confidence;
      }
    } catch (error) {
      console.error('[BOT_QUERY_ERROR]', error);
      response = 'Lo siento, ocurrió un error al procesar tu consulta. Por favor, intenta nuevamente.';
      intent = 'error';
      confidence = 0;
    }

    // Enviar respuesta al usuario
    try {
      await whatsAppService.sendMessage(messageData.from!, response);
      
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
      console.error('[WHATSAPP_SEND_ERROR]', sendError);
      
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

    console.log(`[WHATSAPP_WEBHOOK] Mensaje procesado exitosamente para ${fromNumber}`);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[WHATSAPP_WEBHOOK_ERROR]', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/bot/webhook/whatsapp
 * Endpoint para verificación de webhook de Twilio
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  
  // Twilio envía estos parámetros para verificar el webhook
  const twilioSignature = req.headers.get('x-twilio-signature');
  const url = req.url;
  
  console.log('[WHATSAPP_WEBHOOK_VERIFICATION] Verificación solicitada');
  
  // Para desarrollo, aceptar la verificación
  // En producción, deberías validar la firma de Twilio
  return NextResponse.json({
    success: true,
    message: 'WhatsApp webhook verificado',
  });
}