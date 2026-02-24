import { jest } from '@jest/globals';

const prisma = {
  customer: {
    findUnique: jest.fn(),
  },
  invoice: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  notificationLog: {
    create: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
  },
  $transaction: jest.fn((callback) => {
    // If callback is a function, execute it with a mocked transaction client
    if (typeof callback === 'function') {
      return callback({
        invoice: {
          create: jest.fn(),
        },
      });
    }
    return Promise.resolve([]);
  }),
};

export default prisma;
