
import prisma from '@/lib/db';
import twilio from 'twilio';

// Define mocks variables
const mockMessagesCreate = jest.fn();
const mockValidateRequest = jest.fn();
const mockLoggerError = jest.fn();

// Mock Prisma
jest.mock('@/lib/db', () => ({
  message: {
    create: jest.fn(),
    update: jest.fn(),
  },
}));

// Mock Logger
jest.mock('@/lib/logger/logger.service', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock Twilio
jest.mock('twilio', () => {
  const twilioFn: any = jest.fn(() => ({
    messages: {
      create: mockMessagesCreate,
    },
  }));
  twilioFn.validateRequest = mockValidateRequest;
  return twilioFn;
});

describe('WhatsApp Service', () => {
  const originalEnv = process.env;
  let whatsAppService: any;
  let prismaMock: any;
  let loggerMock: any;

  beforeEach(async () => {
    jest.resetModules();
    jest.clearAllMocks();
    
    process.env = { ...originalEnv };
    process.env.TWILIO_ACCOUNT_SID = 'AC123';
    process.env.TWILIO_AUTH_TOKEN = 'auth_token';
    process.env.TWILIO_WHATSAPP_NUMBER = '14155552345';

    // Dynamic import to pick up env vars and fresh mocks
    const dbModule = await import('@/lib/db');
    prismaMock = dbModule.default;

    const loggerModule = await import('@/lib/logger/logger.service');
    loggerMock = loggerModule.logger;
    
    const serviceModule = await import('@/lib/services/bot/whatsapp.service');
    whatsAppService = serviceModule.whatsAppService;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('sendMessage', () => {
    it('should send a message successfully', async () => {
      mockMessagesCreate.mockResolvedValue({ sid: 'SM123' });
      const result = await whatsAppService.sendMessage('+12345678901', 'Hello');
      
      expect(mockMessagesCreate).toHaveBeenCalledWith({
        from: 'whatsapp:14155552345',
        to: 'whatsapp:+12345678901',
        body: 'Hello',
      });
      expect(result).toBe('SM123');
    });

    it('should format number correctly (remove spaces/dashes)', async () => {
      mockMessagesCreate.mockResolvedValue({ sid: 'SM123' });
      // Use a number that triggers the +1 logic (not starting with 1)
      await whatsAppService.sendMessage('555-456-7890', 'Hello');
      
      expect(mockMessagesCreate).toHaveBeenCalledWith(expect.objectContaining({
        to: 'whatsapp:+15554567890', 
      }));
    });

    it('should throw error if Twilio fails', async () => {
      mockMessagesCreate.mockRejectedValue(new Error('Twilio error'));
      await expect(whatsAppService.sendMessage('+12345678901', 'Hello'))
        .rejects.toThrow('Error al enviar mensaje de WhatsApp');
    });
  });

  describe('formatWhatsAppNumber', () => {
    it('should return number as is if it starts with +', () => {
      expect(whatsAppService.formatWhatsAppNumber('+521234567890')).toBe('+521234567890');
    });

    it('should add +1 if 10 digits provided and does not start with 1', () => {
      expect(whatsAppService.formatWhatsAppNumber('5554567890')).toBe('+15554567890');
    });

    it('should add + if digits start with 1 (even if length 10)', () => {
       // Logic: if startsWith('1') -> `+${digitsOnly}`
       expect(whatsAppService.formatWhatsAppNumber('1234567890')).toBe('+1234567890');
    });
    
    it('should just add + for other cases', () => {
       // Logic in code: return `+${digitsOnly}`
       expect(whatsAppService.formatWhatsAppNumber('521234567890')).toBe('+521234567890');
    });

    it('should throw error if less than 10 digits', () => {
      expect(() => whatsAppService.formatWhatsAppNumber('123')).toThrow('Número inválido: mínimo 10 dígitos');
    });
  });

  describe('validateWebhookSignature', () => {
    it('should return true if validation passes', () => {
      mockValidateRequest.mockReturnValue(true);
      const result = whatsAppService.validateWebhookSignature('sig', 'url', 'body', 'token');
      expect(result).toBe(true);
      expect(mockValidateRequest).toHaveBeenCalledWith('token', 'sig', 'url', 'body');
    });

    it('should return false if signature is missing', () => {
      const result = whatsAppService.validateWebhookSignature(null, 'url', 'body', 'token');
      expect(result).toBe(false);
    });

    it('should return false if validation throws', () => {
      mockValidateRequest.mockImplementation(() => { throw new Error('Valid error'); });
      const result = whatsAppService.validateWebhookSignature('sig', 'url', 'body', 'token');
      expect(result).toBe(false);
      expect(loggerMock.error).toHaveBeenCalledWith('[TWILIO_VALIDATION_ERROR]', expect.any(Error));
    });
  });

  describe('parseWebhookBody', () => {
    it('should parse body correctly', () => {
      const body = 'From=whatsapp%3A%2B1234567890&To=whatsapp%3A%2B0987654321&Body=Hello+World&MessageSid=SM123&NumMedia=0';
      const result = whatsAppService.parseWebhookBody(body);
      
      expect(result).toEqual({
        from: '+1234567890',
        to: '+0987654321',
        message: 'Hello World',
        messageSid: 'SM123',
        numMedia: 0,
      });
    });

    it('should handle missing fields gracefully', () => {
      const result = whatsAppService.parseWebhookBody('');
      expect(result).toEqual({
        from: '',
        to: '',
        message: '',
        messageSid: '',
        numMedia: 0,
      });
    });
  });

  describe('logMessage', () => {
    it('should create message in db', async () => {
      await whatsAppService.logMessage('user1', 'Hello');
      expect(prismaMock.message.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          platform: 'whatsapp',
          platformUserId: 'user1',
          message: 'Hello',
        }),
      }));
    });

    it('should create message in db with processed status', async () => {
      await whatsAppService.logMessage('user1', 'Hello', undefined, undefined, undefined, 'processed');
      expect(prismaMock.message.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          status: 'processed',
          processedAt: expect.any(Date),
        }),
      }));
    });

    it('should catch error and log it without throwing', async () => {
      prismaMock.message.create.mockRejectedValue(new Error('DB Error'));
      
      await expect(whatsAppService.logMessage('user1', 'Hello')).resolves.not.toThrow();
      
      expect(loggerMock.error).toHaveBeenCalledWith('[MESSAGE_LOG_ERROR]', expect.any(Error));
    });
  });

  describe('updateMessageStatus', () => {
    it('should update message in db', async () => {
      await whatsAppService.updateMessageStatus('msg1', 'processed');
      expect(prismaMock.message.update).toHaveBeenCalledWith({
        where: { id: 'msg1' },
        data: expect.objectContaining({
          status: 'processed',
        }),
      });
    });

    it('should update message with failed status', async () => {
      await whatsAppService.updateMessageStatus('msg1', 'failed', 'some error');
      expect(prismaMock.message.update).toHaveBeenCalledWith({
        where: { id: 'msg1' },
        data: expect.objectContaining({
          status: 'failed',
          processedAt: undefined,
          errorMessage: 'some error',
        }),
      });
    });

    it('should catch error and log it without throwing', async () => {
      prismaMock.message.update.mockRejectedValue(new Error('DB Error'));
      
      await expect(whatsAppService.updateMessageStatus('msg1', 'processed')).resolves.not.toThrow();
      
      expect(loggerMock.error).toHaveBeenCalledWith('[MESSAGE_UPDATE_ERROR]', expect.any(Error));
    });
  });
});
