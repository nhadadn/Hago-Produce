import { jest } from '@jest/globals';
import { InvoiceStatus } from '@prisma/client';

describe('InvoicesService', () => {
  let invoicesService: any;
  let mockPrisma: any;
  let mockLogCreate: any;
  let mockLogUpdate: any;
  let mockLogStatusChange: any;

  beforeAll(async () => {
    jest.resetModules();

    // Mock DB
    jest.mock('@/lib/db', () => ({
      __esModule: true,
      default: {
        invoice: {
          findFirst: jest.fn(),
          create: jest.fn(),
          count: jest.fn(),
          findMany: jest.fn(),
          findUnique: jest.fn(),
          update: jest.fn(),
        },
        invoiceItem: {
          deleteMany: jest.fn(),
          createMany: jest.fn(),
        },
        $transaction: jest.fn((callback: any) => callback(require('@/lib/db').default)),
      },
    }));

    // Mock Audit
    jest.mock('@/lib/audit/invoices', () => ({
      __esModule: true,
      logInvoiceCreate: jest.fn(),
      logInvoiceUpdate: jest.fn(),
      logInvoiceStatusChange: jest.fn(),
    }));

    // Import dependencies
    const dbModule = await import('@/lib/db');
    mockPrisma = dbModule.default;

    const auditModule = await import('@/lib/audit/invoices');
    mockLogCreate = auditModule.logInvoiceCreate;
    mockLogUpdate = auditModule.logInvoiceUpdate;
    mockLogStatusChange = auditModule.logInvoiceStatusChange;

    // Import service
    const serviceModule = await import('@/lib/services/invoices.service');
    invoicesService = serviceModule.invoicesService;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation(async (callback: any) => {
      return callback(mockPrisma);
    });
  });

  describe('create', () => {
    const createInput = {
      customerId: 'cust-1',
      issueDate: new Date('2024-01-01'),
      dueDate: new Date('2024-01-15'),
      items: [
        { productId: 'prod-1', quantity: 10, unitPrice: 100, description: 'Item 1' },
        { productId: 'prod-2', quantity: 5, unitPrice: 200, description: 'Item 2' },
      ],
      notes: 'Test note',
    };

    it('creates an invoice successfully with calculated totals', async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue(null);

      const createdInvoice = {
        id: 'inv-1',
        ...createInput,
        number: 'INV-2024-0001',
        subtotal: 2000,
        taxAmount: 260,
        total: 2260,
        status: InvoiceStatus.DRAFT,
      };

      mockPrisma.invoice.create.mockResolvedValue(createdInvoice);

      const result = await invoicesService.create(createInput, 'user-1');

      expect(mockPrisma.invoice.findFirst).toHaveBeenCalled();
      expect(mockPrisma.invoice.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          subtotal: 2000,
          taxAmount: 260,
          total: 2260,
          number: expect.stringMatching(/INV-\d{4}-0001/),
        }),
      }));
      expect(mockLogCreate).toHaveBeenCalledWith('user-1', expect.objectContaining({
        id: 'inv-1',
        total: 2260,
      }));
      expect(result).toEqual(createdInvoice);
    });

    it('generates sequential invoice numbers', async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue({
        number: 'INV-2024-0042',
      });

      mockPrisma.invoice.create.mockImplementation((args: any) => ({
        id: 'inv-new',
        ...args.data,
      }));

      await invoicesService.create(createInput, 'user-1');

      expect(mockPrisma.invoice.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          number: expect.stringMatching(/INV-\d{4}-0043/),
        }),
      }));
    });
  });

  describe('findAll', () => {
    it('returns paginated invoices with filters', async () => {
      const filters = {
        page: 2,
        limit: 5,
        status: InvoiceStatus.PAID,
        search: 'Acme',
      };

      const mockInvoices = [{ id: 'inv-1' }, { id: 'inv-2' }];
      mockPrisma.invoice.count.mockResolvedValue(12);
      mockPrisma.invoice.findMany.mockResolvedValue(mockInvoices);

      const result = await invoicesService.findAll(filters);

      expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith(expect.objectContaining({
        skip: 5,
        take: 5,
        where: expect.objectContaining({
          status: InvoiceStatus.PAID,
          OR: expect.arrayContaining([
            { number: { contains: 'Acme', mode: 'insensitive' } },
            { customer: { name: { contains: 'Acme', mode: 'insensitive' } } },
          ]),
        }),
      }));

      expect(result).toEqual({
        data: mockInvoices,
        meta: {
          total: 12,
          page: 2,
          limit: 5,
          totalPages: 3,
        },
      });
    });
  });

  describe('findOne', () => {
    it('returns invoice with relations', async () => {
      const mockInvoice = { id: 'inv-1', items: [], customer: {} };
      mockPrisma.invoice.findUnique.mockResolvedValue(mockInvoice);

      const result = await invoicesService.findOne('inv-1');

      expect(mockPrisma.invoice.findUnique).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'inv-1' },
        include: expect.objectContaining({
          items: expect.objectContaining({
            include: expect.objectContaining({
              product: expect.objectContaining({
                select: expect.objectContaining({ name: true, sku: true })
              })
            })
          }),
          customer: true,
        }),
      }));
      expect(result).toEqual(mockInvoice);
    });

    it('returns null if not found', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue(null);
      const result = await invoicesService.findOne('inv-999');
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    const existingInvoice = {
      id: 'inv-1',
      status: InvoiceStatus.DRAFT,
      subtotal: 1000,
      taxRate: 0.13,
      taxAmount: 130,
      total: 1130,
      items: [],
    };

    it('updates a draft invoice successfully', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue(existingInvoice);
      mockPrisma.invoice.update.mockResolvedValue({ ...existingInvoice, notes: 'Updated' });

      const updateData = { notes: 'Updated' };
      await invoicesService.update('inv-1', updateData, 'user-1');

      expect(mockPrisma.invoice.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'inv-1' },
        data: expect.objectContaining({ notes: 'Updated' }),
      }));
      expect(mockLogUpdate).toHaveBeenCalled();
    });

    it('throws error if invoice not found', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue(null);
      await expect(invoicesService.update('inv-999', {})).rejects.toThrow('Invoice not found');
    });

    it('throws error if status is not DRAFT', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue({
        ...existingInvoice,
        status: InvoiceStatus.SENT,
      });
      await expect(invoicesService.update('inv-1', {})).rejects.toThrow('Only draft invoices can be updated');
    });

    it('updates items and recalculates totals', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue(existingInvoice);
      
      const newItems = [
        { productId: 'prod-new', quantity: 2, unitPrice: 50, description: 'New Item' }
      ];

      mockPrisma.invoice.update.mockResolvedValue({
        id: 'inv-1',
        subtotal: 100,
        total: 113,
      });

      await invoicesService.update('inv-1', { items: newItems }, 'user-1');

      expect(mockPrisma.invoiceItem.deleteMany).toHaveBeenCalledWith({ where: { invoiceId: 'inv-1' } });
      expect(mockPrisma.invoiceItem.createMany).toHaveBeenCalled();
      expect(mockPrisma.invoice.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          subtotal: 100,
          total: 113,
        }),
      }));
    });
  });

  describe('changeStatus', () => {
    const existingInvoice = {
      id: 'inv-1',
      status: InvoiceStatus.DRAFT,
    };

    it('changes status for valid transition', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue(existingInvoice);
      mockPrisma.invoice.update.mockResolvedValue({
        ...existingInvoice,
        status: InvoiceStatus.SENT,
      });

      await invoicesService.changeStatus('inv-1', InvoiceStatus.SENT, 'user-1');

      expect(mockPrisma.invoice.update).toHaveBeenCalledWith({
        where: { id: 'inv-1' },
        data: { status: InvoiceStatus.SENT },
      });
      expect(mockLogStatusChange).toHaveBeenCalledWith('user-1', 'inv-1', InvoiceStatus.DRAFT, InvoiceStatus.SENT);
    });

    it('throws error for invalid transition', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue(existingInvoice);
      await expect(invoicesService.changeStatus('inv-1', InvoiceStatus.OVERDUE))
        .rejects.toThrow('Invalid status transition');
    });

    it('throws error if invoice not found', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue(null);
      await expect(invoicesService.changeStatus('inv-999', InvoiceStatus.SENT))
        .rejects.toThrow('Invoice not found');
    });
  });
});
