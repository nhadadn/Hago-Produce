jest.mock('twilio', () => {
  const messagesCreate = jest.fn();
  const twilioFn = () => ({ messages: { create: messagesCreate } });
  (twilioFn as any).validateRequest = (authToken: string, signature: string) => signature === 'valid';
  (twilioFn as any).__messagesCreate = messagesCreate;
  return twilioFn;
});

const getMessagesCreate = () => (require('twilio') as any).__messagesCreate as jest.Mock;

describe('WhatsAppService', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, TWILIO_ACCOUNT_SID: 'AC123', TWILIO_AUTH_TOKEN: 'token', TWILIO_WHATSAPP_NUMBER: '+14150000000' } as any;
  });

  afterAll(() => {
    process.env = originalEnv as any;
  });

  it('formatWhatsAppNumber: 10 digits → +1XXXXXXXXXX', async () => {
    const { WhatsAppService } = await import('@/lib/services/bot/whatsapp.service');
    const svc = new WhatsAppService();
    expect(svc.formatWhatsAppNumber('5555555555')).toBe('+15555555555');
  });

  it('formatWhatsAppNumber: starts with +1 → unchanged', async () => {
    const { WhatsAppService } = await import('@/lib/services/bot/whatsapp.service');
    const svc = new WhatsAppService();
    expect(svc.formatWhatsAppNumber('+15555555555')).toBe('+15555555555');
  });

  it('validateWebhookSignature: valid returns true', async () => {
    const { whatsAppService } = await import('@/lib/services/bot/whatsapp.service');
    // Mock implementation of validateRequest expects signature === 'valid'
    expect((whatsAppService.validateWebhookSignature as any)({} as any, 'http://x', 'body', 'valid')).toBe(true);
  });

  it('validateWebhookSignature: invalid returns false', async () => {
    const { whatsAppService } = await import('@/lib/services/bot/whatsapp.service');
    expect((whatsAppService.validateWebhookSignature as any)({} as any, 'http://x', 'body', 'token')).toBe(false);
  });

  it('sendMessage: returns SID on success', async () => {
    const { whatsAppService } = await import('@/lib/services/bot/whatsapp.service');
    const create = getMessagesCreate();
    create.mockResolvedValueOnce({ sid: 'SM123' });

    const sid = await whatsAppService.sendMessage('5555555555', 'Hola');
    expect(sid).toBe('SM123');
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      from: 'whatsapp:+14150000000',
      to: 'whatsapp:+15555555555',
    }));
  });

  it('sendMessage: throws on Twilio error', async () => {
    const { whatsAppService } = await import('@/lib/services/bot/whatsapp.service');
    const create = getMessagesCreate();
    create.mockRejectedValueOnce(new Error('Twilio error'));
    await expect(whatsAppService.sendMessage('5555555555', 'Hola')).rejects.toThrow('Error al enviar mensaje de WhatsApp');
  });
});

