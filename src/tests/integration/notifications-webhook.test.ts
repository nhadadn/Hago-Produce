import { NextRequest } from 'next/server';
import { POST } from '@/app/webhooks/notifications/send/route';
import { sendWhatsAppMessage } from '@/lib/services/notifications/twilio';
import { sendTelegramMessage } from '@/lib/services/notifications/telegram';

jest.mock('@/lib/services/notifications/twilio', () => ({
  sendWhatsAppMessage: jest.fn(),
}));

jest.mock('@/lib/services/notifications/telegram', () => ({
  sendTelegramMessage: jest.fn(),
}));

describe('Webhook notifications send endpoint', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, NOTIFICATIONS_WEBHOOK_SECRET: 'secret-key' };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('sends WhatsApp message and is idempotent', async () => {
    (sendWhatsAppMessage as jest.Mock).mockResolvedValue(undefined);

    const body = {
      channel: 'whatsapp',
      text: 'Hola',
      toWhatsApp: 'whatsapp:+5215555550000',
    };

    const req1 = new NextRequest('http://localhost/webhooks/notifications/send', {
      method: 'POST',
      headers: {
        'x-api-key': 'secret-key',
        'Idempotency-Key': 'idem-1',
      } as any,
      body: JSON.stringify(body),
    });

    const res1 = await POST(req1);
    const json1 = await res1.json();

    expect(res1.status).toBe(200);
    expect(json1.success).toBe(true);
    expect(sendWhatsAppMessage).toHaveBeenCalledTimes(1);

    const req2 = new NextRequest('http://localhost/webhooks/notifications/send', {
      method: 'POST',
      headers: {
        'x-api-key': 'secret-key',
        'Idempotency-Key': 'idem-1',
      } as any,
      body: JSON.stringify(body),
    });

    const res2 = await POST(req2);
    const json2 = await res2.json();

    expect(res2.status).toBe(200);
    expect(json2).toEqual(json1);
    expect(sendWhatsAppMessage).toHaveBeenCalledTimes(1);
  });

  it('retries on WhatsApp failure', async () => {
    (sendWhatsAppMessage as jest.Mock)
      .mockRejectedValueOnce(new Error('Temporary error'))
      .mockRejectedValueOnce(new Error('Temporary error'))
      .mockResolvedValueOnce(undefined);

    const body = {
      channel: 'whatsapp',
      text: 'Hola',
      toWhatsApp: 'whatsapp:+5215555550000',
    };

    const req = new NextRequest('http://localhost/webhooks/notifications/send', {
      method: 'POST',
      headers: {
        'x-api-key': 'secret-key',
      } as any,
      body: JSON.stringify(body),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(sendWhatsAppMessage).toHaveBeenCalledTimes(3);
  });

  it('sends Telegram message', async () => {
    (sendTelegramMessage as jest.Mock).mockResolvedValue(undefined);

    const body = {
      channel: 'telegram',
      text: 'Hola',
      telegramChatId: '12345',
    };

    const req = new NextRequest('http://localhost/webhooks/notifications/send', {
      method: 'POST',
      headers: {
        'x-api-key': 'secret-key',
      } as any,
      body: JSON.stringify(body),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(sendTelegramMessage).toHaveBeenCalledTimes(1);
  });
});

