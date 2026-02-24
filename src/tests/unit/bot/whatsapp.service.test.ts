import prisma from '@/lib/db';
import { WhatsAppService } from '@/lib/services/bot/whatsapp.service';

jest.mock('twilio', () => {
  const messages = {
    create: jest.fn().mockResolvedValue({ sid: 'SM123' }),
  };

  const client = jest.fn(() => ({ messages }));

  (client as any).validateRequest = jest.fn().mockReturnValue(true);

  return client;
});

describe('WhatsAppService', () => {
  const service = new WhatsAppService();

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.TWILIO_ACCOUNT_SID = 'AC_TEST';
    process.env.TWILIO_AUTH_TOKEN = 'token';
    process.env.TWILIO_WHATSAPP_NUMBER = '+15550001111';
  });

  it('formats WhatsApp numbers with country code', () => {
    const formatted = service.formatWhatsAppNumber('555 123 4567');
    expect(formatted).toBe('+15551234567');

    const alreadyFormatted = service.formatWhatsAppNumber('+15551234567');
    expect(alreadyFormatted).toBe('+15551234567');
  });

  it('throws error for invalid short numbers', () => {
    expect(() => service.formatWhatsAppNumber('12345')).toThrow();
  });

  it('parses webhook body into structured fields', () => {
    const body = 'From=whatsapp:%2B15551234567&To=whatsapp:%2B19998887777&Body=Hola&MessageSid=SM123&NumMedia=1';

    const parsed = service.parseWebhookBody(body);

    expect(parsed.from).toBe('+15551234567');
    expect(parsed.to).toBe('+19998887777');
    expect(parsed.message).toBe('Hola');
    expect(parsed.messageSid).toBe('SM123');
    expect(parsed.numMedia).toBe(1);
  });

  it('validates webhook signature using twilio helper', () => {
    const result = service.validateWebhookSignature('sig', 'http://example.com', 'Body', 'secret');
    expect(result).toBe(true);
  });

  it('logs message to database', async () => {
    const createSpy = jest.spyOn((prisma as any).message, 'create').mockResolvedValueOnce({ id: 'msg-1' });

    await service.logMessage('user-1', 'Hola', 'Respuesta', 'intent', 0.9, 'processed');

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          platform: 'whatsapp',
          platformUserId: 'user-1',
          message: 'Hola',
          response: 'Respuesta',
          intent: 'intent',
          confidence: 0.9,
          status: 'processed',
        }),
      }),
    );
  });

  it('updates message status in database', async () => {
    const updateSpy = jest.spyOn((prisma as any).message, 'update').mockResolvedValueOnce({ id: 'msg-1' });

    await service.updateMessageStatus('msg-1', 'failed', 'error');

    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'msg-1' },
        data: expect.objectContaining({
          status: 'failed',
          errorMessage: 'error',
        }),
      }),
    );
  });
});
