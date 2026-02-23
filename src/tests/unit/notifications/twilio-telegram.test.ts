import { sendWhatsAppMessage } from '@/lib/services/notifications/twilio';
import { sendTelegramMessage } from '@/lib/services/notifications/telegram';

describe('Twilio and Telegram notification services', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.resetAllMocks();
    process.env = { ...originalEnv };
    (global as any).fetch = jest.fn().mockResolvedValue({ ok: true });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('does nothing if Twilio config is missing', async () => {
    process.env.TWILIO_ACCOUNT_SID = '';
    process.env.TWILIO_AUTH_TOKEN = '';
    process.env.TWILIO_WHATSAPP_FROM = '';

    await sendWhatsAppMessage('whatsapp:+5215555555555', 'Test');

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('calls Twilio API when config is present', async () => {
    process.env.TWILIO_ACCOUNT_SID = 'AC123';
    process.env.TWILIO_AUTH_TOKEN = 'token';
    process.env.TWILIO_WHATSAPP_FROM = 'whatsapp:+5215555555555';

    await sendWhatsAppMessage('whatsapp:+5215555550000', 'Hello');

    expect(global.fetch).toHaveBeenCalled();
  });

  it('does nothing if Telegram token is missing', async () => {
    process.env.TELEGRAM_BOT_TOKEN = '';

    await sendTelegramMessage('12345', 'Hello');

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('calls Telegram API when token is present', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'bot:token';

    await sendTelegramMessage('12345', 'Hello');

    expect(global.fetch).toHaveBeenCalled();
  });
});

