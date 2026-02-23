import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth/middleware';
import { analyzeIntent } from '@/lib/services/chat/intents';
import { executeQuery } from '@/lib/services/chat/query-executor';
import { formatResponse } from '@/lib/services/chat/openai-client';
import { ChatLanguage } from '@/lib/chat/types';

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

    // 4. Intent Analysis
    // We default to 'es' (Spanish) as per project preference, unless context provides language
    const language: ChatLanguage = (context?.language as ChatLanguage) || 'es'; 
    const detected = analyzeIntent(message, language);

    // 5. Query Execution
    const executionResult = await executeQuery(detected, language, {
      userId: user.userId,
      customerId: user.customerId,
      // Pass context if needed in future
    });

    // 6. Format Response with OpenAI
    const reply = await formatResponse(detected.intent, language, executionResult);

    // 7. Return Response
    return NextResponse.json({
      reply,
      sessionId: currentSessionId,
      intent: detected.intent, // Optional: useful for debugging/client-side logic
    });

  } catch (error) {
    console.error('[CHAT_API_ERROR]', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
