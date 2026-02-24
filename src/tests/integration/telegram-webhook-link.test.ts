import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { POST } from '@/app/api/v1/bot/webhook/telegram/route';

jest.mock('@/lib/db', () => ({
  message: {
    create: jest.fn(),
    update: jest.fn(),
  },
  customer: {
    update: jest.fn(),
  },
}));

jest.mock('@/lib/services/bot/telegram.service', () => ({
  telegramService: {
    validateWebhookToken: jest.fn().mockReturnValue(true),
    parseWebhookUpdate: jest.fn().mockImplementation((update: any) => ({
      chatId: update.message.chat.id,
      fromId: update.message.from.id,
      messageId: update.message.message_id,
      text: update.message.text,
    })),
    sendMessage: jest.fn().mockResolvedValue(undefined),
    getBotInfo: jest.fn(),
  },
}));

describe('Telegram webhook /start linking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('links customer chat id on /start <customerId>', async () => {
    const update = {
      message: {
        chat: { id: 12345 },
        from: { id: 12345 },
        message_id: 1,
        text: '/start cust-1',
      },
    };

    const req = new NextRequest('http://localhost/api/v1/bot/webhook/telegram', {
      method: 'POST',
      body: JSON.stringify(update),
    } as any);

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(prisma.customer.update).toHaveBeenCalledWith({
      where: { id: 'cust-1' },
      data: { telegramChatId: '12345' },
    });
  });
});
