import prisma from '@/lib/db';
import { logInvoiceCreate, logInvoiceUpdate } from '@/lib/audit/invoices';
import { InvoiceStatus } from '@prisma/client';

jest.mock('@/lib/db', () => {
  const mockPrisma = {
    auditLog: {
      create: jest.fn(),
    },
  };

  return {
    __esModule: true,
    default: mockPrisma,
  };
});

describe('Invoice Audit Logging', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create audit log on invoice create', async () => {
    const invoice = {
      id: 'inv-1',
      status: InvoiceStatus.DRAFT,
      subtotal: 100,
      taxRate: 0.13,
      taxAmount: 13,
      total: 113,
    };

    await logInvoiceCreate('user-1', invoice);

    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          action: 'create',
          entityType: 'invoice',
          entityId: 'inv-1',
        }),
      }),
    );
  });

  it('should create audit log with changes diff on update', async () => {
    const before = {
      id: 'inv-1',
      status: InvoiceStatus.DRAFT,
      subtotal: 100,
      taxRate: 0.13,
      taxAmount: 13,
      total: 113,
    };

    const after = {
      ...before,
      subtotal: 200,
      taxAmount: 26,
      total: 226,
    };

    await logInvoiceUpdate('user-1', before, after);

    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'update',
          entityType: 'invoice',
          entityId: 'inv-1',
        }),
      }),
    );
  });
});

