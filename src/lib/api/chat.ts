import { ChatLanguage, ChatResponseData } from '@/lib/chat/types';

interface ChatApiError {
  code: string;
  message: string;
}

interface ChatApiResponse {
  success: boolean;
  data?: ChatResponseData;
  error?: ChatApiError;
  meta?: {
    cached?: boolean;
  };
}

function getHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

export async function sendChatMessage(
  message: string, 
  language: ChatLanguage,
  sessionId?: string,
  context?: Record<string, any>
): Promise<ChatResponseData> {
  const body = { message, language, sessionId, context };

  const res = await fetch('/api/v1/chat/query', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  const json = (await res.json()) as ChatApiResponse;

  if (!res.ok || !json.success || !json.data) {
    const fallback = language === 'en' ? 'Error sending message' : 'Error al enviar el mensaje';
    throw new Error(json.error?.message || fallback);
  }

  return json.data;
}

