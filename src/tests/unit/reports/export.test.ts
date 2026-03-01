import { 
  buildPDF, 
  buildCSV, 
  ReportType, 
  generateInvoicePDF, 
  generateInvoicesZIP, 
  generatePurchaseOrderPDF,
  InvoicePDFData,
  PurchaseOrderPDFData 
} from '@/lib/services/reports/export';
import {
  RevenueMetrics,
  AgingReport,
  TopCustomer,
  TopProduct,
  ProductPriceTrends,
} from '@/lib/services/reports';

describe('Reports Export Service', () => {
  describe('buildPDF', () => {
    it('generates revenue PDF with correct structure', () => {
      const metrics: RevenueMetrics = {
        totalRevenue: 1000,
        monthlyRevenue: [{ period: '2024-01', amount: 1000 }],
        previousPeriodRevenue: 800,
        growthRate: 0.25,
        averageInvoiceAmount: 500,
      };

      const { buffer, filename } = buildPDF('revenue', metrics);
      expect(buffer).toBeInstanceOf(Uint8Array);
      expect(buffer.byteLength).toBeGreaterThan(0);
      expect(filename).toMatch(/^revenue-report-\d{4}-\d{2}-\d{2}\.pdf$/);
    });

    it('generates revenue PDF with negative growth rate', () => {
      const metrics: RevenueMetrics = {
        totalRevenue: 1000,
        monthlyRevenue: [{ period: '2024-01', amount: 1000 }],
        previousPeriodRevenue: 1200,
        growthRate: -0.1667,
        averageInvoiceAmount: 500,
      };

      const { buffer } = buildPDF('revenue', metrics);
      expect(buffer).toBeInstanceOf(Uint8Array);
    });

    it('generates aging PDF with correct structure', () => {
      const report: AgingReport = {
        asOfDate: '2024-02-01T00:00:00.000Z',
        buckets: [
          { bucket: '0-30', invoiceCount: 3, totalAmount: 300 },
          { bucket: '31-60', invoiceCount: 1, totalAmount: 100 },
        ],
      };

      const { buffer, filename } = buildPDF('aging', report);
      expect(buffer).toBeInstanceOf(Uint8Array);
      expect(buffer.byteLength).toBeGreaterThan(0);
      expect(filename).toMatch(/^aging-report-\d{4}-\d{2}-\d{2}\.pdf$/);
    });

    it('generates top customers PDF with correct structure', () => {
      const customers: TopCustomer[] = [
        {
          customerId: 'c1',
          customerName: 'Cliente A',
          totalRevenue: 1000,
          invoiceCount: 2,
          averageInvoiceAmount: 500,
        },
      ];

      const { buffer, filename } = buildPDF('top-customers', customers);
      expect(buffer).toBeInstanceOf(Uint8Array);
      expect(buffer.byteLength).toBeGreaterThan(0);
      expect(filename).toMatch(/^top-customers-report-\d{4}-\d{2}-\d{2}\.pdf$/);
    });

    it('generates top products PDF with correct structure', () => {
      const products: TopProduct[] = [
        {
          productId: 'p1',
          productName: 'Producto A',
          totalQuantity: 10,
          totalRevenue: 1000,
          averagePrice: 100,
        },
      ];

      const { buffer, filename } = buildPDF('top-products', products);
      expect(buffer).toBeInstanceOf(Uint8Array);
      expect(buffer.byteLength).toBeGreaterThan(0);
      expect(filename).toMatch(/^top-products-report-\d{4}-\d{2}-\d{2}\.pdf$/);
    });

    it('generates price trends PDF with correct structure', () => {
      const trends: ProductPriceTrends = {
        productId: 'p1',
        currentPrice: 100,
        monthlyAverage: [{ period: '2024-01', averagePrice: 95 }],
        changeVsPreviousPeriod: 0.05,
        suppliers: [
          {
            supplierId: 's1',
            supplierName: 'Proveedor A',
            prices: [{ effectiveDate: '2024-01-01T00:00:00.000Z', price: 100 }],
          },
        ],
      };

      const { buffer, filename } = buildPDF('price-trends', trends);
      expect(buffer).toBeInstanceOf(Uint8Array);
      expect(buffer.byteLength).toBeGreaterThan(0);
      expect(filename).toMatch(/^price-trends-report-\d{4}-\d{2}-\d{2}\.pdf$/);
    });

    it('generates price trends PDF with negative change', () => {
      const trends: ProductPriceTrends = {
        productId: 'p1',
        currentPrice: 90,
        monthlyAverage: [{ period: '2024-01', averagePrice: 95 }],
        changeVsPreviousPeriod: -0.05,
        suppliers: [],
      };

      const { buffer } = buildPDF('price-trends', trends);
      expect(buffer).toBeInstanceOf(Uint8Array);
    });

    it('generates price trends CSV with null values', () => {
      const trends: ProductPriceTrends = {
        productId: 'p1',
        currentPrice: null,
        monthlyAverage: [],
        changeVsPreviousPeriod: null,
        suppliers: [],
      };

      const { buffer } = buildCSV('price-trends', trends);
      const csv = buffer.toString('utf8');
      expect(csv).toContain('N/A');
    });

    it('throws error on unknown reportType', () => {
      expect(() => buildPDF('unknown' as ReportType, {})).toThrow('ReportType desconocido: unknown');
    });
  });

  describe('generateInvoicesZIP', () => {
    it('generates ZIP file containing PDFs', async () => {
      const invoices: InvoicePDFData[] = [
        {
          invoiceNumber: 'INV-001',
          customerName: 'Customer A',
          date: new Date('2024-01-01'),
          items: [{ description: 'Item 1', quantity: 1, unitPrice: 100, total: 100 }],
          subtotal: 100,
          taxAmount: 13,
          total: 113
        },
        {
          invoiceNumber: 'INV-002',
          customerName: 'Customer B',
          date: new Date('2024-01-02'),
          items: [{ description: 'Item 2', quantity: 2, unitPrice: 50, total: 100 }],
          subtotal: 100,
          taxAmount: 13,
          total: 113
        }
      ];

      const blob = await generateInvoicesZIP(invoices);
      expect(blob).toBeDefined();
      expect(blob.size).toBeGreaterThan(0);
      // In jsdom environment, Blob should be available
    });
  });

  describe('generateInvoicePDF', () => {
    it('generates invoice PDF with correct structure', () => {
      const data: InvoicePDFData = {
        invoiceNumber: 'INV-001',
        customerName: 'Customer A',
        date: new Date('2024-01-01'),
        items: [
          { description: 'Item 1', quantity: 2, unitPrice: 50, total: 100 },
          { description: 'Item 2', quantity: 1, unitPrice: 100, total: 100 }
        ],
        subtotal: 200,
        taxAmount: 26,
        total: 226
      };

      const buffer = generateInvoicePDF(data);
      expect(buffer).toBeInstanceOf(Uint8Array);
      expect(buffer.byteLength).toBeGreaterThan(0);
    });
  });

  describe('generatePurchaseOrderPDF', () => {
    it('generates purchase order PDF with correct structure', () => {
      const data: PurchaseOrderPDFData = {
        orderNumber: 'PO-001',
        supplierName: 'Supplier A',
        date: new Date('2024-01-01'),
        deliveryDate: new Date('2024-01-10'),
        items: [
          { description: 'Item 1', quantity: 10, unit: 'kg', unitPrice: 5, total: 50 },
          { description: 'Item 2', quantity: 5, unit: 'box', unitPrice: 10, total: 50 }
        ],
        subtotal: 100,
        taxAmount: 13,
        total: 113,
        notes: 'Please deliver to the back door.'
      };

      const buffer = generatePurchaseOrderPDF(data);
      expect(buffer).toBeInstanceOf(Uint8Array);
      expect(buffer.byteLength).toBeGreaterThan(0);
    });

    it('generates purchase order PDF without optional fields', () => {
      const data: PurchaseOrderPDFData = {
        orderNumber: 'PO-002',
        supplierName: 'Supplier B',
        date: new Date('2024-01-05'),
        items: [
          { description: 'Item 1', quantity: 10, unit: 'kg', unitPrice: 5, total: 50 }
        ],
        subtotal: 50,
        taxAmount: 6.5,
        total: 56.5
      };

      const buffer = generatePurchaseOrderPDF(data);
      expect(buffer).toBeInstanceOf(Uint8Array);
      expect(buffer.byteLength).toBeGreaterThan(0);
    });
  });

  describe('buildCSV', () => {
    it('generates revenue CSV with correct structure', () => {
      const metrics: RevenueMetrics = {
        totalRevenue: 1000,
        monthlyRevenue: [{ period: '2024-01', amount: 1000 }],
        previousPeriodRevenue: 800,
        growthRate: 0.25,
        averageInvoiceAmount: 500,
      };

      const { buffer, filename } = buildCSV('revenue', metrics);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
      expect(filename).toMatch(/^revenue-report-\d{4}-\d{2}-\d{2}\.csv$/);

      const csv = buffer.toString('utf8');
      expect(csv).toContain('Total de Ingresos');
      expect(csv).toContain('1000.00');
      expect(csv).toContain('Mes');
      expect(csv).toContain('Monto');
    });

    it('generates revenue CSV with null growth rate', () => {
      const metrics: RevenueMetrics = {
        totalRevenue: 1000,
        monthlyRevenue: [],
        previousPeriodRevenue: 0,
        growthRate: null,
        averageInvoiceAmount: 500,
      };

      const { buffer } = buildCSV('revenue', metrics);
      const csv = buffer.toString('utf8');
      expect(csv).toContain('N/A');
    });

    it('generates aging CSV with correct structure', () => {
      const report: AgingReport = {
        asOfDate: '2024-02-01T00:00:00.000Z',
        buckets: [
          { bucket: '0-30', invoiceCount: 3, totalAmount: 300 },
          { bucket: '31-60', invoiceCount: 1, totalAmount: 100 },
        ],
      };

      const { buffer, filename } = buildCSV('aging', report);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
      expect(filename).toMatch(/^aging-report-\d{4}-\d{2}-\d{2}\.csv$/);

      const csv = buffer.toString('utf8');
      expect(csv).toContain('Rango de Días');
      expect(csv).toContain('Cantidad de Facturas');
      expect(csv).toContain('Monto Total');
      expect(csv).toContain('0-30');
      expect(csv).toContain('300.00');
    });
  });
});
