import { BotDecision, PrismaClient, Prisma } from '@prisma/client';
import { logger } from '@/lib/logger/logger.service';
import { BotDecisionPayload, IBotDecisionService } from '@/lib/types/bot-decision.types';

// Avoid direct import of global prisma to facilitate testing/mocking if needed, 
// but for now, we'll use a getter or dependency injection pattern if preferred.
// However, to fix the immediate "undefined" error which suggests the imported prisma is undefined:
import prisma from '@/lib/db';

export class BotDecisionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BotDecisionValidationError';
  }
}

export class BotDecisionService implements IBotDecisionService {
  // Use a getter to ensure we access the singleton at runtime, 
  // helping if there are initialization order issues (though imports should handle it).
  private get db(): PrismaClient {
    return prisma;
  }

  /**
   * Guarda una decisión del bot en la base de datos.
   * Valida la confianza y maneja la serialización del payload.
   * 
   * @param sessionId - ID de la sesión de chat
   * @param intent - Intención detectada
   * @param confidence - Nivel de confianza (0.0 - 1.0)
   * @param decision - Payload con detalles de la decisión
   * @param preInvoiceId - (Opcional) ID de pre-factura relacionada
   * @returns La decisión creada
   */
  async saveDecision(
    sessionId: string,
    intent: string,
    confidence: number,
    decision: BotDecisionPayload,
    preInvoiceId?: string
  ): Promise<BotDecision> {
    try {
      // 1. Validar inputs
      if (confidence < 0 || confidence > 1) {
        throw new BotDecisionValidationError('Confidence must be between 0.0 and 1.0');
      }

      if (!sessionId || sessionId.trim() === '') {
        throw new BotDecisionValidationError('Session ID is required');
      }

      if (!intent || intent.trim() === '') {
        throw new BotDecisionValidationError('Intent is required');
      }

      // 2. Logging de advertencia para confianza baja
      if (confidence < 0.5) {
        logger.warn(`[BotDecisionService] Low confidence decision (${confidence}) for session ${sessionId}, intent: ${intent}`);
      }

      // 3. Preparar datos para Prisma
      // Prisma maneja JSON automáticamente, pero necesitamos asegurarnos que el tipo coincida
      const decisionJson = decision as any; // Prisma Json type compatibility

      logger.info(`[BotDecisionService] Saving decision for session ${sessionId}, intent: ${intent}`);

      // 4. Crear registro
      const newDecision = await this.db.botDecision.create({
        data: {
          sessionId,
          intent,
          confidence,
          decision: decisionJson,
          preInvoice: preInvoiceId ? { connect: { id: preInvoiceId } } : undefined,
        },
      });

      return newDecision;
    } catch (error: any) {
      // Si es un error de validación, lo relanzamos tal cual
      if (error instanceof BotDecisionValidationError) {
        throw error;
      }

      // Manejar errores conocidos de Prisma
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          // Foreign key constraint failed
          throw new BotDecisionValidationError('Referenced session or preInvoice does not exist');
        }
      }

      logger.error(`[BotDecisionService] Error saving decision: ${error.message}`, {
        sessionId,
        intent,
        error,
      });
      throw error;
    }
  }

  /**
   * Obtiene todas las decisiones asociadas a una sesión específica.
   * 
   * @param sessionId - ID de la sesión
   * @returns Lista de decisiones
   */
  async getDecisionsBySession(sessionId: string): Promise<BotDecision[]> {
    try {
      if (!sessionId) {
        throw new Error('Session ID is required');
      }

      const decisions = await this.db.botDecision.findMany({
        where: { sessionId },
        orderBy: { executedAt: 'desc' },
      });

      return decisions;
    } catch (error: any) {
      logger.error(`[BotDecisionService] Error fetching decisions for session ${sessionId}: ${error.message}`, {
        sessionId,
        error,
      });
      throw error;
    }
  }

  /**
   * Obtiene las decisiones más recientes del sistema.
   * Útil para monitoreo y auditoría.
   * 
   * @param limit - Cantidad máxima de registros a retornar (default: 10, max: 100)
   * @returns Lista de decisiones recientes
   */
  async getRecentDecisions(limit: number = 10): Promise<BotDecision[]> {
    try {
      // Validar límite
      const validLimit = Math.min(Math.max(1, limit), 100);

      const decisions = await this.db.botDecision.findMany({
        take: validLimit,
        orderBy: { executedAt: 'desc' },
        include: {
          chatSession: {
            select: {
              userId: true, // Incluir info básica de contexto si es necesario
            }
          }
        }
      });

      return decisions;
    } catch (error: any) {
      logger.error(`[BotDecisionService] Error fetching recent decisions: ${error.message}`, {
        limit,
        error,
      });
      throw error;
    }
  }
}
