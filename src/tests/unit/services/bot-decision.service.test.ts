import { BotDecisionService, BotDecisionValidationError } from '@/lib/services/bot-decision.service';
import prisma from '@/lib/db';
import { logger } from '@/lib/logger/logger.service';
import { BotDecisionPayload } from '@/lib/types/bot-decision.types';
import { Prisma } from '@prisma/client';

// Mock DB interactions
// Note: @/lib/db is mocked globally in jest.setup.ts, so prisma here is the mock object

// Mock Logger
jest.mock('@/lib/logger/logger.service', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('BotDecisionService Unit Tests', () => {
  let service: BotDecisionService;

  beforeEach(() => {
    service = new BotDecisionService();
    jest.clearAllMocks();
  });

  describe('saveDecision', () => {
    const sessionId = 'session-123';
    const payload: BotDecisionPayload = { action: 'test' };

    // 1. confidence = 0 -> valid
    it('should accept confidence = 0', async () => {
      (prisma.botDecision.create as jest.Mock).mockResolvedValue({ id: '1', sessionId, confidence: 0, decision: payload } as any);
      await service.saveDecision(sessionId, 'test', 0, payload);
      expect(prisma.botDecision.create).toHaveBeenCalled();
    });

    // 2. confidence = 1 -> valid
    it('should accept confidence = 1', async () => {
      (prisma.botDecision.create as jest.Mock).mockResolvedValue({ id: '1', sessionId, confidence: 1, decision: payload } as any);
      await service.saveDecision(sessionId, 'test', 1, payload);
      expect(prisma.botDecision.create).toHaveBeenCalled();
    });

    // 3. confidence = -0.1 -> BotDecisionValidationError
    it('should throw BotDecisionValidationError for confidence = -0.1', async () => {
      await expect(service.saveDecision(sessionId, 'test', -0.1, payload))
        .rejects.toThrow(BotDecisionValidationError);
    });

    // 4. confidence = 1.1 -> BotDecisionValidationError
    it('should throw BotDecisionValidationError for confidence = 1.1', async () => {
      await expect(service.saveDecision(sessionId, 'test', 1.1, payload))
        .rejects.toThrow(BotDecisionValidationError);
    });

    // 5. sessionId empty -> BotDecisionValidationError
    it('should throw BotDecisionValidationError for empty sessionId', async () => {
      await expect(service.saveDecision('', 'test', 0.5, payload))
        .rejects.toThrow(BotDecisionValidationError);
    });

    // 6. intent empty -> BotDecisionValidationError
    it('should throw BotDecisionValidationError for empty intent', async () => {
      await expect(service.saveDecision(sessionId, '', 0.5, payload))
        .rejects.toThrow(BotDecisionValidationError);
    });

    // 7. ChatSession not exists -> BotDecisionValidationError
    it('should throw BotDecisionValidationError if ChatSession does not exist', async () => {
       const error = new Prisma.PrismaClientKnownRequestError('Foreign key constraint failed', {
        code: 'P2003',
        clientVersion: '5.x.x'
      });
      (prisma.botDecision.create as jest.Mock).mockRejectedValue(error);
      
      await expect(service.saveDecision('non-existent', 'test', 0.5, payload))
        .rejects.toThrow(BotDecisionValidationError);
    });

    // 8. confidence = 0.3 -> logger.warn called
    it('should log warning for low confidence (0.3)', async () => {
      (prisma.botDecision.create as jest.Mock).mockResolvedValue({ id: '1', sessionId, confidence: 0.3, decision: payload } as any);
      await service.saveDecision(sessionId, 'test', 0.3, payload);
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Low confidence'));
    });

    // 9. confidence = 0.8 -> logger.warn NOT called
    it('should NOT log warning for high confidence (0.8)', async () => {
      (prisma.botDecision.create as jest.Mock).mockResolvedValue({ id: '1', sessionId, confidence: 0.8, decision: payload } as any);
      await service.saveDecision(sessionId, 'test', 0.8, payload);
      expect(logger.warn).not.toHaveBeenCalled();
    });
  });

  describe('getRecentDecisions', () => {
    // 10. getRecentDecisions() -> limit=10
    it('should use default limit of 10', async () => {
      (prisma.botDecision.findMany as jest.Mock).mockResolvedValue([]);
      await service.getRecentDecisions();
      expect(prisma.botDecision.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 10 }));
    });

    // 11. getRecentDecisions(200) -> limit=100 (MAX_LIMIT)
    it('should cap limit at 100', async () => {
      (prisma.botDecision.findMany as jest.Mock).mockResolvedValue([]);
      await service.getRecentDecisions(200);
      expect(prisma.botDecision.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 100 }));
    });
  });

  describe('getDecisionsBySession', () => {
    // 12. getDecisionsBySession -> order DESC
    it('should order by executedAt DESC', async () => {
      (prisma.botDecision.findMany as jest.Mock).mockResolvedValue([]);
      await service.getDecisionsBySession('sess-1');
      expect(prisma.botDecision.findMany).toHaveBeenCalledWith(expect.objectContaining({
        orderBy: { executedAt: 'desc' }
      }));
    });
  });
});
