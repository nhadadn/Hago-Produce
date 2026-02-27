import prisma from '@/lib/db';
import { PurchaseOrder, PurchaseOrderStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { generatePurchaseOrderPDF } from '@/lib/services/reports/export';
import { logger } from '@/lib/logger/logger.service';
import { sendPurchaseOrderEmail } from '@/lib/services/email.service';
import { whatsAppService } from '@/lib/services/bot/whatsapp.service';
import { createNotificationLog } from '@/lib/services/notifications/notification-log.service';

import { taxCalculationService, TransactionType, extractProvinceFromAddress } from '@/lib/services/finance/tax-calculation.service';

export interface CreatePurchaseOrderData {
  supplierId: string;
  items: {
    productId: string;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
  }[];
  subtotal: number;
  taxRate?: number;
  taxAmount?: number;
  total?: number;
  notes?: string;
  deliveryDate?: Date;
  deliveryTime?: string;
}

export class PurchaseOrdersService {
  
  async generatePurchaseOrderNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const count = await prisma.purchaseOrder.count();
    // Format: PO-YYYY-NNNN (e.g., PO-2024-0001)
    return `PO-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  async createPurchaseOrder(data: CreatePurchaseOrderData) {
    const orderNumber = await this.generatePurchaseOrderNumber();

    let taxRate: number | Decimal | undefined = data.taxRate;
    let taxAmount: number | Decimal | undefined = data.taxAmount;
    let total: number | Decimal | undefined = data.total;
    const subtotalDecimal = new Decimal(data.subtotal);

    // Auto-calculate tax if not provided
      if (taxRate === undefined) {
        const supplier = await prisma.supplier.findUnique({
          where: { id: data.supplierId },
          select: { address: true }
        });

        const province = extractProvinceFromAddress(supplier?.address);
        
        if (!province) {
          logger.warn(`PurchaseOrder creation: Supplier ${data.supplierId} has no valid address/province. Delegating to TaxCalculationService fallback.`);
        }

        const taxResult = taxCalculationService.calculateTax(province, subtotalDecimal, TransactionType.PURCHASE);
        taxRate = taxResult.taxRate;
        
        if (taxAmount === undefined) {
          taxAmount = taxResult.taxAmount;
        }
      }

    // Now taxRate is definitely defined (either from input or calculation)
    // Calculate missing amounts based on rate
    if (taxAmount === undefined && taxRate !== undefined) {
        taxAmount = subtotalDecimal.times(new Decimal(taxRate));
    }

    if (total === undefined && taxAmount !== undefined) {
        total = subtotalDecimal.plus(new Decimal(taxAmount));
    }

    // Ensure values are defined before creating (should be covered by logic above unless taxRate provided but calculation failed? No, calculateTax throws)
    // Fallback for safety if somehow undefined (e.g. taxRate provided 0 but taxAmount undefined)
    const finalTaxRate = taxRate ?? 0;
    const finalTaxAmount = taxAmount ?? 0;
    const finalTotal = total ?? data.subtotal;

    return prisma.purchaseOrder.create({
      data: {
        orderNumber,
        supplierId: data.supplierId,
        status: 'SENT', // As per requirements, we create it directly as SENT if we are sending it immediately
        subtotal: subtotalDecimal,
        taxRate: new Decimal(finalTaxRate),
        taxAmount: new Decimal(finalTaxAmount),
        total: new Decimal(finalTotal),
        notes: data.notes,
        deliveryDate: data.deliveryDate,
        deliveryTime: data.deliveryTime,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            supplierId: data.supplierId,
            description: item.description,
            quantity: new Decimal(item.quantity),
            unit: item.unit,
            unitPrice: new Decimal(item.unitPrice),
            totalPrice: new Decimal(item.totalPrice),
          })),
        },
      },
      include: {
        supplier: true,
        items: true,
      },
    });
  }

  async generatePurchaseOrderPDF(purchaseOrderId: string): Promise<Uint8Array> {
    const order = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: {
        supplier: true,
        items: true,
      },
    });

    if (!order) {
      throw new Error(`Purchase Order not found: ${purchaseOrderId}`);
    }

    return generatePurchaseOrderPDF({
      orderNumber: order.orderNumber,
      supplierName: order.supplier.name,
      date: order.createdAt,
      deliveryDate: order.deliveryDate ? order.deliveryDate : undefined,
      items: order.items.map(item => ({
        description: item.description,
        quantity: Number(item.quantity),
        unit: item.unit,
        unitPrice: Number(item.unitPrice),
        total: Number(item.totalPrice),
      })),
      subtotal: Number(order.subtotal),
      taxAmount: Number(order.taxAmount),
      total: Number(order.total),
      notes: order.notes || undefined,
    });
  }

  async sendPurchaseOrderToSupplier(
    purchaseOrderId: string,
    channel: 'WHATSAPP' | 'EMAIL'
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const order = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: {
        supplier: true,
      },
    });

    if (!order) {
      throw new Error(`Purchase Order not found: ${purchaseOrderId}`);
    }

    const supplier = order.supplier;
    const pdfBuffer = await this.generatePurchaseOrderPDF(purchaseOrderId);
    const pdfBufferNode = Buffer.from(pdfBuffer);

    let result: { success: boolean; messageId?: string; error?: string } = { success: false };

    try {
      if (channel === 'EMAIL') {
        if (!supplier.email) {
            throw new Error('Supplier email not found');
        }
        const emailResult = await sendPurchaseOrderEmail(
          supplier.email,
          order.orderNumber,
          pdfBufferNode,
          supplier.name
        );
        result = { 
            success: emailResult.success, 
            messageId: emailResult.success ? emailResult.messageId : undefined,
            error: !emailResult.success ? (emailResult as any).error : undefined
        };
      } else if (channel === 'WHATSAPP') {
         if (!supplier.phone) {
             throw new Error('Supplier phone not found');
         }
         
         // For WhatsApp, we currently send a text summary. 
         // In a real implementation, we would upload the PDF and send a link, or use the Media API.
         const message = `*HAGO PRODUCE*: Nueva Orden de Compra *${order.orderNumber}*\n\n` +
                         `Total: $${Number(order.total).toFixed(2)}\n` +
                         `Entrega: ${order.deliveryDate ? order.deliveryDate.toLocaleDateString() : 'N/A'}\n\n` +
                         `Se ha generado el PDF adjunto. (Simulado)`;
         
         const messageId = await whatsAppService.sendMessage(supplier.phone, message);
         result = { success: true, messageId };
      }

      // Log notification
      await createNotificationLog({
        channel,
        recipient: channel === 'EMAIL' ? supplier.email || 'unknown' : supplier.phone || 'unknown',
        status: result.success ? 'SENT' : 'FAILED',
        error: result.error,
        metadata: { purchaseOrderId: order.id, orderNumber: order.orderNumber },
      });

      return result;

    } catch (error) {
      logger.error('Error sending purchase order:', error);
      
      await createNotificationLog({
        channel,
        recipient: channel === 'EMAIL' ? supplier.email || 'unknown' : supplier.phone || 'unknown',
        status: 'FAILED',
        error: String(error),
        metadata: { purchaseOrderId: order.id, orderNumber: order.orderNumber },
      });

      return { success: false, error: String(error) };
    }
  }
}

export const purchaseOrdersService = new PurchaseOrdersService();
