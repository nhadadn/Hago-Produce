import { NextRequest } from 'next/server';
import { PATCH } from '@/app/api/v1/invoices/[id]/status/route';
import prisma from '@/lib/db';
import { InvoiceStatus, Role } from '@prisma/client';
import { NotificationTriggers } from '@/lib/services/notifications/triggers';

jest.mock('@/lib/auth/middleware', () => ({
  getAuthenticatedUser: jest.fn().mockResolvedValue({ userId: 'user-1', role: 'ADMIN' }),
  unauthorizedResponse: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  invoice: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock('@/lib/services/invoices.service', () => ({
  invoicesService: {
    changeStatus: jest.fn(async (id: string, status: InvoiceStatus) => ({ id, status })),
  },
}));

jest.mock('@/lib/services/notifications/triggers', () => ({
  NotificationTriggers: {
    handleInvoiceStatusChange: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('PATCH /api/v1/invoices/[id]/status triggers notification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.invoice.findUnique as jest.Mock).mockResolvedValue({ id: 'inv-1', status: InvoiceStatus.PENDING });
  });

  it('calls NotificationTriggers after status change', async () => {
    const req = new NextRequest('http://localhost/api/v1/invoices/inv-1/status', {
      method: 'PATCH',
      body: JSON.stringify({ status: InvoiceStatus.PAID }),
    });

    const res = await PATCH(req, { params: { id: 'inv-1' } as any });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(NotificationTriggers.handleInvoiceStatusChange).toHaveBeenCalledWith(
      'inv-1',
      InvoiceStatus.PENDING,
      InvoiceStatus.PAID,
    );
  });
});

