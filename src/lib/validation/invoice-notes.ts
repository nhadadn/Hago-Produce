import { z } from 'zod';

export const invoiceNoteCreateSchema = z.object({
  content: z.string().min(1, 'El contenido de la nota es obligatorio'),
});

export type InvoiceNoteCreateInput = z.infer<typeof invoiceNoteCreateSchema>;

