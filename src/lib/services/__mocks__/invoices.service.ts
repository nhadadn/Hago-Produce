import { jest } from '@jest/globals';

export const InvoicesService = jest.fn().mockImplementation(() => ({
  create: jest.fn().mockResolvedValue({
    id: 'inv-1',
    number: 'INV-2024-0001',
    total: 56.5,
    createdAt: new Date(),
    items: [],
    subtotal: 50,
    taxAmount: 6.5
  }),
  findFirst: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findById: jest.fn(),
}));
