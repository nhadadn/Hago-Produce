import jspdf from 'jspdf';
import autoTable from 'jspdf-autotable';
import JSZip from 'jszip';
import { stringify } from 'csv-stringify/sync';
import {
  RevenueMetrics,
  AgingReport,
  TopCustomer,
  TopProduct,
  ProductPriceTrends,
} from '@/lib/services/reports';

export type ReportType = 'revenue' | 'aging' | 'top-customers' | 'top-products' | 'price-trends';

export interface ExportFilters {
  startDate?: Date;
  endDate?: Date;
  customerId?: string;
  asOfDate?: Date;
  productId?: string;
  months?: number;
}

function formatDate(date: Date): string {
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function filename(reportType: ReportType, extension: 'pdf' | 'csv'): string {
  const date = formatDate(new Date());
  return `${reportType}-report-${date}.${extension}`;
}

function buildRevenuePDF(metrics: RevenueMetrics): Uint8Array {
  const doc = new jspdf({ orientation: 'p', unit: 'pt', format: 'a4' });
  doc.setFontSize(16);
  doc.text('Reporte de Ingresos', 40, 40);

  doc.setFontSize(10);
  doc.text(`Total de Ingresos: $${metrics.totalRevenue.toFixed(2)}`, 40, 70);
  doc.text(`Promedio por Factura: $${metrics.averageInvoiceAmount.toFixed(2)}`, 40, 85);
  if (metrics.growthRate !== null) {
    const sign = metrics.growthRate >= 0 ? '+' : '';
    doc.text(`Crecimiento vs Período Anterior: ${sign}${(metrics.growthRate * 100).toFixed(2)}%`, 40, 100);
  }

  if (metrics.monthlyRevenue.length > 0) {
    doc.text('Ingresos por Mes:', 40, 120);
    const rows = metrics.monthlyRevenue.map((m) => [m.period, `$${m.amount.toFixed(2)}`]);
    autoTable(doc, {
      head: [['Mes', 'Monto']],
      body: rows,
      startY: 130,
      styles: { fontSize: 9 },
    });
  }

  return doc.output('arraybuffer');
}

export interface InvoicePDFData {
  invoiceNumber: string;
  customerName: string;
  date: Date;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  taxAmount: number;
  total: number;
}

export function generateInvoicePDF(data: InvoicePDFData): Uint8Array {
  const doc = new jspdf({ orientation: 'p', unit: 'pt', format: 'a4' });
  
  // Header
  doc.setFontSize(20);
  doc.text('HAGO PRODUCE', 40, 40);
  doc.setFontSize(10);
  doc.text('Dirección de la empresa', 40, 55);
  doc.text('Teléfono: +506 8888-8888', 40, 68);
  
  // Invoice Details
  doc.setFontSize(16);
  doc.text(`FACTURA #${data.invoiceNumber}`, 350, 40);
  doc.setFontSize(10);
  doc.text(`Fecha: ${formatDate(data.date)}`, 350, 60);
  doc.text(`Cliente: ${data.customerName}`, 350, 75);

  // Items Table
  const rows = data.items.map((item) => [
    item.description,
    item.quantity.toString(),
    `$${item.unitPrice.toFixed(2)}`,
    `$${item.total.toFixed(2)}`,
  ]);

  autoTable(doc, {
    head: [['Descripción', 'Cant', 'Precio Unit', 'Total']],
    body: rows,
    startY: 100,
    theme: 'striped',
    styles: { fontSize: 10 },
    headStyles: { fillColor: [41, 128, 185] },
  });

  // Totals
  const finalY = (doc as any).lastAutoTable.finalY + 20;
  doc.text(`Subtotal:`, 350, finalY);
  doc.text(`$${data.subtotal.toFixed(2)}`, 450, finalY, { align: 'right' });
  
  doc.text(`Impuestos (13%):`, 350, finalY + 15);
  doc.text(`$${data.taxAmount.toFixed(2)}`, 450, finalY + 15, { align: 'right' });
  
  doc.setFontSize(12);
  doc.text(`TOTAL:`, 350, finalY + 35);
  doc.text(`$${data.total.toFixed(2)}`, 450, finalY + 35, { align: 'right' });

  // Footer
  doc.setFontSize(8);
  doc.text('Gracias por su preferencia.', 40, finalY + 60);

  return doc.output('arraybuffer');
}

export async function generateInvoicesZIP(invoices: InvoicePDFData[]): Promise<Blob> {
  const zip = new JSZip();
  
  // Generate PDFs for each invoice
  invoices.forEach((invoice) => {
    const pdfData = generateInvoicePDF(invoice);
    const fileName = `Factura-${invoice.invoiceNumber}.pdf`;
    zip.file(fileName, pdfData);
  });

  // Generate the ZIP file
  const content = await zip.generateAsync({ type: 'blob' });
  return content;
}

export interface PurchaseOrderPDFData {
  orderNumber: string;
  supplierName: string;
  date: Date;
  deliveryDate?: Date;
  items: Array<{
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  taxAmount: number;
  total: number;
  notes?: string;
}

export function generatePurchaseOrderPDF(data: PurchaseOrderPDFData): Uint8Array {
  const doc = new jspdf({ orientation: 'p', unit: 'pt', format: 'a4' });
  
  // Header
  doc.setFontSize(20);
  doc.text('HAGO PRODUCE', 40, 40);
  doc.setFontSize(10);
  doc.text('Orden de Compra', 40, 55);
  doc.text('Teléfono: +506 8888-8888', 40, 68);
  
  // Order Details
  doc.setFontSize(16);
  doc.text(`ORDEN #${data.orderNumber}`, 350, 40);
  doc.setFontSize(10);
  doc.text(`Fecha: ${formatDate(data.date)}`, 350, 60);
  if (data.deliveryDate) {
    doc.text(`Entrega: ${formatDate(data.deliveryDate)}`, 350, 75);
  }
  doc.text(`Proveedor: ${data.supplierName}`, 350, 90);

  // Items Table
  const rows = data.items.map((item) => [
    item.description,
    `${item.quantity} ${item.unit}`,
    `$${item.unitPrice.toFixed(2)}`,
    `$${item.total.toFixed(2)}`,
  ]);

  autoTable(doc, {
    head: [['Descripción', 'Cant', 'Precio Unit', 'Total']],
    body: rows,
    startY: 120,
    theme: 'striped',
    styles: { fontSize: 10 },
    headStyles: { fillColor: [46, 204, 113] }, // Green for POs
  });

  // Totals
  const finalY = (doc as any).lastAutoTable.finalY + 20;
  doc.text(`Subtotal:`, 350, finalY);
  doc.text(`$${data.subtotal.toFixed(2)}`, 450, finalY, { align: 'right' });
  
  doc.text(`Impuestos (13%):`, 350, finalY + 15);
  doc.text(`$${data.taxAmount.toFixed(2)}`, 450, finalY + 15, { align: 'right' });
  
  doc.setFontSize(12);
  doc.text(`TOTAL:`, 350, finalY + 35);
  doc.text(`$${data.total.toFixed(2)}`, 450, finalY + 35, { align: 'right' });

  // Notes
  if (data.notes) {
    doc.setFontSize(10);
    doc.text('Notas:', 40, finalY + 60);
    doc.setFontSize(9);
    doc.text(data.notes, 40, finalY + 75, { maxWidth: 500 });
  }

  return doc.output('arraybuffer');
}

function buildAgingPDF(report: AgingReport): Uint8Array {
  const doc = new jspdf({ orientation: 'p', unit: 'pt', format: 'a4' });
  doc.setFontSize(16);
  doc.text('Reporte de Vencimiento', 40, 40);

  doc.setFontSize(10);
  doc.text(`Fecha de Corte: ${formatDate(new Date(report.asOfDate))}`, 40, 70);

  const rows = report.buckets.map((b) => [b.bucket, b.invoiceCount, `$${b.totalAmount.toFixed(2)}`]);
  autoTable(doc, {
    head: [['Rango de Días', 'Cantidad de Facturas', 'Monto Total']],
    body: rows,
    startY: 90,
    styles: { fontSize: 9 },
  });

  return doc.output('arraybuffer');
}

function buildTopCustomersPDF(customers: TopCustomer[]): Uint8Array {
  const doc = new jspdf({ orientation: 'p', unit: 'pt', format: 'a4' });
  doc.setFontSize(16);
  doc.text('Top Clientes', 40, 40);

  const rows = customers.map((c) => [
    c.customerName,
    c.invoiceCount,
    `$${c.totalRevenue.toFixed(2)}`,
    `$${c.averageInvoiceAmount.toFixed(2)}`,
  ]);
  autoTable(doc, {
    head: [['Cliente', 'Facturas', 'Ingreso Total', 'Promedio por Factura']],
    body: rows,
    startY: 60,
    styles: { fontSize: 9 },
  });

  return doc.output('arraybuffer');
}

function buildTopProductsPDF(products: TopProduct[]): Uint8Array {
  const doc = new jspdf({ orientation: 'p', unit: 'pt', format: 'a4' });
  doc.setFontSize(16);
  doc.text('Top Productos', 40, 40);

  const rows = products.map((p) => [
    p.productName,
    p.totalQuantity,
    `$${p.totalRevenue.toFixed(2)}`,
    `$${p.averagePrice.toFixed(2)}`,
  ]);
  autoTable(doc, {
    head: [['Producto', 'Cantidad Vendida', 'Ingreso Total', 'Precio Promedio']],
    body: rows,
    startY: 60,
    styles: { fontSize: 9 },
  });

  return doc.output('arraybuffer');
}

function buildPriceTrendsPDF(trends: ProductPriceTrends): Uint8Array {
  const doc = new jspdf({ orientation: 'p', unit: 'pt', format: 'a4' });
  doc.setFontSize(16);
  doc.text('Tendencia de Precios', 40, 40);

  doc.setFontSize(10);
  if (trends.currentPrice !== null) {
    doc.text(`Precio Actual: $${trends.currentPrice.toFixed(2)}`, 40, 70);
  }
  if (trends.changeVsPreviousPeriod !== null) {
    const sign = trends.changeVsPreviousPeriod >= 0 ? '+' : '';
    doc.text(`Cambio vs Mes Anterior: ${sign}${(trends.changeVsPreviousPeriod * 100).toFixed(2)}%`, 40, 85);
  }

  if (trends.monthlyAverage.length > 0) {
    doc.text('Promedio Mensual:', 40, 105);
    const rows = trends.monthlyAverage.map((m) => [m.period, `$${m.averagePrice.toFixed(2)}`]);
    autoTable(doc, {
      head: [['Mes', 'Precio Promedio']],
      body: rows,
      startY: 115,
      styles: { fontSize: 9 },
    });
  }

  return doc.output('arraybuffer');
}

export function buildPDF(reportType: ReportType, data: any): { buffer: Uint8Array; filename: string } {
  let buffer: Uint8Array;
  switch (reportType) {
    case 'revenue':
      buffer = buildRevenuePDF(data as RevenueMetrics);
      break;
    case 'aging':
      buffer = buildAgingPDF(data as AgingReport);
      break;
    case 'top-customers':
      buffer = buildTopCustomersPDF(data as TopCustomer[]);
      break;
    case 'top-products':
      buffer = buildTopProductsPDF(data as TopProduct[]);
      break;
    case 'price-trends':
      buffer = buildPriceTrendsPDF(data as ProductPriceTrends);
      break;
    default:
      throw new Error(`ReportType desconocido: ${reportType}`);
  }
  return { buffer, filename: filename(reportType, 'pdf') };
}

function buildRevenueCSV(metrics: RevenueMetrics): { buffer: Uint8Array; filename: string } {
  const rows = [
    ['Total de Ingresos', metrics.totalRevenue.toFixed(2)],
    ['Promedio por Factura', metrics.averageInvoiceAmount.toFixed(2)],
    ['Ingresos Período Anterior', metrics.previousPeriodRevenue.toFixed(2)],
    ['Crecimiento', metrics.growthRate !== null ? `${(metrics.growthRate * 100).toFixed(2)}%` : 'N/A'],
    [],
    ['Mes', 'Monto'],
    ...metrics.monthlyRevenue.map((m) => [m.period, m.amount.toFixed(2)]),
  ];
  const csv = stringify(rows);
  return { buffer: Buffer.from(csv, 'utf8'), filename: filename('revenue', 'csv') };
}

function buildAgingCSV(report: AgingReport): { buffer: Uint8Array; filename: string } {
  const rows = [
    ['Rango de Días', 'Cantidad de Facturas', 'Monto Total'],
    ...report.buckets.map((b) => [b.bucket, String(b.invoiceCount), b.totalAmount.toFixed(2)]),
  ];
  const csv = stringify(rows);
  return { buffer: Buffer.from(csv, 'utf8'), filename: filename('aging', 'csv') };
}

function buildTopCustomersCSV(customers: TopCustomer[]): { buffer: Uint8Array; filename: string } {
  const rows = [
    ['Cliente', 'Facturas', 'Ingreso Total', 'Promedio por Factura'],
    ...customers.map((c) => [
      c.customerName,
      String(c.invoiceCount),
      c.totalRevenue.toFixed(2),
      c.averageInvoiceAmount.toFixed(2),
    ]),
  ];
  const csv = stringify(rows);
  return { buffer: Buffer.from(csv, 'utf8'), filename: filename('top-customers', 'csv') };
}

function buildTopProductsCSV(products: TopProduct[]): { buffer: Uint8Array; filename: string } {
  const rows = [
    ['Producto', 'Cantidad Vendida', 'Ingreso Total', 'Precio Promedio'],
    ...products.map((p) => [
      p.productName,
      String(p.totalQuantity),
      p.totalRevenue.toFixed(2),
      p.averagePrice.toFixed(2),
    ]),
  ];
  const csv = stringify(rows);
  return { buffer: Buffer.from(csv, 'utf8'), filename: filename('top-products', 'csv') };
}

function buildPriceTrendsCSV(trends: ProductPriceTrends): { buffer: Uint8Array; filename: string } {
  const rows = [
    ['Producto', 'Precio Actual', 'Cambio vs Mes Anterior'],
    [
      trends.productId,
      trends.currentPrice !== null ? trends.currentPrice.toFixed(2) : 'N/A',
      trends.changeVsPreviousPeriod !== null ? `${(trends.changeVsPreviousPeriod * 100).toFixed(2)}%` : 'N/A',
    ],
    [],
    ['Mes', 'Precio Promedio'],
    ...trends.monthlyAverage.map((m) => [m.period, m.averagePrice.toFixed(2)]),
  ];
  const csv = stringify(rows);
  return { buffer: Buffer.from(csv, 'utf8'), filename: filename('price-trends', 'csv') };
}

export function buildCSV(reportType: ReportType, data: any): { buffer: Uint8Array; filename: string } {
  switch (reportType) {
    case 'revenue':
      return buildRevenueCSV(data as RevenueMetrics);
    case 'aging':
      return buildAgingCSV(data as AgingReport);
    case 'top-customers':
      return buildTopCustomersCSV(data as TopCustomer[]);
    case 'top-products':
      return buildTopProductsCSV(data as TopProduct[]);
    case 'price-trends':
      return buildPriceTrendsCSV(data as ProductPriceTrends);
    default:
      throw new Error(`ReportType desconocido: ${reportType}`);
  }
}