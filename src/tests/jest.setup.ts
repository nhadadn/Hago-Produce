
import dotenv from 'dotenv';
import path from 'path';

// Load .env.test explicitly
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

import '@testing-library/jest-dom';

// === MOCK: LoggerService ===
const mockLogger = {
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

jest.mock('@/lib/logger/logger.service', () => ({
  __esModule: true,
  LoggerService: {
    getInstance: jest.fn().mockReturnValue(mockLogger),
  },
  logger: mockLogger,
}));

jest.mock('@/lib/infrastructure/logger.service', () => ({
  __esModule: true,
  LoggerService: {
    getInstance: jest.fn().mockReturnValue(mockLogger),
  },
  logger: mockLogger,
}));

// === MOCK: OpenAI Client ===
// No mockeamos formatResponse globalmente porque su firma es string, y el mock anterior devolvía objeto.
// Dejamos que use la implementación real que llamará al fetch mockeado o fallback.
jest.mock('@/lib/services/chat/openai-client', () => {
  const original = jest.requireActual('@/lib/services/chat/openai-client');
  return {
    ...original,
    classifyChatIntentWithOpenAI: jest.fn().mockResolvedValue({
      intent: 'price_lookup',
      confidence: 0.9,
      params: { searchTerm: 'mock' },
    }),
  };
});


// === MOCK: Twilio ===
jest.mock('twilio', () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({
    messages: {
      create: jest.fn().mockResolvedValue({ sid: 'SM_mock_sid', status: 'sent' }),
    },
  }),
}));

// === MOCK: Telegram Bot API ===
jest.mock('node-telegram-bot-api', () => {
  return jest.fn().mockImplementation(() => ({
    sendMessage: jest.fn().mockResolvedValue({ message_id: 1 }),
    sendDocument: jest.fn().mockResolvedValue({ message_id: 2 }),
  }));
});

// === MOCK: Prisma (para tests unitarios) ===
const mockPrismaModel = () => ({
  findMany: jest.fn().mockResolvedValue([]),
  findUnique: jest.fn().mockResolvedValue(null),
  findFirst: jest.fn().mockResolvedValue(null),
  create: jest.fn().mockImplementation((args) => Promise.resolve({ ...args.data, id: 'mock-id' })),
  createMany: jest.fn().mockResolvedValue({ count: 1 }),
  update: jest.fn().mockImplementation((args) => Promise.resolve({ ...args.data, id: 'mock-id' })),
  delete: jest.fn().mockResolvedValue({ id: 'mock-id' }),
  deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
  updateMany: jest.fn().mockResolvedValue({ count: 0 }),
  upsert: jest.fn().mockResolvedValue({ id: 'mock-id' }),
  count: jest.fn().mockResolvedValue(0),
  groupBy: jest.fn().mockResolvedValue([]),
  aggregate: jest.fn().mockResolvedValue({ 
    _count: 0,
    _sum: { total: 0 },
    _avg: { total: 0 }
  }),
});

jest.mock('@/lib/db', () => {
  return {
    __esModule: true,
    default: {
      invoice: mockPrismaModel(),
      customer: mockPrismaModel(),
      product: mockPrismaModel(),
      productPrice: mockPrismaModel(),
      chatSession: mockPrismaModel(),
      message: mockPrismaModel(),
      auditLog: mockPrismaModel(),
      notification: mockPrismaModel(),
      notificationLog: mockPrismaModel(),
      webhookLog: mockPrismaModel(),
      botApiKey: mockPrismaModel(),
      botDecision: mockPrismaModel(),
      preInvoice: mockPrismaModel(),
      preInvoiceItem: mockPrismaModel(),
      supplier: mockPrismaModel(),
      user: mockPrismaModel(),
      reportCache: {
        ...mockPrismaModel(),
        create: jest.fn().mockImplementation((args) => {
          const uniqueId = `mock-id-${Math.random().toString(36).substr(2, 9)}`;
          const expiresAt = new Date();
          expiresAt.setMinutes(expiresAt.getMinutes() + 30);
          return Promise.resolve({ ...args.data, id: uniqueId, expiresAt });
        }),
      },
      purchaseOrder: mockPrismaModel(),
      purchaseOrderItem: mockPrismaModel(),
      invoiceItem: mockPrismaModel(),
      $transaction: jest.fn().mockImplementation((callback) => callback(require('@/lib/db').default)),
      $connect: jest.fn(),
      $disconnect: jest.fn(),
    },
  };
});

// === MOCK: fetch global ===
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: jest.fn().mockResolvedValue({}),
  text: jest.fn().mockResolvedValue(''),
  status: 200,
});

// === ENV VARS para tests ===
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.TWILIO_ACCOUNT_SID = 'test-twilio-sid';
process.env.TWILIO_AUTH_TOKEN = 'test-twilio-token';
process.env.TELEGRAM_BOT_TOKEN = 'test-telegram-token';
process.env.JWT_SECRET = 'test-jwt-secret-32-chars-minimum!!';
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
}
