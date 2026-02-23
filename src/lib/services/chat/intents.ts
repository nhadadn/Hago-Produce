import { ChatLanguage, DetectedIntent } from '@/lib/chat/types';
import { classifyChatIntentWithOpenAI } from '@/lib/services/chat/openai-client';

const PRICE_KEYWORDS_ES = ['precio', 'cuanto cuesta', 'cuánto cuesta', 'costo'];
const PRICE_KEYWORDS_EN = ['price', 'cost'];

const BEST_SUPPLIER_KEYWORDS_ES = ['mejor proveedor', 'mejores proveedores'];
const BEST_SUPPLIER_KEYWORDS_EN = ['best supplier', 'cheapest supplier', 'who sells'];

const INVOICE_STATUS_KEYWORDS_ES = ['estado de factura', 'estatus de factura', 'factura'];
const INVOICE_STATUS_KEYWORDS_EN = ['invoice status', 'status of invoice', 'invoice'];

const CUSTOMER_BALANCE_KEYWORDS_ES = ['saldo', 'balance', 'cuanto debe', 'cuánto debe'];
const CUSTOMER_BALANCE_KEYWORDS_EN = ['balance', 'outstanding', 'how much does', 'due amount'];

const PRODUCT_INFO_KEYWORDS_ES = ['información del producto', 'informacion del producto', 'info del producto'];
const PRODUCT_INFO_KEYWORDS_EN = ['product info', 'product information'];

const INVENTORY_SUMMARY_KEYWORDS_ES = ['resumen de inventario', 'resumen de productos', 'inventario general'];
const INVENTORY_SUMMARY_KEYWORDS_EN = ['inventory summary', 'inventory overview'];

const OVERDUE_INVOICES_KEYWORDS_ES = ['facturas vencidas', 'facturas atrasadas'];
const OVERDUE_INVOICES_KEYWORDS_EN = ['overdue invoices', 'late invoices'];

function includesKeyword(message: string, keywords: string[]): boolean {
  const lower = message.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

export async function analyzeIntent(message: string, language: ChatLanguage = 'es'): Promise<DetectedIntent> {
  const normalizedLanguage: ChatLanguage = language === 'en' ? 'en' : 'es';
  const lower = message.toLowerCase();

  const isPrice =
    includesKeyword(lower, PRICE_KEYWORDS_ES) || includesKeyword(lower, PRICE_KEYWORDS_EN);
  const isBestSupplier =
    includesKeyword(lower, BEST_SUPPLIER_KEYWORDS_ES) ||
    includesKeyword(lower, BEST_SUPPLIER_KEYWORDS_EN);
  const isInvoiceStatus =
    includesKeyword(lower, INVOICE_STATUS_KEYWORDS_ES) ||
    includesKeyword(lower, INVOICE_STATUS_KEYWORDS_EN);
  const isCustomerBalance =
    includesKeyword(lower, CUSTOMER_BALANCE_KEYWORDS_ES) ||
    includesKeyword(lower, CUSTOMER_BALANCE_KEYWORDS_EN);
  const isProductInfo =
    includesKeyword(lower, PRODUCT_INFO_KEYWORDS_ES) ||
    includesKeyword(lower, PRODUCT_INFO_KEYWORDS_EN);
  const isInventorySummary =
    includesKeyword(lower, INVENTORY_SUMMARY_KEYWORDS_ES) ||
    includesKeyword(lower, INVENTORY_SUMMARY_KEYWORDS_EN);
  const isOverdueInvoices =
    includesKeyword(lower, OVERDUE_INVOICES_KEYWORDS_ES) ||
    includesKeyword(lower, OVERDUE_INVOICES_KEYWORDS_EN);

  if (isOverdueInvoices) {
    return {
      intent: 'overdue_invoices',
      confidence: 0.9,
      params: {
        daysOverdue: undefined,
        searchTerm: message,
        language: normalizedLanguage,
      },
    };
  }

  if (isInvoiceStatus) {
    const invoiceNumberMatch = lower.match(/(factura\s*#?\s*|invoice\s*#?\s*)([a-z0-9-]+)/i);
    const invoiceNumber = invoiceNumberMatch ? invoiceNumberMatch[2] : undefined;
    return {
      intent: 'invoice_status',
      confidence: invoiceNumber ? 0.95 : 0.85,
      params: {
        invoiceNumber,
        searchTerm: message,
        language: normalizedLanguage,
      },
    };
  }

  if (isBestSupplier) {
    return {
      intent: 'best_supplier',
      confidence: 0.9,
      params: {
        searchTerm: message,
        language: normalizedLanguage,
      },
    };
  }

  if (isPrice) {
    return {
      intent: 'price_lookup',
      confidence: 0.9,
      params: {
        searchTerm: message,
        language: normalizedLanguage,
      },
    };
  }

  if (isCustomerBalance) {
    return {
      intent: 'customer_balance',
      confidence: 0.85,
      params: {
        searchTerm: message,
        language: normalizedLanguage,
      },
    };
  }

  if (isProductInfo) {
    return {
      intent: 'product_info',
      confidence: 0.85,
      params: {
        productName: message,
        searchTerm: message,
        language: normalizedLanguage,
      },
    };
  }

  if (isInventorySummary) {
    return {
      intent: 'inventory_summary',
      confidence: 0.85,
      params: {
        searchTerm: message,
        language: normalizedLanguage,
      },
    };
  }

  if (!process.env.OPENAI_API_KEY) {
    return {
      intent: 'price_lookup',
      confidence: 0.5,
      params: {
        searchTerm: message,
        language: normalizedLanguage,
      },
    };
  }

  const aiDetected = await classifyChatIntentWithOpenAI(message, normalizedLanguage);
  return aiDetected;
}

