
import { POST } from '../route';
import { NextRequest } from 'next/server';
import { whatsAppService } from '@/lib/services/bot/whatsapp.service';
import { findUserByWhatsAppNumber } from '@/lib/services/bot/utils/user-lookup';
import { processChatRequest } from '@/lib/services/chat/chat-processor';

// Mock dependencies
jest.mock('@/lib/services/bot/whatsapp.service', () => ({
  whatsAppService: {
    validateWebhookSignature: jest.fn(),
    sendMessage: jest.fn(),
  },
}));
jest.mock('@/lib/services/bot/utils/user-lookup');
jest.mock('@/lib/services/chat/chat-processor');
jest.mock('@/lib/db', () => ({
  message: {
    create: jest.fn().mockResolvedValue({ id: 'msg-1' }),
    update: jest.fn(),
  },
}));
jest.mock('@/lib/logger/logger.service', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('WhatsApp Webhook Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.TWILIO_AUTH_TOKEN = 'test-token';
  });

  it('processes a regular message using the unified pipeline', async () => {
    // 1. Setup Mock Data
    const body = new URLSearchParams({
      From: 'whatsapp:+15551234567',
      Body: 'price of apple',
      MessageSid: 'SM123',
    }).toString();

    const req = new NextRequest('http://localhost/api/v1/bot/webhook/whatsapp', {
      method: 'POST',
      body,
      headers: {
        'x-twilio-signature': 'test-signature',
      },
    });

    // 2. Mock Services
    (whatsAppService.validateWebhookSignature as jest.Mock).mockReturnValue(true);
    (findUserByWhatsAppNumber as jest.Mock).mockResolvedValue({
      userId: 'user-123',
      customerId: 'cust-123',
    });
    (processChatRequest as jest.Mock).mockResolvedValue({
      reply: '*🔍 Prices for apple*\n\n#1 *Apple Red* · $1.50',
      intent: 'price_lookup',
      confidence: 0.9,
    });

    // 3. Execute Webhook
    const res = await POST(req);

    // 4. Verify
    expect(res.status).toBe(200);
    expect(findUserByWhatsAppNumber).toHaveBeenCalledWith('+15551234567');
    expect(processChatRequest).toHaveBeenCalledWith({
      userId: 'user-123',
      sessionId: 'wa_+15551234567',
      message: 'price of apple',
      platform: 'whatsapp',
      context: { customerId: 'cust-123' }
    });
    expect(whatsAppService.sendMessage).toHaveBeenCalledWith(
      'whatsapp:+15551234567',
      '*🔍 Prices for apple*\n\n#1 *Apple Red* · $1.50'
    );
  });
});
