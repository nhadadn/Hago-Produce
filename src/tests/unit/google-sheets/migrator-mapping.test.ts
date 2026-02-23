import {
  mapProductRow,
  mapSupplierRow,
  mapCustomerRow,
  mapProductPriceRow,
  mapInvoiceItems,
  mapInvoiceRow,
} from '../../../../scripts/google-sheets-migration/migrator';

describe('Google Sheets migration mapping', () => {
  it('maps product row into ProductInput', () => {
    const row = {
      name: 'Manzana Gala',
      sku: 'APPLE-GALA-01',
      unit: 'kg',
      isActive: 'true',
    };

    const mapped = mapProductRow(row as any);

    expect(mapped.name).toBe('Manzana Gala');
    expect(mapped.sku).toBe('APPLE-GALA-01');
    expect(mapped.unit).toBe('kg');
    expect(mapped.isActive).toBe(true);
  });

  it('maps supplier row into supplier input', () => {
    const row = {
      name: 'Agricola San Juan',
      email: 'contacto@sanjuan.test',
      isActive: '1',
    };

    const { data } = mapSupplierRow(row as any) as any;

    expect(data.name).toBe('Agricola San Juan');
    expect(data.email).toBe('contacto@sanjuan.test');
    expect(data.isActive).toBe(true);
  });

  it('maps customer row into customer input', () => {
    const row = {
      name: 'Cliente Demo',
      taxId: 'XAXX010101000',
      email: 'cliente@demo.test',
    };

    const { data } = mapCustomerRow(row as any) as any;

    expect(data.name).toBe('Cliente Demo');
    expect(data.taxId).toBe('XAXX010101000');
    expect(data.email).toBe('cliente@demo.test');
  });

  it('maps product price row into ProductPriceInput', () => {
    const row = {
      productId: '11111111-1111-1111-1111-111111111111',
      supplierId: '22222222-2222-2222-2222-222222222222',
      costPrice: '10.5',
      sellPrice: '15.0',
      currency: 'USD',
      isCurrent: 'true',
    };

    const mapped = mapProductPriceRow(row as any);

    expect(mapped.productId).toBe('11111111-1111-1111-1111-111111111111');
    expect(mapped.supplierId).toBe('22222222-2222-2222-2222-222222222222');
    expect(mapped.costPrice).toBe(10.5);
    expect(mapped.sellPrice).toBe(15.0);
    expect(mapped.currency).toBe('USD');
    expect(mapped.isCurrent).toBe(true);
  });

  it('maps invoice items from JSON string', () => {
    const json = JSON.stringify([
      {
        productId: 'prod-1',
        quantity: '2',
        unitPrice: '5.5',
        description: 'Caja 10kg',
      },
    ]);

    const items = mapInvoiceItems(json);

    expect(items).toHaveLength(1);
    expect(items[0].productId).toBe('prod-1');
    expect(items[0].quantity).toBe(2);
    expect(items[0].unitPrice).toBe(5.5);
    expect(items[0].description).toBe('Caja 10kg');
  });

  it('maps invoice row into CreateInvoiceInput', () => {
    const json = JSON.stringify([
      {
        productId: 'prod-1',
        quantity: '2',
        unitPrice: '5.5',
      },
    ]);

    const row = {
      number: 'INV-2024-0001',
      customerId: 'cust-1',
      issueDate: '2024-01-01',
      dueDate: '2024-01-10',
      status: 'SENT',
      taxRate: '0.16',
      items: json,
    };

    const mapped = mapInvoiceRow(row as any);

    expect(mapped.customerId).toBe('cust-1');
    expect(mapped.issueDate).toBeInstanceOf(Date);
    expect(mapped.dueDate).toBeInstanceOf(Date);
    expect(mapped.status).toBeDefined();
    expect(mapped.items).toHaveLength(1);
  });
});
