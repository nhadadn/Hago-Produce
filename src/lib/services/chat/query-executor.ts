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

  return {
    intent,
    confidence,
    language,
    data: null,
    sources: [],
  };
}
