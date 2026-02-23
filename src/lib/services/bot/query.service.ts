import { z } from 'zod';
import prisma from '@/lib/db';

export const botQuerySchema = z.object({
  query: z.string().min(1, 'La consulta no puede estar vacía'),
  language: z.enum(['es', 'en']).default('es'),
  context: z
    .object({
      customerId: z.string().uuid().optional(),
    })
    .optional(),
});

export type BotQueryInput = z.infer<typeof botQuerySchema>;

export interface BotQueryResult {
  response: string;
  intent: string;
  confidence: number;
  sources: Array<{
    type: 'invoice' | 'customer' | 'product' | 'supplier';
    id: string;
    name?: string;
    description?: string;
  }>;
}

/**
 * Servicio de procesamiento de consultas para bots externos
 * Reutiliza lógica de chat existente y consulta datos del sistema
 */
export class BotQueryService {
  /**
   * Procesa una consulta de bot y retorna respuesta estructurada
   */
  async executeQuery(input: BotQueryInput): Promise<BotQueryResult> {
    const { query, language, context } = input;

    // Detectar intención y entidades de la consulta
    const { intent, confidence, entities } = await this.detectIntent(query, language);

    // Ejecutar acción según intención
    const result = await this.executeIntent(intent, entities, context, language);

    return {
      response: result.response,
      intent,
      confidence,
      sources: result.sources || [],
    };
  }

  /**
   * Detecta la intención del usuario basándose en la consulta
   */
  private async detectIntent(query: string, language: string): Promise<{
    intent: string;
    confidence: number;
    entities: Record<string, any>;
  }> {
    const lowerQuery = query.toLowerCase();
    const entities: Record<string, any> = {};

    // Detectar número de factura (ej: "F-2024-001", "factura 123")
    const invoiceMatch = query.match(/(?:f[-\s]?|factura\s+)(\d{4}[-\s]?\d+)/i);
    if (invoiceMatch) {
      entities.invoiceNumber = invoiceMatch[1].replace(/\s/g, '');
    }

    // Detectar ID de cliente (ej: "cliente ABC123", "customer XYZ")
    const customerMatch = query.match(/(?:cliente|customer)\s+([A-Z0-9]+)/i);
    if (customerMatch) {
      entities.customerId = customerMatch[1];
    }

    // Detectar fecha (ej: "este mes", "enero 2024", "2024-01-15")
    const dateMatch = query.match(/(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}|este mes|este a\u00f1o|hoy|ayer)/i);
    if (dateMatch) {
      entities.date = this.parseDate(dateMatch[1]);
    }

    // Detectar intención principal
    let intent = 'unknown';
    let confidence = 0.1;

    // Consultas sobre facturas
    if (this.isInvoiceQuery(lowerQuery, language)) {
      intent = 'invoice.query';
      confidence = 0.8;
    }
    // Consultas sobre clientes
    else if (this.isCustomerQuery(lowerQuery, language)) {
      intent = 'customer.query';
      confidence = 0.8;
    }
    // Consultas sobre productos
    else if (this.isProductQuery(lowerQuery, language)) {
      intent = 'product.query';
      confidence = 0.8;
    }
    // Consultas sobre proveedores
    else if (this.isSupplierQuery(lowerQuery, language)) {
      intent = 'supplier.query';
      confidence = 0.8;
    }
    // Saldo pendiente
    else if (this.isBalanceQuery(lowerQuery, language)) {
      intent = 'balance.query';
      confidence = 0.9;
    }
    // Ayuda general
    else if (this.isHelpQuery(lowerQuery, language)) {
      intent = 'help.query';
      confidence = 0.9;
    }

