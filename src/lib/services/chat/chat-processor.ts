
import { ChatLanguage, ChatServiceContext, DetectedIntent, QueryExecutionResult } from '@/lib/chat/types';
import prisma from '@/lib/db';
import { logger } from '@/lib/logger/logger.service';
import { analyzeIntent } from '@/lib/services/chat/intents';
import { executeQuery } from '@/lib/services/chat/query-executor';
import { formatResponse, buildSystemPrompt, buildUserPrompt } from '@/lib/services/chat/openai-client';
import { BotDecisionService } from '@/lib/services/bot-decision.service';
import { convertWebToWhatsApp } from '@/lib/services/bot/utils/whatsapp-formatter';

const botDecisionService = new BotDecisionService();

export interface ProcessChatRequestOptions {
  userId: string;
  sessionId: string;
  message: string;
  platform: 'web' | 'whatsapp';
  context?: ChatServiceContext; // Optional additional context
}

export interface ProcessChatResponse {
  reply: string;
  intent: string;
  confidence: number;
  sessionId: string;
  rawReply: string; // Original formatted reply (Markdown/HTML)
}

function detectLanguage(message: string): ChatLanguage {
  const text = String(message || '').toLowerCase();
  const hasSpanishPunctuation = /[¿¡]/.test(text);
  const hasCionEnding = /\b\w*ción\b/.test(text);
  const spanishWords = [
    'qué', 'cual', 'cuál', 'cómo', 'cuanto', 'cuánto', 'dónde',
    'precio', 'proveedor', 'factura', 'cliente',
    'quiero', 'necesito', 'tengo', 'comprar', 'mejor'
  ];
  const hasSpanishWord = spanishWords.some(w => text.includes(w));
  return (hasSpanishPunctuation || hasCionEnding || hasSpanishWord) ? 'es' : 'en';
}

export async function processChatRequest(options: ProcessChatRequestOptions): Promise<ProcessChatResponse> {
  const { userId, sessionId, message, platform, context } = options;
  const currentSessionId = sessionId;
  const chatLanguage: ChatLanguage = detectLanguage(message);

  // 1. Find or Create Session
  let session = await prisma.chatSession.findUnique({
    where: { sessionId: currentSessionId },
  });

  if (!session) {
    session = await prisma.chatSession.create({
      data: {
        sessionId: currentSessionId,
        userId: userId,
        context: context ? JSON.parse(JSON.stringify(context)) : undefined,
        messages: [],
      },
    });
  }

  // 2. Intent Analysis
  const sessionContext = session.context ? JSON.parse(JSON.stringify(session.context)) : {};
  const detected = await analyzeIntent(message, chatLanguage, sessionContext);

  // 3. Query Execution
  // Fetch user details for execution context if needed (e.g. customerId)
  // We assume userId is valid. We also need customerId.
  // We can fetch it from DB or pass it in context.
  // Ideally, we should fetch it fresh to ensure accuracy.
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { customerId: true }
  });

  const executionResult = await executeQuery(detected, chatLanguage, {
    userId: userId,
    customerId: user?.customerId || undefined,
    pendingOrder: sessionContext.pendingOrder,
    pendingPurchaseOrders: sessionContext.pendingPurchaseOrders,
    pendingInvoice: sessionContext.pendingInvoice,
  });

  // 4. Update Context
  let newContext = { ...sessionContext };
  if (executionResult.data?.pendingOrder) {
    newContext.pendingOrder = executionResult.data.pendingOrder;
  }
  if (executionResult.data?.pendingOrders) {
    newContext.pendingPurchaseOrders = executionResult.data.pendingOrders;
  }
  if (executionResult.data?.pendingInvoice) {
    newContext.pendingInvoice = executionResult.data.pendingInvoice;
  }

  if (
    (detected.intent === 'confirm_order' || detected.intent === 'cancel_order') &&
    executionResult.data?.success
  ) {
    delete newContext.pendingOrder;
  }

  if (
    (detected.intent === 'confirm_purchase_order' || detected.intent === 'cancel_purchase_order') &&
    executionResult.data?.success
  ) {
    delete newContext.pendingPurchaseOrders;
  }

  if (
    (detected.intent === 'confirm_invoice' || detected.intent === 'cancel_invoice') &&
    executionResult.data?.success
  ) {
    delete newContext.pendingInvoice;
    
    try {
      await botDecisionService.saveDecision(
        session.id,
        detected.intent,
        detected.confidence,
        executionResult.data
      );
    } catch (error) {
      logger.error('[BotDecision] Failed to save decision', error);
    }
  }

  // 5. Format Response with OpenAI
  const existingMessages = Array.isArray(session.messages) ? (session.messages as any[]) : [];
  const lastMessages = existingMessages.slice(-20);

  const historyMessages = lastMessages.map((m: any) => ({
    role: (m.role === 'assistant' ? 'assistant' : 'user') as 'assistant' | 'user',
    content: String(m.content ?? ''),
  }));

  const rawReply = await formatResponse(detected.intent, chatLanguage, executionResult, [
    { role: 'system', content: buildSystemPrompt(chatLanguage) },
    { role: 'system', content: `Historial reciente del chat en ${chatLanguage}:` },
    ...historyMessages,
    { role: 'user', content: buildUserPrompt(detected.intent, chatLanguage, executionResult) },
  ]);

  // 6. Platform-Specific Formatting
  let finalReply = rawReply;
  if (platform === 'whatsapp') {
    finalReply = convertWebToWhatsApp(rawReply);
  }

  // 7. Update Session History
  const newMessage = {
    role: 'user',
    content: message,
    timestamp: new Date().toISOString(),
  };
  
  const newReply = {
    role: 'assistant',
    content: finalReply,
    timestamp: new Date().toISOString(),
    intent: detected.intent,
  };

  await prisma.chatSession.update({
    where: { sessionId: currentSessionId },
    data: {
      messages: [...existingMessages, newMessage, newReply],
      lastActivityAt: new Date(),
      context: newContext,
    },
  });

  return {
    reply: finalReply,
    intent: detected.intent,
    confidence: detected.confidence,
    sessionId: currentSessionId,
    rawReply,
  };
}
