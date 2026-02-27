import { BotDecision } from '@prisma/client';

export interface BotDecisionPayload {
  action: string;
  reasoning?: string;
  parameters?: Record<string, unknown>;
  outcome?: string;
  [key: string]: unknown;
}

export interface IBotDecisionService {
  saveDecision(
    sessionId: string,
    intent: string,
    confidence: number,        // Rango: 0.0 - 1.0
    decision: BotDecisionPayload,
    preInvoiceId?: string      // Opcional: vincula con PreInvoice
  ): Promise<BotDecision>;

  getDecisionsBySession(
    sessionId: string
  ): Promise<BotDecision[]>;

  getRecentDecisions(
    limit?: number             // Default: 10, Max: 100
  ): Promise<BotDecision[]>;
}
