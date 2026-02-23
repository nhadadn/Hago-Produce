export type ChatLanguage = 'es' | 'en';

export type ChatIntent = 'price_lookup' | 'best_supplier' | 'invoice_status' | 'customer_balance';

export interface ChatRequestPayload {
  message: string;
  language?: ChatLanguage;
}

export interface ChatSource {
  type: 'product_price' | 'supplier' | 'invoice' | 'customer';
  id: string;
  label: string;
}

export interface ChatResponseData {
  response: string;
  intent: ChatIntent;
  confidence: number;
  language: ChatLanguage;
  sources: ChatSource[];
}

export interface ChatServiceContext {
  userId?: string;
  customerId?: string | null;
}

export interface DetectedIntent {
  intent: ChatIntent;
  confidence: number;
  params: Record<string, any>;
}

export interface QueryExecutionResult {
  intent: ChatIntent;
  confidence: number;
  language: ChatLanguage;
  data: any;
  sources: ChatSource[];
}

