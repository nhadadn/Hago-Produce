export type ChatLanguage = 'es' | 'en';

export type ChatIntent =
  | 'price_lookup'
  | 'best_supplier'
  | 'invoice_status'
  | 'customer_balance'
  | 'product_info'
  | 'inventory_summary'
  | 'create_order'
  | 'confirm_order'
  | 'cancel_order'
  | 'overdue_invoices'
  | 'create_purchase_order'
  | 'confirm_purchase_order'
  | 'cancel_purchase_order'
  | 'customer_info'
  | 'create_invoice';

export interface ChatRequestPayload {
  message: string;
  language?: ChatLanguage;
  sessionId?: string;
  context?: Record<string, any>;
}

export interface ChatSource {
  type: 'product_price' | 'supplier' | 'invoice' | 'customer' | 'purchase_order' | 'product';
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
  pendingOrder?: any;
  pendingInvoice?: any;
  pendingPurchaseOrders?: any;
  message?: any;
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

