import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate, formatCurrency } from '@/lib/utils';
import { InvoiceWithDetails } from '@/lib/api/invoices';

export const generateInvoicePDF = (invoice: InvoiceWithDetails): Blob => {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.text('FACTURA', 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`Folio: ${invoice.number}`, 14, 30);
  doc.text(`Fecha de Emisión: ${formatDate(invoice.issueDate)}`, 14, 35);
  doc.text(`Fecha de Vencimiento: ${formatDate(invoice.dueDate)}`, 14, 40);
  doc.text(`Estado: ${invoice.status}`, 14, 45);

  // Customer Info
  doc.setFontSize(12);
  doc.text('Cliente:', 14, 55);
  doc.setFontSize(10);
  doc.text(invoice.customer.name, 14, 60);
  doc.text(invoice.customer.taxId || 'N/A', 14, 65);
  doc.text(invoice.customer.email || 'N/A', 14, 70);

  // Table
  const tableColumn = ["Descripción", "Cantidad", "Precio Unitario", "Total"];
  const tableRows: any[] = [];

  invoice.items.forEach(item => {
    const itemData = [
      item.description,
      item.quantity,
      formatCurrency(Number(item.unitPrice)),
      formatCurrency(Number(item.total)),
    ];
    tableRows.push(itemData);
  });

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 80,
    theme: 'striped',
    styles: { fontSize: 10 },
    headStyles: { fillColor: [22, 163, 74] }, // Green-600
  });

  // Totals
  const finalY = (doc as any).lastAutoTable.finalY || 80;
  
  doc.text(`Subtotal: ${formatCurrency(Number(invoice.subtotal))}`, 140, finalY + 10);
  doc.text(`IVA (${Number(invoice.taxRate) * 100}%): ${formatCurrency(Number(invoice.taxAmount))}`, 140, finalY + 15);
  doc.setFontSize(12);
  doc.text(`Total: ${formatCurrency(Number(invoice.total))}`, 140, finalY + 25);

  // Footer
  doc.setFontSize(8);
  doc.text('Gracias por su preferencia.', 105, 280, { align: 'center' });

  return doc.output('blob');
};
