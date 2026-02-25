import { NextRequest } from 'next/server';
import { POST } from '@/app/api/v1/invoices/bulk-download/route';
import { getAuthenticatedUser } from '@/lib/auth/middleware';
import { Role } from '@prisma/client';
import prisma from '@/lib/db';
import { generateInvoicePDF } from '@/lib/services/reports/export';

// Mocks
jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    invoice: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth/middleware', () => ({
  getAuthenticatedUser: jest.fn(),
}));

jest.mock('@/lib/services/reports/export', () => ({
  generateInvoicePDF: jest.fn(),
}));

describe('Bulk Download API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if not authenticated', async () => {
    (getAuthenticatedUser as jest.Mock).mockResolvedValue(null);
    const req = new NextRequest('http://localhost/api/v1/invoices/bulk-download', {
      method: 'POST',
      body: JSON.stringify({ invoiceIds: ['1'] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('should return 400 if invoiceIds is missing or empty', async () => {
    (getAuthenticatedUser as jest.Mock).mockResolvedValue({ userId: '1', role: Role.CUSTOMER });
    const req = new NextRequest('http://localhost/api/v1/invoices/bulk-download', {
      method: 'POST',
      body: JSON.stringify({ invoiceIds: [] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('should return ZIP file', async () => {
    (getAuthenticatedUser as jest.Mock).mockResolvedValue({ userId: '1', role: Role.CUSTOMER });
    
    // Mock invoices
    (prisma.invoice.findMany as jest.Mock).mockResolvedValue([
      { 
        id: '1', 
        number: 'INV-001', 
        issueDate: new Date(),
        items: [],
        customer: { name: 'Cust1' },
        subtotal: 100,
        tax: 16,
        total: 116
      }
    ]);

    // Mock PDF generation
    (generateInvoicePDF as jest.Mock).mockReturnValue(Buffer.from('pdf-content'));

    const req = new NextRequest('http://localhost/api/v1/invoices/bulk-download', {
      method: 'POST',
      body: JSON.stringify({ invoiceIds: ['1'] }),
    });
    const res = await POST(req);
    
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/zip');
    expect(generateInvoicePDF).toHaveBeenCalled();
  });
});
