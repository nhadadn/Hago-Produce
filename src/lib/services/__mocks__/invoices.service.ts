import { jest } from '@jest/globals';

export const InvoicesService = jest.fn().mockImplementation(() => ({
  create: jest.fn<any>().mockResolvedValue({
    id: 'inv-1',
    number: 'INV-2024-001',
    total: 100,
    createdAt: new Date(),
    items: [],
    subtotal: 90,
    taxAmount: 10,
  }),
  update: jest.fn<any>().mockResolvedValue({
    id: 'inv-1',
    number: 'INV-2024-001',
    total: 100,
    createdAt: new Date(),
    items: [],
    subtotal: 90,
    taxAmount: 10,
  }),
  getById: jest.fn<any>().mockResolvedValue({
    id: 'inv-1',
    number: 'INV-2024-001',
    total: 100,
    createdAt: new Date(),
    items: [],
    subtotal: 90,
    taxAmount: 10,
    customer: { name: 'Cliente Test', email: 'test@example.com' },
  }),
  findFirst: jest.fn<any>(),
  delete: jest.fn<any>(),
  findById: jest.fn<any>(),
}));

export const invoicesService = new (InvoicesService as any)();
