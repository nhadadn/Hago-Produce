import { invoiceNotesService } from '@/lib/services/invoices/notes';
import prisma from '@/lib/db';

// Mock prisma
jest.mock('@/lib/db', () => ({
  invoiceNote: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  invoice: {
    findUnique: jest.fn(),
  },
}));

describe('InvoiceNotesService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listByInvoice', () => {
    it('should return notes for an invoice', async () => {
      const mockNotes = [
        { id: 'note-1', content: 'Test note', createdAt: new Date(), user: { id: 'u1', firstName: 'John', lastName: 'Doe' } }
      ];
      (prisma.invoiceNote.findMany as jest.Mock).mockResolvedValue(mockNotes);

      const result = await invoiceNotesService.listByInvoice('inv-1');
      expect(result).toEqual(mockNotes);
      expect(prisma.invoiceNote.findMany).toHaveBeenCalledWith({
        where: { invoiceId: 'inv-1' },
        orderBy: { createdAt: 'asc' },
        include: expect.any(Object),
      });
    });
  });

  describe('create', () => {
    it('should create a note if invoice exists', async () => {
      (prisma.invoice.findUnique as jest.Mock).mockResolvedValue({ id: 'inv-1' });
      const mockNote = { id: 'note-1', content: 'New note', createdAt: new Date(), user: { id: 'u1', firstName: 'John', lastName: 'Doe' } };
      (prisma.invoiceNote.create as jest.Mock).mockResolvedValue(mockNote);

      const result = await invoiceNotesService.create('inv-1', 'u1', { content: 'New note' });
      expect(result).toEqual(mockNote);
      expect(prisma.invoiceNote.create).toHaveBeenCalledWith({
        data: { invoiceId: 'inv-1', userId: 'u1', content: 'New note' },
        include: expect.any(Object),
      });
    });

    it('should throw error if invoice does not exist', async () => {
      (prisma.invoice.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(invoiceNotesService.create('inv-1', 'u1', { content: 'New note' }))
        .rejects.toThrow('Invoice not found');
    });
  });
});
