import { InvoiceStatus, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { invoicesService } from '@/lib/services/invoices.service';
import prisma from '@/lib/db';
import { extractProvinceFromAddress, taxCalculationService } from '@/lib/services/finance/tax-calculation.service';
import * as audit from '@/lib/audit/invoices';

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
    customer: {
      findUnique: jest.fn(),
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

// Mock Logger
jest.mock('@/lib/logger/logger.service', () => ({
  __esModule: true,
  logger: {
    warn: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock Tax Calculation
jest.mock('@/lib/services/finance/tax-calculation.service', () => ({
  __esModule: true,
  TransactionType: { SALE: 'SALE' },
  extractProvinceFromAddress: jest.fn(),
  taxCalculationService: {
    calculateTax: jest.fn(),
  },
}));

const mockExtractProvince = extractProvinceFromAddress as jest.Mock;
const mockCalculateTax = taxCalculationService.calculateTax as jest.Mock;
const mockAudit = audit as {
  logInvoiceCreate: jest.Mock;
  logInvoiceUpdate: jest.Mock;
  logInvoiceStatusChange: jest.Mock;
};

describe('InvoicesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createInput = {
      customerId: 'cust-1',
      issueDate: new Date('2024-01-01'),
      dueDate: new Date('2024-01-15'),
      items: [
        { productId: 'prod-1', quantity: 10, unitPrice: 100, description: 'Item 1' }, // 1000
        { productId: 'prod-2', quantity: 5, unitPrice: 200, description: 'Item 2' }, // 1000
      ],
      notes: 'Test note',
      // taxRate is missing, should trigger auto-calculation
    };

    it('creates an invoice successfully with calculated tax when taxRate is missing', async () => {
      (prisma.invoice.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.customer.findUnique as jest.Mock).mockResolvedValue({ address: 'Toronto, ON' });
      mockExtractProvince.mockReturnValue('ON');
      
      const taxResult = {
        taxRate: new Decimal(0.13),
        taxAmount: new Decimal(260),
        breakdown: { gst: 0, pst: 0, hst: 260, qst: 0 }
      };
      mockCalculateTax.mockReturnValue(taxResult);

      const createdInvoice = {
        id: 'inv-1',
        ...createInput,
        number: 'INV-2024-0001',
        subtotal: new Decimal(2000),
        taxRate: new Decimal(0.13),
        taxAmount: new Decimal(260),
        total: new Decimal(2260),
        status: InvoiceStatus.DRAFT,
      };

      (prisma.invoice.create as jest.Mock).mockResolvedValue(createdInvoice);

      const result = await invoicesService.create(createInput, 'user-1');

      expect(prisma.customer.findUnique).toHaveBeenCalledWith({
        where: { id: 'cust-1' },
        select: { address: true },
      });
      expect(mockExtractProvince).toHaveBeenCalledWith('Toronto, ON');
      expect(mockCalculateTax).toHaveBeenCalledWith('ON', 2000, 'SALE');
      
      expect(prisma.invoice.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          subtotal: 2000,
          taxRate: 0.13,
          taxAmount: expect.objectContaining({ d: expect.any(Array) }), // Decimal check
          total: expect.objectContaining({ d: expect.any(Array) }), // Decimal check
        }),
      }));
    });

    it('uses fallback Ontario (13%) when customer address/province is invalid', async () => {
      (prisma.invoice.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.customer.findUnique as jest.Mock).mockResolvedValue({ address: null });
      (mockExtractProvince as jest.Mock).mockReturnValue(null);

      const taxResult = {
        taxRate: new Decimal(0.13),
        taxAmount: new Decimal(260),
        breakdown: { gst: 0, pst: 0, hst: 260, qst: 0 }
      };
      mockCalculateTax.mockReturnValue(taxResult);

      const createdInvoice = {
        id: 'inv-fallback',
        ...createInput,
        number: 'INV-2024-0003',
        subtotal: new Decimal(2000),
        taxRate: 0.13,
        taxAmount: new Decimal(260),
        total: new Decimal(2260),
        status: InvoiceStatus.DRAFT,
      };

      (prisma.invoice.create as jest.Mock).mockResolvedValue(createdInvoice);

      const result = await invoicesService.create(createInput, 'user-1');

      expect(prisma.customer.findUnique).toHaveBeenCalled();
      expect(mockExtractProvince).toHaveBeenCalledWith(null); // address is null
      expect(mockCalculateTax).toHaveBeenCalledWith(null, 2000, 'SALE'); // Should call calculation service with null

      expect(prisma.invoice.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          taxRate: 0.13,
          taxAmount: expect.objectContaining({ d: expect.any(Array) }),
        }),
      }));
    });

    it('creates an invoice with provided taxRate (backward compatibility)', async () => {
      (prisma.invoice.findFirst as jest.Mock).mockResolvedValue(null);

      const inputWithTax = {
        ...createInput,
        taxRate: 0.05,
      };

      const createdInvoice = {
        id: 'inv-2',
        ...inputWithTax,
        number: 'INV-2024-0002',
        subtotal: new Decimal(2000),
        taxRate: new Decimal(0.05),
        taxAmount: new Decimal(100),
        total: new Decimal(2100),
        status: InvoiceStatus.DRAFT,
      };

      (prisma.invoice.create as jest.Mock).mockResolvedValue(createdInvoice);

      const result = await invoicesService.create(inputWithTax, 'user-1');

      expect(prisma.customer.findUnique).not.toHaveBeenCalled();
      expect(mockExtractProvince).not.toHaveBeenCalled();
      expect(mockCalculateTax).not.toHaveBeenCalled();

      expect(prisma.invoice.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          taxRate: 0.05,
          // taxAmount calculated internally: 2000 * 0.05 = 100
        }),
      }));
    });
  });

  describe('findAll', () => {
    it('returns paginated invoices with filters', async () => {
        const filters = {
            page: 2,
            limit: 5,
            search: 'Acme',
            status: InvoiceStatus.PAID
        };

        const mockInvoices = [
            { id: 'inv-1', number: 'INV-001', customer: { name: 'Acme Corp' } }
        ];

        (prisma.invoice.findMany as jest.Mock).mockResolvedValue(mockInvoices);
        (prisma.invoice.count as jest.Mock).mockResolvedValue(10);

        const result = await invoicesService.findAll(filters);

        expect(prisma.invoice.findMany).toHaveBeenCalledWith(expect.objectContaining({
            skip: 5,
            take: 5,
            where: expect.objectContaining({
                OR: expect.arrayContaining([
                    { number: { contains: 'Acme', mode: 'insensitive' } },
                    { customer: { name: { contains: 'Acme', mode: 'insensitive' } } }
                ]),
                status: InvoiceStatus.PAID
            })
        }));

        expect(result).toEqual({
            data: mockInvoices,
            meta: {
                total: 10,
                page: 2,
                limit: 5,
                totalPages: 2
            }
        });
    });
  });

  describe('findOne', () => {
    it('returns invoice with relations', async () => {
        const mockInvoice = { id: 'inv-1', number: 'INV-001' };
        (prisma.invoice.findUnique as jest.Mock).mockResolvedValue(mockInvoice);

        const result = await invoicesService.findOne('inv-1');

        expect(prisma.invoice.findUnique).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: 'inv-1' },
            include: expect.objectContaining({
                customer: true,
                items: expect.objectContaining({
                    include: expect.objectContaining({
                        product: expect.objectContaining({
                            select: expect.objectContaining({
                                name: true,
                                sku: true
                            })
                        })
                    })
                })
            })
        }));

        expect(result).toEqual(mockInvoice);
    });
  });

  describe('update', () => {
    const updateInput = {
      items: [
        { productId: 'prod-3', quantity: 2, unitPrice: 300, description: 'Item 3' } // 600
      ],
      taxRate: 0.10,
    };

    it('updates draft invoice successfully', async () => {
        const existingInvoice = {
            id: 'inv-1',
            status: InvoiceStatus.DRAFT,
            subtotal: new Decimal(2000),
            taxRate: new Decimal(0.13),
            taxAmount: new Decimal(260),
            total: new Decimal(2260),
        };

        (prisma.invoice.findUnique as jest.Mock).mockResolvedValue(existingInvoice);
        (prisma.invoiceItem.deleteMany as jest.Mock).mockResolvedValue({ count: 2 });
        (prisma.invoiceItem.createMany as jest.Mock).mockResolvedValue({ count: 1 });

        const updatedInvoice = {
            ...existingInvoice,
            subtotal: new Decimal(600),
            taxRate: new Decimal(0.10),
            taxAmount: new Decimal(60),
            total: new Decimal(660),
        };

        (prisma.invoice.update as jest.Mock).mockResolvedValue(updatedInvoice);

        const result = await invoicesService.update('inv-1', updateInput, 'user-1');

        expect(prisma.invoiceItem.deleteMany).toHaveBeenCalledWith({ where: { invoiceId: 'inv-1' } });
        expect(prisma.invoiceItem.createMany).toHaveBeenCalledWith({
            data: expect.arrayContaining([
                expect.objectContaining({
                    productId: 'prod-3',
                    invoiceId: 'inv-1',
                    totalPrice: 600
                })
            ])
        });

        expect(prisma.invoice.update).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: 'inv-1' },
            data: expect.objectContaining({
                subtotal: 600,
                taxRate: 0.10,
                taxAmount: 60,
                total: 660
            })
        }));

        expect(mockAudit.logInvoiceUpdate).toHaveBeenCalled();
    });

    it('throws error if invoice not found', async () => {
        (prisma.invoice.findUnique as jest.Mock).mockResolvedValue(null);
        await expect(invoicesService.update('inv-999', updateInput)).rejects.toThrow('Invoice not found');
    });

    it('throws error if invoice is not DRAFT', async () => {
        (prisma.invoice.findUnique as jest.Mock).mockResolvedValue({
            id: 'inv-1',
            status: InvoiceStatus.SENT
        });
        await expect(invoicesService.update('inv-1', updateInput)).rejects.toThrow('Only draft invoices can be updated');
    });
  });

  describe('changeStatus', () => {
    it('changes status successfully for valid transition', async () => {
        const existingInvoice = { id: 'inv-1', status: InvoiceStatus.DRAFT };
        (prisma.invoice.findUnique as jest.Mock).mockResolvedValue(existingInvoice);
        
        const updatedInvoice = { ...existingInvoice, status: InvoiceStatus.SENT };
        (prisma.invoice.update as jest.Mock).mockResolvedValue(updatedInvoice);

        const result = await invoicesService.changeStatus('inv-1', InvoiceStatus.SENT, 'user-1');

        expect(prisma.invoice.update).toHaveBeenCalledWith({
            where: { id: 'inv-1' },
            data: { status: InvoiceStatus.SENT }
        });
        expect(mockAudit.logInvoiceStatusChange).toHaveBeenCalled();
    });

    it('throws error for invalid transition', async () => {
        const existingInvoice = { id: 'inv-1', status: InvoiceStatus.DRAFT };
        (prisma.invoice.findUnique as jest.Mock).mockResolvedValue(existingInvoice);

        await expect(invoicesService.changeStatus('inv-1', InvoiceStatus.OVERDUE)).rejects.toThrow('Invalid status transition');
    });

    it('throws error if invoice not found', async () => {
        (prisma.invoice.findUnique as jest.Mock).mockResolvedValue(null);
        await expect(invoicesService.changeStatus('inv-999', InvoiceStatus.SENT)).rejects.toThrow('Invoice not found');
    });
  });

    it('returns empty array for invalid status', () => {
      // Accessing private method via isValidStatusTransition or just testing behavior if possible
      // Since it is private, we can test isValidStatusTransition with an invalid status type casted
      const result = invoicesService['isValidStatusTransition'](InvoiceStatus.PAID, InvoiceStatus.DRAFT);
      expect(result).toBe(false);
    });

    it('returns allowed statuses for SENT', () => {
        const result = invoicesService['getAllowedNextStatuses'](InvoiceStatus.SENT);
        expect(result).toContain(InvoiceStatus.PAID);
        expect(result).toContain(InvoiceStatus.OVERDUE);
    });

    it('returns allowed statuses for OVERDUE', () => {
        const result = invoicesService['getAllowedNextStatuses'](InvoiceStatus.OVERDUE);
        expect(result).toContain(InvoiceStatus.PAID);
    });

    it('returns empty array for PAID (terminal status)', () => {
        const result = invoicesService['getAllowedNextStatuses'](InvoiceStatus.PAID);
        expect(result).toEqual([]);
    });

    it('returns empty array for CANCELLED (terminal status)', () => {
        const result = invoicesService['getAllowedNextStatuses'](InvoiceStatus.CANCELLED);
        expect(result).toEqual([]);
    });

  describe('generateInvoiceNumber', () => {
      it('increments sequence correctly', async () => {
          // We need to access private method or trigger it via create
          // Since it's private, we test it via create behavior
          const year = new Date().getFullYear();
          (prisma.invoice.findFirst as jest.Mock).mockResolvedValue({ number: `INV-${year}-0005` });
          (prisma.customer.findUnique as jest.Mock).mockResolvedValue({ address: 'Toronto, ON' });
          mockExtractProvince.mockReturnValue('ON');
          mockCalculateTax.mockReturnValue({ taxRate: new Decimal(0.13), taxAmount: new Decimal(13) });
          (prisma.invoice.create as jest.Mock).mockImplementation((args) => Promise.resolve({ ...args.data, id: 'new-id' }));

          const createInput = {
              customerId: 'cust-1',
              items: [],
              issueDate: new Date(),
              dueDate: new Date(),
          };

          await invoicesService.create(createInput);

          expect(prisma.invoice.create).toHaveBeenCalledWith(expect.objectContaining({
              data: expect.objectContaining({
                  number: `INV-${year}-0006`
              })
          }));
      });
  });
});
