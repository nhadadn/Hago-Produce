import { formatOverdueInvoices } from '../src/lib/services/chat/formatters/overdue-invoices.formatter';

const testData = {
  type: 'overdue_invoices',
  mode: 'single_customer',
  customerName: 'Walmart',
  totalOverdue: 5200.00,
  grandTotalOverdue: 8500.75,
  invoicesCount: 3,
  currency: 'CAD',
  items: [
    {
      invoiceNumber: 'INV-001',
      total: 2000.00,
      currency: 'CAD',
      daysOverdue: 45,
      urgencyLabel: 'High',
      dueDate: '2024-01-15T00:00:00.000Z'
    },
    {
      invoiceNumber: 'INV-002',
      total: 1700.00,
      currency: 'CAD',
      daysOverdue: 32,
      urgencyLabel: 'High',
      dueDate: '2024-01-28T00:00:00.000Z'
    },
    {
      invoiceNumber: 'INV-003',
      total: 1500.00,
      currency: 'CAD',
      daysOverdue: 18,
      urgencyLabel: 'Pending',
      dueDate: '2024-02-11T00:00:00.000Z'
    }
  ]
};

const output = formatOverdueInvoices(testData, 'en');
console.log(output);