import { buildPDF, buildCSV, ReportType } from '@/lib/services/reports/export';
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
      expect(buffer).toBeInstanceOf(ArrayBuffer);
      expect(buffer.byteLength).toBeGreaterThan(0);
      expect(filename).toMatch(/^revenue-report-\d{4}-\d{2}-\d{2}\.pdf$/);
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
      expect(buffer).toBeInstanceOf(ArrayBuffer);
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
      expect(buffer).toBeInstanceOf(ArrayBuffer);
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
      expect(buffer).toBeInstanceOf(ArrayBuffer);
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
      expect(buffer).toBeInstanceOf(ArrayBuffer);
      expect(buffer.byteLength).toBeGreaterThan(0);
      expect(filename).toMatch(/^price-trends-report-\d{4}-\d{2}-\d{2}\.pdf$/);
    });

    it('throws error on unknown reportType', () => {
      expect(() => buildPDF('unknown' as ReportType, {})).toThrow('ReportType desconocido: unknown');
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

    it('generates top customers CSV with correct structure', () => {
      const customers: TopCustomer[] = [
        {
          customerId: 'c1',
          customerName: 'Cliente A',
          totalRevenue: 1000,
          invoiceCount: 2,
          averageInvoiceAmount: 500,
        },
      ];

      const { buffer, filename } = buildCSV('top-customers', customers);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
      expect(filename).toMatch(/^top-customers-report-\d{4}-\d{2}-\d{2}\.csv$/);

      const csv = buffer.toString('utf8');
      expect(csv).toContain('Cliente');
      expect(csv).toContain('Facturas');
      expect(csv).toContain('Ingreso Total');
      expect(csv).toContain('Promedio por Factura');
      expect(csv).toContain('Cliente A');
      expect(csv).toContain('1000.00');
    });

    it('generates top products CSV with correct structure', () => {
      const products: TopProduct[] = [
        {
          productId: 'p1',
          productName: 'Producto A',
          totalQuantity: 10,
          totalRevenue: 1000,
          averagePrice: 100,
        },
      ];

      const { buffer, filename } = buildCSV('top-products', products);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
      expect(filename).toMatch(/^top-products-report-\d{4}-\d{2}-\d{2}\.csv$/);

      const csv = buffer.toString('utf8');
      expect(csv).toContain('Producto');
      expect(csv).toContain('Cantidad Vendida');
      expect(csv).toContain('Ingreso Total');
      expect(csv).toContain('Precio Promedio');
      expect(csv).toContain('Producto A');
      expect(csv).toContain('10');
      expect(csv).toContain('1000.00');
    });

    it('generates price trends CSV with correct structure', () => {
      const trends: ProductPriceTrends = {
        productId: 'p1',
        currentPrice: 100,
        monthlyAverage: [{ period: '2024-01', averagePrice: 95 }],
        changeVsPreviousPeriod: 0.05,
        suppliers: [],
      };

      const { buffer, filename } = buildCSV('price-trends', trends);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
      expect(filename).toMatch(/^price-trends-report-\d{4}-\d{2}-\d{2}\.csv$/);

      const csv = buffer.toString('utf8');
      expect(csv).toContain('Producto');
      expect(csv).toContain('Precio Actual');
      expect(csv).toContain('Cambio vs Mes Anterior');
      expect(csv).toContain('Mes');
      expect(csv).toContain('Precio Promedio');
      expect(csv).toContain('100.00');
      expect(csv).toContain('5.00%');
    });

    it('throws error on unknown reportType', () => {
      expect(() => buildCSV('unknown' as ReportType, {})).toThrow('ReportType desconocido: unknown');
    });
  });
});