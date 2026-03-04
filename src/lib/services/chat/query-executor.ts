import {
  ChatLanguage,
  ChatServiceContext,
  DetectedIntent,
  QueryExecutionResult,
} from '@/lib/chat/types';
import { priceLookupIntent } from '@/lib/services/chat/intents/price-lookup';
import { bestSupplierIntent } from '@/lib/services/chat/intents/best-supplier';
import { invoiceStatusIntent } from '@/lib/services/chat/intents/invoice-status';
import { customerBalanceIntent } from '@/lib/services/chat/intents/customer-balance';
import { productInfoIntent } from '@/lib/services/chat/intents/product-info';
import { inventorySummaryIntent } from '@/lib/services/chat/intents/inventory-summary';
import { createOrderIntent, confirmOrderIntent, cancelOrderIntent } from '@/lib/services/chat/intents/create-order';
import { createPurchaseOrderIntent, confirmPurchaseOrderIntent, cancelPurchaseOrderIntent } from '@/lib/services/chat/intents/create-purchase-order';
import { createInvoiceIntent, confirmInvoiceIntent, cancelInvoiceIntent } from '@/lib/services/chat/intents/create-invoice';
import { overdueInvoicesIntent } from '@/lib/services/chat/intents/overdue-invoices';
import { customerInfoIntent } from '@/lib/services/chat/intents/customer-info';

export async function executeQuery(
  detected: DetectedIntent,
  language: ChatLanguage,
  context?: ChatServiceContext,
): Promise<QueryExecutionResult> {
  const { intent, confidence, params } = detected;

  if (intent === 'price_lookup') {
    return priceLookupIntent(params, language, confidence);
  }

  if (intent === 'best_supplier') {
    return bestSupplierIntent(params, language, confidence);
  }

  if (intent === 'invoice_status') {
    return invoiceStatusIntent(params, language, confidence);
  }

  if (intent === 'customer_balance') {
    return customerBalanceIntent(params, language, confidence, context);
  }

  if (intent === 'product_info') {
    return productInfoIntent(params, language, confidence);
  }

  if (intent === 'inventory_summary') {
    return inventorySummaryIntent(params, language, confidence);
  }

  if (intent === 'create_order') {
    return createOrderIntent(params, language, confidence, context);
  }

  if (intent === 'confirm_order') {
    return confirmOrderIntent(params, language, confidence, context);
  }

  if (intent === 'cancel_order') {
    return cancelOrderIntent(params, language, confidence, context);
  }
  if (intent === 'create_purchase_order') {
    return createPurchaseOrderIntent(params, language, confidence, context);
  }

  if (intent === 'confirm_purchase_order') {
    return confirmPurchaseOrderIntent(params, language, confidence, context);
  }

  if (intent === 'cancel_purchase_order') {
    return cancelPurchaseOrderIntent(params, language, confidence, context);
  }

  if (intent === 'create_invoice') {
    return createInvoiceIntent(params, language, confidence, context);
  }

  if (intent === 'confirm_invoice') {
    return confirmInvoiceIntent(params, language, confidence, context);
  }

  if (intent === 'cancel_invoice') {
    return cancelInvoiceIntent(params, language, confidence, context);
  }

  if (intent === 'overdue_invoices') {
    return overdueInvoicesIntent(params, language, confidence);
  }

  if (intent === 'customer_info') {
    return customerInfoIntent(params, language, confidence);
  }

  return {
    intent,
    confidence,
    language,
    data: null,
    sources: [],
  };
}
