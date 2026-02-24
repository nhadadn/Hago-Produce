import { jest } from '@jest/globals';

jest.mock('@/lib/db', () => {
  const customers: any[] = [];

  return {
    __esModule: true,
    default: {
      customer: {
        update: jest.fn(async ({ where, data }: any) => {
          let customer = customers.find((c) => c.id === where.id);
          if (!customer) {
            customer = { id: where.id };
            customers.push(customer);
          }
          Object.assign(customer, data);
          return customer;
        }),
        findUnique: jest.fn(async ({ where }: any) => {
          return customers.find((c) => c.id === where.id) ?? null;
        }),
      },
      __customers: customers,
    },
  };
});

describe('TelegramService', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      TELEGRAM_BOT_TOKEN: 'test-token',
      NODE_ENV: 'test',
    } as any;
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, result: { message_id: 123 } }),
      status: 200,
    });
  });

  afterAll(() => {
    process.env = originalEnv as any;
  });

  it('envía un mensaje exitoso', async () => {
    const { sendMessage } = await import('@/lib/services/telegram.service');

    const result = await sendMessage('12345', 'Hola desde tests');

    expect(result.success).toBe(true);
    expect(result.messageId).toBe('123');
    expect(result.attempts).toBe(1);

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.telegram.org/bottest-token/sendMessage'.replace('bottest-token', 'bottest-token'),
      expect.objectContaining({
        method: 'POST',
      }),
    );
  });

  it('envía un documento exitosamente', async () => {
    const { sendDocument } = await import('@/lib/services/telegram.service');

    const buffer = Buffer.from('PDF');
    const result = await sendDocument('12345', buffer, 'test.pdf', 'Factura de prueba');

    expect(result.success).toBe(true);
    expect(result.messageId).toBe('123');
    expect(result.attempts).toBe(1);
    expect(global.fetch).toHaveBeenCalled();
  });

  it('realiza reintentos y finalmente retorna error', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ ok: false }),
    });

    const { sendMessage } = await import('@/lib/services/telegram.service');

    const result = await sendMessage('12345', 'Mensaje fallido');

    expect(result.success).toBe(false);
    expect(result.attempts).toBe(3);
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it('retorna error si el token no está configurado', async () => {
    delete (process.env as any).TELEGRAM_BOT_TOKEN;
    const { sendMessage } = await import('@/lib/services/telegram.service');

    const result = await sendMessage('12345', 'Sin token');

    expect(result.success).toBe(false);
    expect(result.attempts).toBe(0);
    expect(result.error).toMatch(/TELEGRAM_BOT_TOKEN/);
  });

  it('vincula y obtiene telegramChatId de un cliente', async () => {
    const prismaMock = (await import('@/lib/db')).default as any;
    const { linkTelegramChat, getCustomerChatId } = await import('@/lib/services/telegram.service');

    await linkTelegramChat('cust-1', 'chat-123');

    expect(prismaMock.customer.update).toHaveBeenCalledWith({
      where: { id: 'cust-1' },
      data: { telegramChatId: 'chat-123' },
    });

    const chatId = await getCustomerChatId('cust-1');
    expect(chatId).toBe('chat-123');
  });
});
