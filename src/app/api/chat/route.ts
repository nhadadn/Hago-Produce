import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth/middleware';
import { analyzeIntent } from '@/lib/services/chat/intents';
import { executeQuery } from '@/lib/services/chat/query-executor';
import { formatResponse, buildSystemPrompt, buildUserPrompt } from '@/lib/services/chat/openai-client';
import { ChatLanguage } from '@/lib/chat/types';
import { isRateLimited, createRateLimitResponse } from '@/lib/utils/rate-limit';
import prisma from '@/lib/db';
import { logAudit } from '@/lib/audit/logger';
import { logger } from '@/lib/logger/logger.service';
import { BotDecisionService } from '@/lib/services/bot-decision.service';

const botDecisionService = new BotDecisionService();

export async function POST(req: NextRequest) {
  try {
    // 1. Authentication
    // We assume the user is authenticated via session/cookie
    const user = await getAuthenticatedUser(req);
    
    // For now, if no user, we can return unauthorized or allow basic queries if desired.
    // Given it's an ERP, we strictly require auth.
    if (!user) {
      return unauthorizedResponse();
    }

    // 1.1 Rate Limiting
    const rateLimit = parseInt(process.env.CHAT_RATE_LIMIT || '20', 10);
    const language: ChatLanguage = 'es'; // Default, will be updated from body later

    if (isRateLimited('chat_api', user.userId, rateLimit)) {
      await logAudit({
        userId: user.userId,
        action: 'RATE_LIMIT_EXCEEDED',
        entityType: 'chat',
        entityId: 'chat_api',
        changes: { 
          limit: { old: null, new: rateLimit }, 
          endpoint: { old: null, new: '/api/chat' } 
        },
      });

      const rateLimitResponse = createRateLimitResponse('chat_api', user.userId, language);
      return NextResponse.json(rateLimitResponse.error, {
        status: 429,
        headers: {
          'Retry-After': rateLimitResponse.error.retryAfter.toString(),
        },
      });
    }

    // 2. Parse Request
    const body = await req.json();
    const { message, sessionId, context } = body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // 3. Session Management
    // If no sessionId provided, generate one (using web crypto API if available, else random string)
    const currentSessionId = sessionId || crypto.randomUUID();
    const chatLanguage: ChatLanguage = (context?.language as ChatLanguage) || 'es'; 

    // Find or create session
    let session = await prisma.chatSession.findUnique({
      where: { sessionId: currentSessionId },
    });

    if (!session) {
      session = await prisma.chatSession.create({
        data: {
          sessionId: currentSessionId,
          userId: user.userId,
          context: context ? JSON.parse(JSON.stringify(context)) : undefined,
          messages: [],
        },
      });
    }

    // 4. Intent Analysis
    const sessionContext = session.context ? JSON.parse(JSON.stringify(session.context)) : {};
    const detected = await analyzeIntent(message, chatLanguage, sessionContext);

    // 5. Query Execution
    const executionResult = await executeQuery(detected, chatLanguage, {
      userId: user.userId,
      customerId: user.customerId,
      pendingOrder: sessionContext.pendingOrder,
      pendingPurchaseOrders: sessionContext.pendingPurchaseOrders,
      pendingInvoice: sessionContext.pendingInvoice,
    });

    // 5.1 Update Context
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

    // 6. Format Response with OpenAI, including short history for context
    const existingMessages = Array.isArray(session.messages) ? (session.messages as any[]) : [];
    const lastMessages = existingMessages.slice(-20);

    const historyMessages = lastMessages.map((m: any) => ({
      role: (m.role === 'assistant' ? 'assistant' : 'user') as 'assistant' | 'user',
      content: String(m.content ?? ''),
    }));

    const reply = await formatResponse(detected.intent, chatLanguage, executionResult, [
      { role: 'system', content: buildSystemPrompt(chatLanguage) },
      { role: 'system', content: `Historial reciente del chat en ${chatLanguage}:` },
      ...historyMessages,
      { role: 'user', content: buildUserPrompt(detected.intent, chatLanguage, executionResult) },
    ]);

    // 7. Update Session History
    // We append the new exchange to the messages array
    const newMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    
    const newReply = {
      role: 'assistant',
      content: reply,
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

    // 8. Return Response (JSON or SSE streaming)
    const accept = req.headers.get('accept') || '';

    if (accept.includes('text/event-stream')) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          const payload = JSON.stringify({
            reply,
            sessionId: currentSessionId,
            intent: detected.intent,
          });
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    return NextResponse.json({
      reply,
      sessionId: currentSessionId,
      intent: detected.intent, // Optional: useful for debugging/client-side logic
    });

  } catch (error) {
    logger.error('[CHAT_API_ERROR]', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
