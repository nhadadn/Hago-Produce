import { InvoiceNotesService } from '../notes';
import prisma from '@/lib/db';

// Mock Prisma
jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    invoiceNote: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    invoice: {
      findUnique: jest.fn(),
    },
  },
}));

describe('InvoiceNotesService', () => {
  let service: InvoiceNotesService;

  beforeEach(() => {
    service = new InvoiceNotesService();
    jest.clearAllMocks();
  });

  describe('listByInvoice', () => {
    it('should return notes for valid invoiceId', async () => {
      const mockNotes = [
        {
          id: 'note-1',
          content: 'Test note 1',
          createdAt: new Date(),
          user: {
            id: 'user-1',
            firstName: 'John',
            lastName: 'Doe',
          },
        },
      ];

      (prisma.invoiceNote.findMany as jest.Mock).mockResolvedValue(mockNotes);

      const result = await service.listByInvoice('invoice-123');

      expect(prisma.invoiceNote.findMany).toHaveBeenCalledWith({
        where: { invoiceId: 'invoice-123' },
        orderBy: { createdAt: 'asc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
      expect(result).toEqual(mockNotes);
    });

    it('should return empty array if no notes found', async () => {
      (prisma.invoiceNote.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.listByInvoice('invoice-123');

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create a note if invoice exists', async () => {
      const invoiceId = 'invoice-123';
      const userId = 'user-1';
      const data = { content: 'New note content' };

      const mockInvoice = { id: invoiceId };
      const mockCreatedNote = {
        id: 'note-new',
        content: data.content,
        createdAt: new Date(),
        user: {
          id: userId,
          firstName: 'Jane',
          lastName: 'Doe',
        },
      };

      (prisma.invoice.findUnique as jest.Mock).mockResolvedValue(mockInvoice);
      (prisma.invoiceNote.create as jest.Mock).mockResolvedValue(mockCreatedNote);

      const result = await service.create(invoiceId, userId, data);

      expect(prisma.invoice.findUnique).toHaveBeenCalledWith({
        where: { id: invoiceId },
        select: { id: true },
      });

      expect(prisma.invoiceNote.create).toHaveBeenCalledWith({
        data: {
          invoiceId,
          userId,
          content: data.content,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      expect(result).toEqual(mockCreatedNote);
    });

    it('should throw error if invoice not found', async () => {
      const invoiceId = 'invoice-invalid';
      const userId = 'user-1';
      const data = { content: 'Note content' };

      (prisma.invoice.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.create(invoiceId, userId, data)).rejects.toThrow('Invoice not found');

      expect(prisma.invoiceNote.create).not.toHaveBeenCalled();
    });
  });
});
