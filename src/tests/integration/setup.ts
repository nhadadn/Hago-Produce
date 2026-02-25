import '@testing-library/jest-dom';
import { resetDb } from './utils/db';

// Clean DB before each test suite
beforeAll(async () => {
  await resetDb();
});

// Clean DB after each test suite
afterAll(async () => {
  await resetDb();
});

// === MOCK: OpenAI Client ===
jest.mock('@/lib/services/chat/openai-client', () => {
  const original = jest.requireActual('@/lib/services/chat/openai-client');
  return {
    ...original,
    // We mock classification to control flow, but we COULD test real API if we had keys.
    // For integration tests focused on DB, mocking OpenAI is safer/cheaper.
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
    validateRequest: jest.fn().mockReturnValue(true),
  }),
}));

// === MOCK: Telegram Bot API ===
jest.mock('node-telegram-bot-api', () => {
  return jest.fn().mockImplementation(() => ({
    sendMessage: jest.fn().mockResolvedValue({ message_id: 1 }),
    sendDocument: jest.fn().mockResolvedValue({ message_id: 2 }),
    on: jest.fn(),
    startPolling: jest.fn(),
    stopPolling: jest.fn(),
  }));
});

// === MOCK: fetch global (for other external calls) ===
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: jest.fn().mockResolvedValue({}),
  text: jest.fn().mockResolvedValue(''),
  status: 200,
});
