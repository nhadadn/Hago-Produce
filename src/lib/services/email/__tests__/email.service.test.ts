import { jest } from '@jest/globals';

jest.mock('@sendgrid/mail', () => {
  const send = jest.fn();
  const setApiKey = jest.fn();
  return {
    __esModule: true,
    default: {
      send,
      setApiKey,
      __send: send,
      __setApiKey: setApiKey,
    },
  };
});

jest.mock('resend', () => {
  const send = jest.fn();
  const ResendMock = jest.fn().mockImplementation(() => ({
    emails: { send },
  }));
  return { Resend: ResendMock, __send: send };
});

describe('EmailService', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      EMAIL_PROVIDER: 'resend',
      RESEND_API_KEY: 'test-resend-key',
      EMAIL_FROM: 'Hago Produce <no-reply@test.com>',
      NODE_ENV: 'test',
    } as any;
  });

  afterAll(() => {
    process.env = originalEnv as any;
  });

  it('envía un email exitoso con Resend', async () => {
    const { Resend, __send } = await import('resend' as any);
    (__send as jest.Mock).mockResolvedValue({ data: { id: 'resend-id-123' }, error: null });

    const { sendEmail } = await import('@/lib/services/email.service');

    const result = await sendEmail('test@example.com', 'Asunto de prueba', '<p>Hola</p>');

    expect(result.success).toBe(true);
    expect(result.messageId).toBe('resend-id-123');
    expect(result.attempts).toBe(1);
    expect((Resend as jest.Mock).mock.calls[0][0]).toBe('test-resend-key');
    expect((__send as jest.Mock).mock.calls[0][0]).toMatchObject({
      to: 'test@example.com',
      subject: 'Asunto de prueba',
    });
  });

  it('realiza reintentos cuando el envío falla y finalmente tiene éxito', async () => {
    const { __send } = await import('resend' as any);
    (__send as jest.Mock)
      .mockRejectedValueOnce(new Error('Fallo 1'))
      .mockRejectedValueOnce(new Error('Fallo 2'))
      .mockResolvedValueOnce({ data: { id: 'resend-id-final' }, error: null });

    const { sendEmail } = await import('@/lib/services/email.service');

    const result = await sendEmail('retry@example.com', 'Reintentos', '<p>Contenido</p>');

    expect(result.success).toBe(true);
    expect(result.messageId).toBe('resend-id-final');
    expect(result.attempts).toBe(3);
    expect((__send as jest.Mock)).toHaveBeenCalledTimes(3);
  });

  it('retorna error después de agotar los reintentos', async () => {
    const { __send } = await import('resend' as any);
    (__send as jest.Mock).mockRejectedValue(new Error('Error permanente'));

    const { sendEmail } = await import('@/lib/services/email.service');

    const result = await sendEmail('fail@example.com', 'Falla', '<p>Contenido</p>');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Error permanente');
    expect(result.attempts).toBe(3);
    expect((__send as jest.Mock)).toHaveBeenCalledTimes(3);
  });

  it('usa templates HTML para factura', async () => {
    const { __send } = await import('resend' as any);
    (__send as jest.Mock).mockResolvedValue({ data: { id: 'invoice-id' }, error: null });

    const { sendInvoiceEmail } = await import('@/lib/services/email.service');

    const buffer = Buffer.from('PDF');
    const result = await sendInvoiceEmail('cliente@example.com', 'F-123', buffer, 'Cliente Demo');

    expect(result.success).toBe(true);

    const args = (__send as jest.Mock).mock.calls[0][0];
    expect(args.html).toContain('Factura F-123');
    expect(args.html).toContain('Cliente Demo');
    expect(Array.isArray(args.attachments)).toBe(true);
    expect(args.attachments[0].filename).toBe('Factura-F-123.pdf');
  });

  it('usa templates HTML para orden de compra', async () => {
    const { __send } = await import('resend' as any);
    (__send as jest.Mock).mockResolvedValue({ data: { id: 'po-id' }, error: null });

    const { sendPurchaseOrderEmail } = await import('@/lib/services/email.service');

    const buffer = Buffer.from('PDF');
    const result = await sendPurchaseOrderEmail('proveedor@example.com', 'OC-999', buffer, 'Proveedor Demo');

    expect(result.success).toBe(true);

    const args = (__send as jest.Mock).mock.calls[0][0];
    expect(args.html).toContain('Orden de compra OC-999');
    expect(args.html).toContain('Proveedor Demo');
    expect(args.attachments[0].filename).toBe('Orden-OC-999.pdf');
  });

  it('usa templates HTML para notificación', async () => {
    const { __send } = await import('resend' as any);
    (__send as jest.Mock).mockResolvedValue({ data: { id: 'notif-id' }, error: null });

    const { sendNotificationEmail } = await import('@/lib/services/email.service');

    const result = await sendNotificationEmail('user@example.com', 'Aviso importante', 'Mensaje de prueba');

    expect(result.success).toBe(true);

    const args = (__send as jest.Mock).mock.calls[0][0];
    expect(args.html).toContain('Aviso importante');
    expect(args.html).toContain('Mensaje de prueba');
  });

  it('integra con SendGrid cuando EMAIL_PROVIDER=sendgrid', async () => {
    process.env.EMAIL_PROVIDER = 'sendgrid';
    process.env.SENDGRID_API_KEY = 'test-sendgrid-key';

    const sgModule = await import('@sendgrid/mail');
    const { default: sg } = sgModule as any;
    (sg.__send as jest.Mock).mockResolvedValue([{ headers: { 'x-message-id': 'sg-id-123' } }]);

    const { sendEmail } = await import('@/lib/services/email.service');

    const result = await sendEmail('sg@example.com', 'SG Asunto', '<p>Hola SG</p>');

    expect(result.success).toBe(true);
    expect(result.messageId).toBe('sg-id-123');
    expect(sg.__setApiKey).toHaveBeenCalledWith('test-sendgrid-key');
    expect(sg.__send).toHaveBeenCalledTimes(1);
  });
});

