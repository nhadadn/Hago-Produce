
import prisma from '@/lib/db';
import TelegramBot from 'node-telegram-bot-api';

// Mock dependencies
jest.mock('@/lib/logger/logger.service', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    message: {
      create: jest.fn(),
      update: jest.fn(),
    },
    customer: {
      count: jest.fn(),
    },
    invoice: {
      count: jest.fn(),
    },
    product: {
      count: jest.fn(),
    },
  },
}));

jest.mock('node-telegram-bot-api');

describe('TelegramService', () => {
  let TelegramService: any;
  let service: any;
  let prisma: any;
  let TelegramBotMock: any;
  let logger: any;

  const mockToken = 'test-token-123';
  const mockBotInstance = {
    sendMessage: jest.fn(),
    getMe: jest.fn(),
  };

  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = { ...originalEnv, TELEGRAM_BOT_TOKEN: mockToken };
    
    // Re-require dependencies to get fresh mocks after resetModules
    prisma = require('@/lib/db').default;
    TelegramBotMock = require('node-telegram-bot-api');
    logger = require('@/lib/logger/logger.service').logger;
    
    // Setup mock for TelegramBot constructor
    TelegramBotMock.mockImplementation(() => mockBotInstance);
    
    // Re-require service to pick up new env var and new mocks
    TelegramService = require('@/lib/services/bot/telegram.service').TelegramService;
    service = new TelegramService();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Constructor', () => {
    it('should initialize bot when token is provided', () => {
      // service is already initialized in beforeEach with token
      expect(TelegramBotMock).toHaveBeenCalledWith(mockToken, {
        webHook: true,
        onlyFirstMatch: true,
      });
    });

    it('should not initialize bot when token is missing', () => {
      jest.resetModules(); // Reset again for this specific test
      delete process.env.TELEGRAM_BOT_TOKEN;
      const { TelegramService: NoTokenService } = require('@/lib/services/bot/telegram.service');
      
      const noTokenService = new NoTokenService();
      
      // Check behavior that requires bot
      return expect(noTokenService.sendMessage(123, 'test'))
        .rejects.toThrow('Telegram bot no está configurado');
    });
  });

  describe('sendMessage', () => {
    it('should send message successfully', async () => {
      mockBotInstance.sendMessage.mockResolvedValue({ message_id: 999 });
      
      const msgId = await service.sendMessage(123, 'hello', { parseMode: 'Markdown' });
      
      expect(mockBotInstance.sendMessage).toHaveBeenCalledWith(123, 'hello', {
        parse_mode: 'Markdown',
        disable_notification: undefined,
      });
      expect(msgId).toBe(999);
    });

    it('should throw error when send fails', async () => {
      mockBotInstance.sendMessage.mockRejectedValue(new Error('API Error'));
      
      await expect(service.sendMessage(123, 'hello')).rejects.toThrow('Error al enviar mensaje de Telegram');
    });

    it('should throw error if bot is not initialized', async () => {
      jest.resetModules();
      delete process.env.TELEGRAM_BOT_TOKEN;
      const { TelegramService: NoTokenService } = require('@/lib/services/bot/telegram.service');
      const noTokenService = new NoTokenService();
      
      await expect(noTokenService.sendMessage(123, 'hello')).rejects.toThrow('Telegram bot no está configurado');
    });
  });

  describe('validateWebhookToken', () => {
    it('should return true for correct token', () => {
      expect(service.validateWebhookToken(mockToken)).toBe(true);
    });

    it('should return false for incorrect token', () => {
      expect(service.validateWebhookToken('wrong-token')).toBe(false);
    });

    it('should handle missing env token gracefully', () => {
      jest.resetModules();
      delete process.env.TELEGRAM_BOT_TOKEN;
      const { TelegramService: NoTokenService } = require('@/lib/services/bot/telegram.service');
      const noTokenService = new NoTokenService();
      expect(noTokenService.validateWebhookToken('any')).toBe(false);
    });
  });

  describe('parseWebhookUpdate', () => {
    it('should parse valid message update', () => {
      const update = {
        update_id: 100,
        message: {
          message_id: 200,
          text: 'hello world',
          chat: { id: 300 },
          from: {
            id: 400,
            first_name: 'John',
            last_name: 'Doe',
            username: 'johndoe'
          }
        }
      };

      const result = service.parseWebhookUpdate(update);

      expect(result).toEqual({
        updateId: 100,
        messageId: 200,
        chatId: 300,
        fromId: 400,
        text: 'hello world',
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe'
      });
    });

    it('should return null for invalid update structure', () => {
      expect(service.parseWebhookUpdate({})).toBeNull();
      expect(service.parseWebhookUpdate({ message: {} })).toBeNull();
      // @ts-ignore
      expect(service.parseWebhookUpdate(null)).toBeNull();
    });
  });

  describe('isCommand', () => {
    it('should detect simple command', () => {
      const result = service.isCommand('/start');
      expect(result).toEqual({ isCommand: true, command: 'start', args: undefined });
    });

    it('should detect command with args', () => {
      const result = service.isCommand('/search item 123');
      expect(result).toEqual({ isCommand: true, command: 'search', args: 'item 123' });
    });

    it('should return false for non-command text', () => {
      expect(service.isCommand('hello world')).toEqual({ isCommand: false });
      expect(service.isCommand('start')).toEqual({ isCommand: false });
    });
  });

  describe('logMessage', () => {
    it('should log message to database', async () => {
      (prisma.message.create as jest.Mock).mockResolvedValue({});
      
      await service.logMessage('user123', 'hello');
      
      expect(prisma.message.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          platform: 'telegram',
          platformUserId: 'user123',
          message: 'hello',
          status: 'received'
        })
      });
    });

    it('should handle database errors gracefully (no throw)', async () => {
      (prisma.message.create as jest.Mock).mockRejectedValue(new Error('DB Error'));
      
      await expect(service.logMessage('user123', 'hello')).resolves.not.toThrow();
      
      expect(logger.error).toHaveBeenCalledWith('[MESSAGE_LOG_ERROR]', expect.any(Error));
    });
  });

  describe('updateMessageStatus', () => {
    it('should update message status', async () => {
      (prisma.message.update as jest.Mock).mockResolvedValue({});
      
      await service.updateMessageStatus('msg123', 'processed');
      
      expect(prisma.message.update).toHaveBeenCalledWith({
        where: { id: 'msg123' },
        data: expect.objectContaining({
          status: 'processed',
          processedAt: expect.any(Date)
        })
      });
    });

    it('should handle database errors gracefully', async () => {
      (prisma.message.update as jest.Mock).mockRejectedValue(new Error('DB Error'));
      
      await expect(service.updateMessageStatus('msg123', 'failed')).resolves.not.toThrow();
      
      expect(logger.error).toHaveBeenCalledWith('[MESSAGE_UPDATE_ERROR]', expect.any(Error));
    });
  });

  describe('getBotInfo', () => {
    it('should return bot info', async () => {
      mockBotInstance.getMe.mockResolvedValue({
        id: 12345,
        first_name: 'TestBot',
        username: 'test_bot'
      });
      
      const info = await service.getBotInfo();
      
      expect(info).toEqual({
        id: 12345,
        firstName: 'TestBot',
        username: 'test_bot'
      });
    });

    it('should throw error on API failure', async () => {
      mockBotInstance.getMe.mockRejectedValue(new Error('API Error'));
      
      await expect(service.getBotInfo()).rejects.toThrow('Error al obtener información del bot');
    });

    it('should throw error if bot not configured', async () => {
      jest.resetModules();
      delete process.env.TELEGRAM_BOT_TOKEN;
      const { TelegramService: NoTokenService } = require('@/lib/services/bot/telegram.service');
      const noTokenService = new NoTokenService();
      
      await expect(noTokenService.getBotInfo()).rejects.toThrow('Telegram bot no está configurado');
    });
  });

  describe('handleCommand', () => {
    it('should handle /start command (ES)', async () => {
      const response = await service.handleCommand(123, 'start', undefined, 'es');
      expect(response).toContain('Soy el bot de Hago Produce');
    });

    it('should handle /start command (EN)', async () => {
      const response = await service.handleCommand(123, 'start', undefined, 'en');
      expect(response).toContain('I am the Hago Produce bot');
    });

    it('should handle /help command (ES)', async () => {
      const response = await service.handleCommand(123, 'help', undefined, 'es');
      expect(response).toContain('Comandos disponibles');
    });

    it('should handle /help command (EN)', async () => {
      const response = await service.handleCommand(123, 'help', undefined, 'en');
      expect(response).toContain('Available commands');
    });

    it('should handle /status command successfully (ES)', async () => {
      (prisma.customer.count as jest.Mock).mockResolvedValue(10);
      (prisma.invoice.count as jest.Mock).mockResolvedValue(20);
      (prisma.product.count as jest.Mock).mockResolvedValue(30);

      const response = await service.handleCommand(123, 'status', undefined, 'es');
      
      expect(response).toContain('10 clientes activos');
      expect(response).toContain('20 facturas registradas');
      expect(response).toContain('30 productos activos');
    });

    it('should handle /status command successfully (EN)', async () => {
      (prisma.customer.count as jest.Mock).mockResolvedValue(10);
      (prisma.invoice.count as jest.Mock).mockResolvedValue(20);
      (prisma.product.count as jest.Mock).mockResolvedValue(30);

      const response = await service.handleCommand(123, 'status', undefined, 'en');
      
      expect(response).toContain('10 active customers');
    });

    it('should handle /status command failure', async () => {
      (prisma.customer.count as jest.Mock).mockRejectedValue(new Error('DB Error'));
      
      const response = await service.handleCommand(123, 'status', undefined, 'es');
      expect(response).toContain('Error al obtener estado del sistema');
    });

    it('should handle unknown command', async () => {
      const response = await service.handleCommand(123, 'unknown', undefined, 'es');
      expect(response).toContain('Comando desconocido');
    });
  });
});
