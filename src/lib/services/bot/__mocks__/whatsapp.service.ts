import { jest } from '@jest/globals';

export const WhatsAppService = jest.fn().mockImplementation(() => ({
  sendMessage: jest.fn().mockResolvedValue('msg-id-123'),
  validateWebhookSignature: jest.fn().mockReturnValue(true),
  formatWhatsAppNumber: jest.fn().mockReturnValue('+1234567890'),
  parseWebhookBody: jest.fn(),
  logMessage: jest.fn(),
}));