    return { intent, confidence, entities };
  }

  /**
   * Ejecuta la acción correspondiente a la intención detectada
   */
  private async executeIntent(
    intent: string,
    entities: Record<string, any>,
    context?: { customerId?: string },
    language: string = 'es'
  ): Promise<{ response: string; sources: any[] }> {
    switch (intent) {
      case 'invoice.query':
        return this.handleInvoiceQuery(entities, context, language);
      case 'customer.query':
        return this.handleCustomerQuery(entities, context, language);
      case 'product.query':
        return this.handleProductQuery(entities, context, language);
      case 'supplier.query':
        return this.handleSupplierQuery(entities, context, language);
      case 'balance.query':
        return this.handleBalanceQuery(entities, context, language);
      case 'help.query':
        return this.handleHelpQuery(language);
      default:
        return this.handleUnknownQuery(language);
    }
  }

  /**
   * Maneja consultas sobre facturas
   */
  private async handleInvoiceQuery(
    entities: Record<string, any>,
    context?: { customerId?: string },
    language: string = 'es'
  ): Promise<{ response: string; sources: any[] }> {
    const where: any = {};

    if (entities.invoiceNumber) {
      where.number = entities.invoiceNumber;
    }

    if (context?.customerId) {
      where.customerId = context.customerId;
    } else if (entities.customerId) {
      // Buscar cliente por taxId o ID
      const customer = await prisma.customer.findFirst({
        where: {
          OR: [
            { id: entities.customerId },
            { taxId: entities.customerId },
          ],
        },
      });

      if (customer) {
        where.customerId = customer.id;
      }
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    if (invoices.length === 0) {
      return {
        response: language === 'es' 
          ? 'No encontr\u00e9 facturas que coincidan con tu consulta.'
          : 'I could not find invoices matching your query.',
        sources: [],
      };
    }

    const sources = invoices.map(inv => ({
      type: 'invoice' as const,
      id: inv.id,
      name: inv.number,
      description: `${inv.customer.name} - $${inv.total.toString()} - ${inv.status}`,
    }));

    const response = this.formatInvoiceResponse(invoices, language);

    return { response, sources };
  }

  /**
   * Maneja consultas sobre clientes
   */
  private async handleCustomerQuery(
    entities: Record<string, any>,
    context?: { customerId?: string },
    language: string = 'es'
  ): Promise<{ response: string; sources: any[] }> {
    const where: any = {};

    if (entities.customerId) {
      where.OR = [
        { id: entities.customerId },
        { taxId: entities.customerId },
      ];
    }

    if (context?.customerId) {
      where.id = context.customerId;
    }

    const customers = await prisma.customer.findMany({
      where,
      include: {
        invoices: {
          select: {
            id: true,
            number: true,
            status: true,
            total: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
      },
      orderBy: { name: 'asc' },
      take: 5,
    });

    if (customers.length === 0) {
      return {
        response: language === 'es'
          ? 'No encontr\u00e9 clientes que coincidan con tu consulta.'
          : 'I could not find customers matching your query.',
        sources: [],
      };
    }

    const sources = customers.map(cust => ({
      type: 'customer' as const,
      id: cust.id,
      name: cust.name,
      description: `Tax ID: ${cust.taxId} - ${cust.invoices.length} facturas`,
    }));

    const response = this.formatCustomerResponse(customers, language);

    return { response, sources };
  }

  /**
   * Maneja consultas sobre productos
   */
  private async handleProductQuery(
    entities: Record<string, any>,
    context?: { customerId?: string },
    language: string = 'es'
  ): Promise<{ response: string; sources: any[] }> {
    const where: any = {};

    if (entities.productName) {
      where.name = { contains: entities.productName, mode: 'insensitive' };
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        prices: {
          where: { isCurrent: true },
          include: {
            supplier: true,
          },
        },
      },
      orderBy: { name: 'asc' },
      take: 5,
    });

    if (products.length === 0) {
      return {
        response: language === 'es'
          ? 'No encontr\u00e9 productos que coincidan con tu consulta.'
          : 'I could not find products matching your query.',
        sources: [],
      };
    }

    const sources = products.map(prod => ({
      type: 'product' as const,
      id: prod.id,
      name: prod.name,
      description: `${prod.category || 'Sin categor\u00eda'} - ${prod.prices.length} precios activos`,
    }));

    const response = this.formatProductResponse(products, language);

    return { response, sources };
  }

  /**
   * Maneja consultas sobre proveedores
   */
  private async handleSupplierQuery(
    entities: Record<string, any>,
    context?: { customerId?: string },
    language: string = 'es'
  ): Promise<{ response: string; sources: any[] }> {
    const suppliers = await prisma.supplier.findMany({
      where: { isActive: true },
      include: {
        prices: {
          where: { isCurrent: true },
          select: { id: true, productId: true },
        },
      },
      orderBy: { name: 'asc' },
      take: 5,
    });

    if (suppliers.length === 0) {
      return {
        response: language === 'es'
          ? 'No hay proveedores activos en el sistema.'
          : 'There are no active suppliers in the system.',
        sources: [],
      };
    }

    const sources = suppliers.map(supp => ({
      type: 'supplier' as const,
      id: supp.id,
      name: supp.name,
      description: `${supp.prices.length} productos - Contacto: ${supp.contactName || 'N/A'}`,
    }));

    const response = this.formatSupplierResponse(suppliers, language);

    return { response, sources };
  }

  /**
   * Maneja consultas sobre saldo pendiente
   */
  private async handleBalanceQuery(
    entities: Record<string, any>,
    context?: { customerId?: string },
    language: string = 'es'
  ): Promise<{ response: string; sources: any[] }> {
    const where: any = { status: { in: ['PENDING', 'OVERDUE'] } };

    if (context?.customerId) {
      where.customerId = context.customerId;
    } else if (entities.customerId) {
      const customer = await prisma.customer.findFirst({
        where: {
          OR: [
            { id: entities.customerId },
            { taxId: entities.customerId },
          ],
        },
      });

      if (customer) {
        where.customerId = customer.id;
      }
    }

    const pendingInvoices = await prisma.invoice.findMany({
      where,
      include: {
        customer: true,
      },
      orderBy: { dueDate: 'asc' },
    });

    const totalPending = pendingInvoices.reduce((sum, inv) => sum + Number(inv.total), 0);

    if (pendingInvoices.length === 0) {
      return {
        response: language === 'es'
          ? 'No hay facturas pendientes de pago.'
          : 'There are no pending invoices.',
        sources: [],
      };
    }

    const sources = pendingInvoices.map(inv => ({
      type: 'invoice' as const,
      id: inv.id,
      name: inv.number,
      description: `${inv.customer.name} - $${inv.total.toString()} - Vence: ${inv.dueDate.toLocaleDateString()}`,
    }));

    const response = language === 'es'
      ? `Hay ${pendingInvoices.length} facturas pendientes por un total de $${totalPending.toFixed(2)}. `
      + `La factura m\u00e1s antigua vence el ${pendingInvoices[0].dueDate.toLocaleDateString()}.`
      : `There are ${pendingInvoices.length} pending invoices totaling $${totalPending.toFixed(2)}. `
      + `The oldest invoice is due on ${pendingInvoices[0].dueDate.toLocaleDateString()}.`;

    return { response, sources };
  }

  /**
   * Maneja consultas de ayuda
   */
  private handleHelpQuery(language: string = 'es'): { response: string; sources: any[] } {
    const response = language === 'es'
      ? 'Puedo ayudarte con informaci\u00f3n sobre:\n\n'
      + '• Facturas: "¿Cu\u00e1les son mis facturas pendientes?"\n'
      + '• Clientes: "Buscar cliente ABC123"\n'
      + '• Productos: "Listar productos"\n'
      + '• Proveedores: "Ver proveedores activos"\n'
      + '• Saldos: "¿Cu\u00e1nto debo?"\n\n'
      + 'Env\u00eda tu consulta y te responder\u00e9 con la informaci\u00f3n disponible.'
      : 'I can help you with information about:\n\n'
      + '• Invoices: "What are my pending invoices?"\n'
      + '• Customers: "Find customer ABC123"\n'
      + '• Products: "List products"\n'
      + '• Suppliers: "View active suppliers"\n'
      + '• Balances: "How much do I owe?"\n\n'
      + 'Send your query and I will respond with the available information.';

    return { response, sources: [] };
  }

  /**
   * Maneja consultas desconocidas
   */
  private handleUnknownQuery(language: string = 'es'): { response: string; sources: any[] } {
    const response = language === 'es'
      ? 'No entend\u00ed tu consulta. Por favor, s\u00e9 m\u00e1s espec\u00edfico o escribe "ayuda" para ver las opciones disponibles.'
      : 'I did not understand your query. Please be more specific or type "help" to see the available options.';

    return { response, sources: [] };
  }

  /**
   * Formatea la respuesta de facturas
   */
  private formatInvoiceResponse(invoices: any[], language: string): string {
    if (invoices.length === 0) {
      return language === 'es' ? 'No se encontraron facturas.' : 'No invoices found.';
    }

    const lines = invoices.map(inv => 
      `• ${inv.number} - ${inv.customer.name} - $${inv.total.toString()} - ${inv.status}`
    );

    return language === 'es'
      ? `Encontr\u00e9 ${invoices.length} factura(s):\n${lines.join('\n')}`
      : `I found ${invoices.length} invoice(s):\n${lines.join('\n')}`;
  }

  /**
   * Formatea la respuesta de clientes
   */
  private formatCustomerResponse(customers: any[], language: string): string {
    if (customers.length === 0) {
      return language === 'es' ? 'No se encontraron clientes.' : 'No customers found.';
    }

    const lines = customers.map(cust => 
      `• ${cust.name} (Tax ID: ${cust.taxId}) - ${cust.invoices.length} facturas`
    );

    return language === 'es'
      ? `Encontr\u00e9 ${customers.length} cliente(s):\n${lines.join('\n')}`
      : `I found ${customers.length} customer(s):\n${lines.join('\n')}`;
  }

  /**
   * Formatea la respuesta de productos
   */
  private formatProductResponse(products: any[], language: string): string {
    if (products.length === 0) {
      return language === 'es' ? 'No se encontraron productos.' : 'No products found.';
    }

    const lines = products.map(prod => 
      `• ${prod.name} - ${prod.category || 'Sin categor\u00eda'} - ${prod.prices.length} precios`
    );

    return language === 'es'
      ? `Encontr\u00e9 ${products.length} producto(s):\n${lines.join('\n')}`
      : `I found ${products.length} product(s):\n${lines.join('\n')}`;
  }

  /**
   * Formatea la respuesta de proveedores
   */
  private formatSupplierResponse(suppliers: any[], language: string): string {
    if (suppliers.length === 0) {
      return language === 'es' ? 'No se encontraron proveedores.' : 'No suppliers found.';
    }

    const lines = suppliers.map(supp => 
      `• ${supp.name} - ${supp.prices.length} productos - ${supp.contactName || 'Sin contacto'}`
    );

    return language === 'es'
      ? `Encontr\u00e9 ${suppliers.length} proveedor(es):\n${lines.join('\n')}`
      : `I found ${suppliers.length} supplier(s):\n${lines.join('\n')}`;
  }

  /**
   * Parsea fechas de diferentes formatos
   */
  private parseDate(dateStr: string): Date | null {
    const now = new Date();
    
    switch (dateStr.toLowerCase()) {
      case 'hoy':
        return now;
      case 'ayer':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case 'este mes':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case 'este a\u00f1o':
        return new Date(now.getFullYear(), 0, 1);
      default:
        // Intentar parsear formato ISO o local
        const parsed = new Date(dateStr);
        return isNaN(parsed.getTime()) ? null : parsed;
    }
  }

  /**
   * Detecta si es una consulta sobre facturas
   */
  private isInvoiceQuery(query: string, language: string): boolean {
    const keywords = language === 'es'
      ? ['factura', 'facturas', 'f-', 'pendiente', 'pagada', 'vencida']
      : ['invoice', 'invoices', 'pending', 'paid', 'overdue'];
    
    return keywords.some(keyword => query.includes(keyword));
  }

  /**
   * Detecta si es una consulta sobre clientes
   */
  private isCustomerQuery(query: string, language: string): boolean {
    const keywords = language === 'es'
      ? ['cliente', 'clientes', 'customer']
      : ['customer', 'customers'];
    
    return keywords.some(keyword => query.includes(keyword));
  }

  /**
   * Detecta si es una consulta sobre productos
   */
  private isProductQuery(query: string, language: string): boolean {
    const keywords = language === 'es'
      ? ['producto', 'productos', 'item', 'items']
      : ['product', 'products', 'item', 'items'];
    
    return keywords.some(keyword => query.includes(keyword));
  }

  /**
   * Detecta si es una consulta sobre proveedores
   */
  private isSupplierQuery(query: string, language: string): boolean {
    const keywords = language === 'es'
      ? ['proveedor', 'proveedores', 'supplier']
      : ['supplier', 'suppliers', 'vendor'];
    
    return keywords.some(keyword => query.includes(keyword));
  }

  /**
   * Detecta si es una consulta sobre saldo
   */
  private isBalanceQuery(query: string, language: string): boolean {
    const keywords = language === 'es'
      ? ['saldo', 'debo', 'adeudo', 'pendiente', 'pagar', 'cu\u00e1nto']
      : ['balance', 'owe', 'debt', 'pending', 'pay', 'how much'];
    
    return keywords.some(keyword => query.includes(keyword));
  }

  /**
   * Detecta si es una consulta de ayuda
   */
  private isHelpQuery(query: string, language: string): boolean {
    const keywords = language === 'es'
      ? ['ayuda', 'help', 'opciones', 'qu\u00e9 puedo', 'comandos']
      : ['help', 'options', 'what can', 'commands'];
    
    return keywords.some(keyword => query.includes(keyword));
  }
}