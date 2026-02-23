import prisma from '@/lib/db';

/**
 * Manejador de comandos básicos para bots de WhatsApp y Telegram
 */
export class CommandHandler {
  /**
   * Procesa comandos básicos y retorna la respuesta correspondiente
   */
  async handleCommand(
    command: string,
    language: string = 'es',
    args?: string
  ): Promise<{
    response: string;
    intent: string;
    confidence: number;
  }> {
    const lowerCommand = command.toLowerCase();

    switch (lowerCommand) {
      case 'start':
        return {
          response: this.getStartMessage(language),
          intent: 'command_start',
          confidence: 1.0,
        };

      case 'help':
        return {
          response: this.getHelpMessage(language),
          intent: 'command_help',
          confidence: 1.0,
        };

      case 'status':
        return await this.getStatusMessage(language);

      default:
        return {
          response: this.getUnknownCommandMessage(lowerCommand, language),
          intent: 'command_unknown',
          confidence: 1.0,
        };
    }
  }

  /**
   * Detecta si un mensaje es un comando
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

    // También detectar comandos sin slash para WhatsApp
    const whatsappCommandMatch = text.match(/^(start|help|status|ayuda|estado|hola)$/i);
    if (whatsappCommandMatch) {
      return {
        isCommand: true,
        command: whatsappCommandMatch[1].toLowerCase(),
        args: undefined,
      };
    }

    return { isCommand: false };
  }

  /**
   * Detecta el idioma del mensaje basándose en palabras clave
   */
  detectLanguage(text: string): 'es' | 'en' {
    const spanishWords = [
      'hola', 'ayuda', 'factura', 'cliente', 'producto', 'proveedor', 
      'saldo', 'cuánto', 'estado', 'información', 'consulta'
    ];
    const englishWords = [
      'hello', 'help', 'invoice', 'customer', 'product', 'supplier',
      'balance', 'how much', 'status', 'information', 'query'
    ];
    
    const lowerText = text.toLowerCase();
    
    const spanishScore = spanishWords.filter(word => lowerText.includes(word)).length;
    const englishScore = englishWords.filter(word => lowerText.includes(word)).length;
    
    return spanishScore >= englishScore ? 'es' : 'en';
  }

  /**
   * Mensaje de bienvenida
   */
  private getStartMessage(language: string): string {
    return language === 'es'
      ? '¡Hola! Soy el bot de Hago Produce. 🏢\n\n'
      + 'Puedo ayudarte con información sobre:\n'
      + '• 📄 Facturas y pagos\n'
      + '• 👥 Clientes\n'
      + '📦 Productos y precios\n'
      + '🏭 Proveedores\n'
      + '💰 Saldos pendientes\n\n'
      + '💡 Escribe /help para ver los comandos disponibles o simplemente pregúntame lo que necesites.'
      : 'Hello! I am the Hago Produce bot. 🏢\n\n'
      + 'I can help you with information about:\n'
      + '• 📄 Invoices and payments\n'
      + '• 👥 Customers\n'
      + '📦 Products and prices\n'
      + '🏭 Suppliers\n'
      + '💰 Pending balances\n\n'
      + '💡 Type /help to see available commands or just ask me what you need.';
  }

  /**
   * Mensaje de ayuda
   */
  private getHelpMessage(language: string): string {
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
      + '• "¿Cuánto debo?"\n'
      + '• "Factura F-2024-001"\n'
      + '• "Productos del proveedor X"\n\n'
      + '📝 *Consejos:*\n'
      + '• Sé específico en tus consultas\n'
      + '• Puedo entender facturas por número o cliente\n'
      + '• Los códigos de cliente ayudan a refinar búsquedas'
      : '📋 *Available commands:*\n\n'
      + '• /start - Start conversation\n'
      + '• /help - Show this help\n'
      + '• /status - System status\n\n'
      + '💡 *You can also ask me:*\n'
      + '• "What are my pending invoices?"\n'
      + '• "Find customer ABC123"\n'
      + '• "List products"\n'
      + '• "View active suppliers"\n'
      + '• "How much do I owe?"\n'
      + '• "Invoice F-2024-001"\n'
      + '• "Products from supplier X"\n\n'
      + '📝 *Tips:*\n'
      + '• Be specific in your queries\n'
      + '• I can understand invoices by number or customer\n'
      + '• Customer codes help refine searches';
  }

  /**
   * Mensaje de estado del sistema
   */
  private async getStatusMessage(language: string): Promise<{
    response: string;
    intent: string;
    confidence: number;
  }> {
    try {
      const [customerCount, invoiceCount, productCount, supplierCount] = await Promise.all([
        prisma.customer.count({ where: { isActive: true } }),
        prisma.invoice.count(),
        prisma.product.count({ where: { isActive: true } }),
        prisma.supplier.count({ where: { isActive: true } }),
      ]);

      const pendingInvoices = await prisma.invoice.count({
        where: { status: { in: ['PENDING', 'OVERDUE'] } }
      });

      const totalRevenue = await prisma.invoice.aggregate({
        where: { status: 'PAID' },
        _sum: { total: true }
      });

      const response = language === 'es'
        ? `📊 *Estado del sistema Hago Produce:*\n\n`
        + `👥 *Clientes:* ${customerCount} activos\n`
        + `📄 *Facturas:* ${invoiceCount} registradas\n`
        + `⏳ *Pendientes:* ${pendingInvoices} facturas\n`
        + `📦 *Productos:* ${productCount} activos\n`
        + `🏭 *Proveedores:* ${supplierCount} activos\n`
        + `💰 *Ingresos:* $${totalRevenue._sum.total?.toString() || '0'} pagados\n\n`
        + '✅ Sistema operativo y actualizado'
        : `📊 *Hago Produce System Status:*\n\n`
        + `👥 *Customers:* ${customerCount} active\n`
        + `📄 *Invoices:* ${invoiceCount} registered\n`
        + `⏳ *Pending:* ${pendingInvoices} invoices\n`
        + `📦 *Products:* ${productCount} active\n`
        + `🏭 *Suppliers:* ${supplierCount} active\n`
        + `💰 *Revenue:* $${totalRevenue._sum.total?.toString() || '0'} paid\n\n`
        + '✅ System operational and up to date';

      return {
        response,
        intent: 'command_status',
        confidence: 1.0,
      };
    } catch (error) {
      console.error('[STATUS_COMMAND_ERROR]', error);
      
      return {
        response: language === 'es'
          ? '❌ Error al obtener estado del sistema'
          : '❌ Error getting system status',
        intent: 'command_status_error',
        confidence: 1.0,
      };
    }
  }

  /**
   * Mensaje para comando desconocido
   */
  private getUnknownCommandMessage(command: string, language: string): string {
    return language === 'es'
      ? `❓ Comando desconocido: /${command}\n\n`
      + 'Escribe /help para ver los comandos disponibles o simplemente pregúntame lo que necesites.'
      : `❓ Unknown command: /${command}\n\n`
      + 'Type /help to see available commands or just ask me what you need.';
  }
}

// Exportar instancia singleton
export const commandHandler = new CommandHandler();