import TelegramBot from 'node-telegram-bot-api';
import prisma from '@/lib/db';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

/**
 * Servicio para enviar mensajes de Telegram
 */
export class TelegramService {
  private bot: TelegramBot | null = null;

  constructor() {
    if (TELEGRAM_BOT_TOKEN) {
      // Inicializar bot con webhook mode (sin polling)
      this.bot = new TelegramBot(TELEGRAM_BOT_TOKEN, {
        webHook: true,
        onlyFirstMatch: true,
      });
    }
  }

  /**
   * Envía un mensaje de Telegram a un chat específico
   */
  async sendMessage(chatId: number, message: string, options?: {
    parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
    disableNotification?: boolean;
  }): Promise<number> {
    if (!this.bot) {
      throw new Error('Telegram bot no está configurado');
    }

    try {
      const sentMessage = await this.bot.sendMessage(chatId, message, {
        parse_mode: options?.parseMode,
        disable_notification: options?.disableNotification,
      });

      return sentMessage.message_id;
    } catch (error) {
      console.error('[TELEGRAM_SEND_ERROR]', error);
      throw new Error('Error al enviar mensaje de Telegram');
    }
  }

  /**
   * Valida el token del webhook de Telegram
   */
  validateWebhookToken(token: string): boolean {
    return token === (TELEGRAM_BOT_TOKEN || '');
  }

  /**
   * Parsea el update del webhook de Telegram
   */
  parseWebhookUpdate(update: any): {
    updateId: number;
    messageId: number;
    chatId: number;
    fromId: number;
    text: string;
    firstName?: string;
    lastName?: string;
    username?: string;
  } | null {
    if (!update || !update.message || !update.message.text) {
      return null;
    }

    const message = update.message;
    const from = message.from;

    return {
      updateId: update.update_id,
      messageId: message.message_id,
      chatId: message.chat.id,
      fromId: from.id,
      text: message.text,
      firstName: from.first_name,
      lastName: from.last_name,
      username: from.username,
    };
  }

  /**
   * Detecta si un mensaje es un comando de Telegram
   */
  isCommand(text: string): { isCommand: boolean; command?: string; args?: string } {
    const commandMatch = text.match(/^\/([a-zA-Z0-9_]+)(?:\s+(.*))?$/);
    
    if (commandMatch) {
      return {
        isCommand: true,
        command: commandMatch[1].toLowerCase(),
        args: commandMatch[2]?.trim(),
      };
    }

    return { isCommand: false };
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
    isCommand: boolean = false,
    command?: string,
    status: 'received' | 'processed' | 'failed' = 'received',
    errorMessage?: string
  ): Promise<void> {
    try {
      await prisma.message.create({
        data: {
          platform: 'telegram',
          platformUserId,
          message,
          response,
          intent,
          confidence,
          isCommand,
          command,
          status,
          errorMessage,
          processedAt: status === 'processed' ? new Date() : undefined,
        },
      });
    } catch (error) {
      console.error('[MESSAGE_LOG_ERROR]', error);
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
      console.error('[MESSAGE_UPDATE_ERROR]', error);
      // No lanzar error para no interrumpir el flujo principal
    }
  }

  /**
   * Obtiene información del bot
   */
  async getBotInfo(): Promise<{
    id: number;
    firstName: string;
    username: string;
  }> {
    if (!this.bot) {
      throw new Error('Telegram bot no está configurado');
    }

    try {
      const botInfo = await this.bot.getMe();
      return {
        id: botInfo.id,
        firstName: botInfo.first_name,
        username: botInfo.username!,
      };
    } catch (error) {
      console.error('[TELEGRAM_BOT_INFO_ERROR]', error);
      throw new Error('Error al obtener información del bot');
    }
  }

  /**
   * Maneja comandos básicos de Telegram
   */
  async handleCommand(
    chatId: number,
    command: string,
    args?: string,
    language: string = 'es'
  ): Promise<string> {
    switch (command) {
      case 'start':
        return language === 'es'
          ? '¡Hola! Soy el bot de Hago Produce. Puedo ayudarte con información sobre facturas, clientes, productos y más. Escribe /help para ver los comandos disponibles.'
          : 'Hello! I am the Hago Produce bot. I can help you with information about invoices, customers, products, and more. Type /help to see available commands.';

      case 'help':
        return language === 'es'
          ? '📋 *Comandos disponibles:*\n\n'
          + '• /start - Iniciar conversación\n'
          + '• /help - Mostrar esta ayuda\n'
          + '• /status - Estado del sistema\n\n'
          + '💡 *También puedes preguntarme:*\n'
          + '• "¿Cuáles son mis facturas pendientes?"\n'
          + '• "Buscar cliente ABC123"\n'
          + '• "Listar productos"\n'
          + '• "Ver proveedores activos"\n'
          + '• "¿Cuánto debo?"'
          : '📋 *Available commands:*\n\n'
          + '• /start - Start conversation\n'
          + '• /help - Show this help\n'
          + '• /status - System status\n\n'
          + '💡 *You can also ask me:*\n'
          + '• "What are my pending invoices?"\n'
          + '• "Find customer ABC123"\n'
          + '• "List products"\n'
          + '• "View active suppliers"\n'
          + '• "How much do I owe?"';

      case 'status':
        // Obtener estadísticas básicas del sistema
        try {
          const [customerCount, invoiceCount, productCount] = await Promise.all([
            prisma.customer.count({ where: { isActive: true } }),
            prisma.invoice.count(),
            prisma.product.count({ where: { isActive: true } }),
          ]);

          return language === 'es'
            ? `📊 *Estado del sistema:*\n\n`
            + `• ${customerCount} clientes activos\n`
            + `• ${invoiceCount} facturas registradas\n`
            + `• ${productCount} productos activos\n\n`
            + '✅ Sistema operativo'
            : `📊 *System status:*\n\n`
            + `• ${customerCount} active customers\n`
            + `• ${invoiceCount} invoices registered\n`
            + `• ${productCount} active products\n\n`
            + '✅ System operational';
        } catch (error) {
          console.error('[STATUS_COMMAND_ERROR]', error);
          return language === 'es'
            ? '❌ Error al obtener estado del sistema'
            : '❌ Error getting system status';
        }

      default:
        return language === 'es'
          ? `❓ Comando desconocido: /${command}. Escribe /help para ver los comandos disponibles.`
          : `❓ Unknown command: /${command}. Type /help to see available commands.`;
    }
  }
}

// Exportar instancia singleton
export const telegramService = new TelegramService();