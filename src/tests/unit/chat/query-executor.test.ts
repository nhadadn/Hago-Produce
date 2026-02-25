
import { executeQuery } from '@/lib/services/chat/query-executor';
import { ChatLanguage, DetectedIntent } from '@/lib/chat/types';
import * as priceLookup from '@/lib/services/chat/intents/price-lookup';
import * as bestSupplier from '@/lib/services/chat/intents/best-supplier';
import * as invoiceStatus from '@/lib/services/chat/intents/invoice-status';
import * as customerBalance from '@/lib/services/chat/intents/customer-balance';
import * as productInfo from '@/lib/services/chat/intents/product-info';
import * as inventorySummary from '@/lib/services/chat/intents/inventory-summary';
import * as createOrder from '@/lib/services/chat/intents/create-order';
import * as createPurchaseOrder from '@/lib/services/chat/intents/create-purchase-order';
import * as overdueInvoices from '@/lib/services/chat/intents/overdue-invoices';

// Mock all intent handlers
jest.mock('@/lib/services/chat/intents/price-lookup');
jest.mock('@/lib/services/chat/intents/best-supplier');
jest.mock('@/lib/services/chat/intents/invoice-status');
jest.mock('@/lib/services/chat/intents/customer-balance');
jest.mock('@/lib/services/chat/intents/product-info');
jest.mock('@/lib/services/chat/intents/inventory-summary');
jest.mock('@/lib/services/chat/intents/create-order');
jest.mock('@/lib/services/chat/intents/create-purchase-order');
jest.mock('@/lib/services/chat/intents/overdue-invoices');

describe('Query Executor Service', () => {
  const mockLanguage: ChatLanguage = 'es';
  const mockContext = { userId: 'user-1' };
  const mockConfidence = 0.9;
  const mockParams = { searchTerm: 'test' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should route to priceLookupIntent', async () => {
    const detected: DetectedIntent = { intent: 'price_lookup', confidence: mockConfidence, params: mockParams };
    await executeQuery(detected, mockLanguage, mockContext);
    expect(priceLookup.priceLookupIntent).toHaveBeenCalledWith(mockParams, mockLanguage, mockConfidence);
  });

  it('should route to bestSupplierIntent', async () => {
    const detected: DetectedIntent = { intent: 'best_supplier', confidence: mockConfidence, params: mockParams };
    await executeQuery(detected, mockLanguage, mockContext);
    expect(bestSupplier.bestSupplierIntent).toHaveBeenCalledWith(mockParams, mockLanguage, mockConfidence);
  });

  it('should route to invoiceStatusIntent', async () => {
    const detected: DetectedIntent = { intent: 'invoice_status', confidence: mockConfidence, params: mockParams };
    await executeQuery(detected, mockLanguage, mockContext);
    expect(invoiceStatus.invoiceStatusIntent).toHaveBeenCalledWith(mockParams, mockLanguage, mockConfidence);
  });

  it('should route to customerBalanceIntent', async () => {
    const detected: DetectedIntent = { intent: 'customer_balance', confidence: mockConfidence, params: mockParams };
    await executeQuery(detected, mockLanguage, mockContext);
    expect(customerBalance.customerBalanceIntent).toHaveBeenCalledWith(mockParams, mockLanguage, mockConfidence, mockContext);
  });

  it('should route to productInfoIntent', async () => {
    const detected: DetectedIntent = { intent: 'product_info', confidence: mockConfidence, params: mockParams };
    await executeQuery(detected, mockLanguage, mockContext);
    expect(productInfo.productInfoIntent).toHaveBeenCalledWith(mockParams, mockLanguage, mockConfidence);
  });

  it('should route to inventorySummaryIntent', async () => {
    const detected: DetectedIntent = { intent: 'inventory_summary', confidence: mockConfidence, params: mockParams };
    await executeQuery(detected, mockLanguage, mockContext);
    expect(inventorySummary.inventorySummaryIntent).toHaveBeenCalledWith(mockParams, mockLanguage, mockConfidence);
  });

  it('should route to createOrderIntent', async () => {
    const detected: DetectedIntent = { intent: 'create_order', confidence: mockConfidence, params: mockParams };
    await executeQuery(detected, mockLanguage, mockContext);
    expect(createOrder.createOrderIntent).toHaveBeenCalledWith(mockParams, mockLanguage, mockConfidence, mockContext);
  });

  it('should route to confirmOrderIntent', async () => {
    const detected: DetectedIntent = { intent: 'confirm_order', confidence: mockConfidence, params: mockParams };
    await executeQuery(detected, mockLanguage, mockContext);
    expect(createOrder.confirmOrderIntent).toHaveBeenCalledWith(mockParams, mockLanguage, mockConfidence, mockContext);
  });

  it('should route to cancelOrderIntent', async () => {
    const detected: DetectedIntent = { intent: 'cancel_order', confidence: mockConfidence, params: mockParams };
    await executeQuery(detected, mockLanguage, mockContext);
    expect(createOrder.cancelOrderIntent).toHaveBeenCalledWith(mockParams, mockLanguage, mockConfidence, mockContext);
  });

  it('should route to createPurchaseOrderIntent', async () => {
    const detected: DetectedIntent = { intent: 'create_purchase_order', confidence: mockConfidence, params: mockParams };
    await executeQuery(detected, mockLanguage, mockContext);
    expect(createPurchaseOrder.createPurchaseOrderIntent).toHaveBeenCalledWith(mockParams, mockLanguage, mockConfidence, mockContext);
  });

  it('should route to confirmPurchaseOrderIntent', async () => {
    const detected: DetectedIntent = { intent: 'confirm_purchase_order', confidence: mockConfidence, params: mockParams };
    await executeQuery(detected, mockLanguage, mockContext);
    expect(createPurchaseOrder.confirmPurchaseOrderIntent).toHaveBeenCalledWith(mockParams, mockLanguage, mockConfidence, mockContext);
  });

  it('should route to cancelPurchaseOrderIntent', async () => {
    const detected: DetectedIntent = { intent: 'cancel_purchase_order', confidence: mockConfidence, params: mockParams };
    await executeQuery(detected, mockLanguage, mockContext);
    expect(createPurchaseOrder.cancelPurchaseOrderIntent).toHaveBeenCalledWith(mockParams, mockLanguage, mockConfidence, mockContext);
  });

  it('should route to overdueInvoicesIntent', async () => {
    const detected: DetectedIntent = { intent: 'overdue_invoices', confidence: mockConfidence, params: mockParams };
    await executeQuery(detected, mockLanguage, mockContext);
    expect(overdueInvoices.overdueInvoicesIntent).toHaveBeenCalledWith(mockParams, mockLanguage, mockConfidence);
  });

  it('should return default result for unknown intent', async () => {
    const detected: DetectedIntent = { intent: 'unknown_intent', confidence: mockConfidence, params: mockParams };
    const result = await executeQuery(detected, mockLanguage, mockContext);
    expect(result).toEqual({
      intent: 'unknown_intent',
      confidence: mockConfidence,
      language: mockLanguage,
      data: null,
      sources: [],
    });
  });
});
