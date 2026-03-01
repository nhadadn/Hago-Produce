import twilio from 'twilio';
import prisma from '@/lib/db';
import { logger } from '@/lib/logger/logger.service';

// Inicializar cliente de Twilio con variables de entorno
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER!;

/**
 * Servicio para enviar mensajes de WhatsApp mediante Twilio
 */
export class WhatsAppService {
  /**
   * Envía un mensaje de WhatsApp a un número específico
   */
  async sendMessage(to: string, message: string): Promise<string> {
    try {
      // Asegurar que el número tenga el formato correcto de WhatsApp
      const formattedTo = this.formatWhatsAppNumber(to);
      
      const sentMessage = await twilioClient.messages.create({
        from: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:${formattedTo}`,
        body: message,
      });

      const maskedPhone = formattedTo.length > 5 
        ? formattedTo.slice(0, 3) + '***' + formattedTo.slice(-2)
        : '***';

      logger.info('WhatsApp message sent', {
        service: 'WhatsAppService',
        method: 'sendMessage',
        messageSid: sentMessage.sid,
        to: maskedPhone,
      });

      return sentMessage.sid;
    } catch (error) {
      logger.error('[WHATSAPP_SEND_ERROR]', error);
      throw new Error('Error al enviar mensaje de WhatsApp');
    }
  }

  /**
   * Valida la firma del webhook de Twilio
   */
  validateWebhookSignature(
    signature: string | null,
    url: string,
    body: Record<string, any>,
    authToken: string
  ): boolean {
    if (!signature) {
      return false;
    }

    try {
      return twilio.validateRequest(authToken, signature, url, body);
    } catch (error) {
      logger.error('[TWILIO_VALIDATION_ERROR]', error);
      return false;
    }
  }

  formatWhatsAppNumber(number: string): string {
    let cleaned = number.replace(/[\s\-\(\)]/g, '');
    if (cleaned.startsWith('+')) {
      return cleaned;
    }
    const digitsOnly = cleaned.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      throw new Error('Número inválido: mínimo 10 dígitos');
    }
    if (digitsOnly.startsWith('1')) {
      return `+${digitsOnly}`;
    }
    if (digitsOnly.length === 10) {
      return `+1${digitsOnly}`;
    }
    return `+${digitsOnly}`;
  }

  /**
   * Parsea el cuerpo del webhook de Twilio
   */
  parseWebhookBody(body: string): {
    from: string;
    to: string;
    message: string;
    messageSid: string;
    numMedia: number;
  } {
    const params = new URLSearchParams(body);
    const from = params.get('From')?.replace('whatsapp:', '') || '';
    const messageSid = params.get('MessageSid') || '';
    
    const maskedPhone = from.length > 5 
      ? from.slice(0, 3) + '***' + from.slice(-2)
      : '***';

    logger.info('WhatsApp message received', {
      service: 'WhatsAppService',
      method: 'parseWebhookBody',
      messageSid,
      from: maskedPhone,
    });

    return {
      from,
      to: params.get('To')?.replace('whatsapp:', '') || '',
      message: params.get('Body') || '',
      messageSid,
      numMedia: parseInt(params.get('NumMedia') || '0'),
    };
  }

  /**
   * Registra un mensaje en la base de datos
   */
  async logMessage(
    platformUserId: string,
    message: string,
    response?: string,
    intent?: string,
    confidence?: number,
    status: 'received' | 'processed' | 'failed' = 'received',
    errorMessage?: string
  ): Promise<void> {
    try {
      await prisma.message.create({
        data: {
          platform: 'whatsapp',
          platformUserId,
          message,
          response,
          intent,
          confidence,
          status,
          errorMessage,
          processedAt: status === 'processed' ? new Date() : undefined,
        },
      });
    } catch (error) {
      logger.error('[MESSAGE_LOG_ERROR]', error);
      // No lanzar error para no interrumpir el flujo principal
    }
  }

  /**
   * Actualiza el estado de un mensaje
   */
  async updateMessageStatus(
    messageId: string,
    status: 'received' | 'processed' | 'failed',
    errorMessage?: string
  ): Promise<void> {
    try {
      await prisma.message.update({
        where: { id: messageId },
        data: {
          status,
          errorMessage,
          processedAt: status === 'processed' ? new Date() : undefined,
        },
      });
    } catch (error) {
      logger.error('[MESSAGE_UPDATE_ERROR]', error);
      // No lanzar error para no interrumpir el flujo principal
    }
  }
}

// Exportar instancia singleton
export const whatsAppService = new WhatsAppService();
