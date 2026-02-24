
import { executeQuery } from '../query-executor';
import { createPurchaseOrderIntent, confirmPurchaseOrderIntent } from '../intents/create-purchase-order';

// Mock the intents
jest.mock('../intents/create-purchase-order', () => ({
  createPurchaseOrderIntent: jest.fn().mockResolvedValue({ intent: 'create_purchase_order', data: 'mocked' }),
  confirmPurchaseOrderIntent: jest.fn().mockResolvedValue({ intent: 'confirm_purchase_order', data: 'mocked' }),
}));

// Mock other intents to avoid errors
jest.mock('../intents/price-lookup', () => ({ priceLookupIntent: jest.fn() }));
jest.mock('../intents/best-supplier', () => ({ bestSupplierIntent: jest.fn() }));
jest.mock('../intents/invoice-status', () => ({ invoiceStatusIntent: jest.fn() }));
jest.mock('../intents/customer-balance', () => ({ customerBalanceIntent: jest.fn() }));
jest.mock('../intents/product-info', () => ({ productInfoIntent: jest.fn() }));
jest.mock('../intents/inventory-summary', () => ({ inventorySummaryIntent: jest.fn() }));
jest.mock('../intents/create-order', () => ({
  createOrderIntent: jest.fn(),
  confirmOrderIntent: jest.fn(),
  cancelOrderIntent: jest.fn(),
}));
jest.mock('../intents/overdue-invoices', () => ({ overdueInvoicesIntent: jest.fn() }));

describe('executeQuery', () => {
  it('routes create_purchase_order intent correctly', async () => {
    const detected = {
      intent: 'create_purchase_order',
      confidence: 0.9,
      params: { some: 'param' },
    } as any;

    await executeQuery(detected, 'es', {});

    expect(createPurchaseOrderIntent).toHaveBeenCalledWith(
      detected.params,
      'es',
      0.9,
      {}
    );
  });

  it('routes confirm_purchase_order intent correctly', async () => {
    const detected = {
      intent: 'confirm_purchase_order',
      confidence: 1.0,
      params: { some: 'param' },
    } as any;

    await executeQuery(detected, 'en', { pendingPurchaseOrders: [] });

    expect(confirmPurchaseOrderIntent).toHaveBeenCalledWith(
      detected.params,
      'en',
      1.0,
      { pendingPurchaseOrders: [] }
    );
  });
});
