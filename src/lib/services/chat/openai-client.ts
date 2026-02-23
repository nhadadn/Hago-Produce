import { ChatIntent, ChatLanguage, DetectedIntent, QueryExecutionResult } from '@/lib/chat/types';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIChoice {
  message?: {
    content?: string | null;
  };
  finish_reason?: string | null;
}

interface OpenAIResponse {
  choices?: OpenAIChoice[];
}

function buildSystemPrompt(language: ChatLanguage): string {
  if (language === 'en') {
    return (
      'You are the assistant of HAGO PRODUCE, a fresh produce distributor in Canada. ' +
      'You have access to real inventory, prices, suppliers and invoices. ' +
      'Always answer in the user language (es/en). ' +
      'For creating invoices or drafts, always confirm with the user before proceeding. ' +
      'Answer concisely based on the provided JSON data and context. Do not invent data.'
    );
  }
  return (
    'Eres el asistente de HAGO PRODUCE, una empresa distribuidora de frutas y verduras en Canadá. ' +
    'Tienes acceso a datos reales de inventario, precios, proveedores y facturas. ' +
    'Responde siempre en el idioma del usuario (es/en). ' +
    'Para crear facturas o borradores, confirma siempre con el usuario antes de proceder. ' +
    'Responde de forma concisa basado en los datos JSON y el contexto proporcionado. No inventes datos.'
  );
}

function buildUserPrompt(intent: ChatIntent, language: ChatLanguage, executionResult: QueryExecutionResult): string {
  const base = {
    intent,
    data: executionResult.data,
  };
  const json = JSON.stringify(base);

  if (language === 'en') {
    return `Given the following JSON data, write a short, clear answer for the user in English.\n\n${json}`;
  }

  return `Con los siguientes datos en JSON, escribe una respuesta corta y clara para el usuario en Español.\n\n${json}`;
}

function buildIntentClassificationSystemPrompt(language: ChatLanguage): string {
  if (language === 'en') {
    return [
      'You are an assistant for the HAGO PRODUCE ERP chat system.',
      'Your task is ONLY to classify the user message into one of the predefined intents',
      'and extract structured parameters for database queries.',
      'Supported intents:',
      '- price_lookup',
      '- best_supplier',
      '- invoice_status',
      '- customer_balance',
      '- product_info',
      '- inventory_summary',
      '- create_order',
      '- overdue_invoices',
      'Respond with a strict JSON object with fields: intent (string) and params (object).',
    ].join(' ');
  }

  return [
    'Eres el asistente del chat del ERP HAGO PRODUCE.',
    'Tu tarea es SOLO clasificar el mensaje del usuario en uno de los intents predefinidos',
    'y extraer parámetros estructurados para consultas a la base de datos.',
    'Intents soportados:',
    '- price_lookup',
    '- best_supplier',
    '- invoice_status',
    '- customer_balance',
    '- product_info',
    '- inventory_summary',
    '- create_order',
    '- overdue_invoices',
    'Responde con un objeto JSON estricto con campos: intent (string) y params (object).',
  ].join(' ');
}

export async function classifyChatIntentWithOpenAI(
  message: string,
  language: ChatLanguage,
): Promise<DetectedIntent> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  if (!apiKey) {
    return {
      intent: 'price_lookup',
      confidence: 0.5,
      params: {
        searchTerm: message,
        language,
      },
    };
  }

  const messages: OpenAIMessage[] = [
    { role: 'system', content: buildIntentClassificationSystemPrompt(language) },
    { role: 'user', content: message },
  ];

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0,
      }),
    });

    if (!response.ok) {
      return {
        intent: 'price_lookup',
        confidence: 0.5,
        params: {
          searchTerm: message,
          language,
        },
      };
    }

    const data = (await response.json()) as OpenAIResponse;
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return {
        intent: 'price_lookup',
        confidence: 0.5,
        params: {
          searchTerm: message,
          language,
        },
      };
    }

    const parsed = JSON.parse(content) as { intent: ChatIntent; params?: Record<string, any> };

    return {
      intent: parsed.intent,
      confidence: 0.9,
      params: parsed.params ?? { searchTerm: message, language },
    };
  } catch (error) {
    console.error('[CHAT_INTENT_OPENAI_ERROR]', error);
    return {
      intent: 'price_lookup',
      confidence: 0.5,
      params: {
        searchTerm: message,
        language,
      },
    };
  }
}

function fallbackFormat(intent: ChatIntent, language: ChatLanguage, executionResult: QueryExecutionResult): string {
  const data = executionResult.data || {};

  if (intent === 'price_lookup') {
    const items = Array.isArray(data.items) ? data.items : [];
    if (!items.length) {
      return language === 'en'
        ? 'No prices found for the requested product.'
        : 'No se encontraron precios para el producto solicitado.';
    }
    const lines = items.map((item: any) => {
      const price = item.sellPrice != null ? item.sellPrice : item.costPrice;
      if (language === 'en') {
        return `${item.productName} - ${item.supplierName}: ${price} ${item.currency}`;
      }
      return `${item.productName} - ${item.supplierName}: ${price} ${item.currency}`;
    });
    return lines.join('\n');
  }

  if (intent === 'best_supplier') {
    const items = Array.isArray(data.items) ? data.items : [];
    if (!items.length) {
      return language === 'en'
        ? 'No supplier data found for this product.'
        : 'No se encontraron proveedores para este producto.';
    }
    const best = items[0];
    if (language === 'en') {
      return `Best supplier for ${best.productName} is ${best.supplierName} with price ${best.costPrice} ${best.currency}.`;
    }
    return `El mejor proveedor para ${best.productName} es ${best.supplierName} con precio ${best.costPrice} ${best.currency}.`;
  }

  if (intent === 'invoice_status') {
    const invoice = data.invoice;
    if (!invoice) {
      if (language === 'en') {
        return 'Invoice not found.';
      }
      return 'No se encontró la factura solicitada.';
    }
    if (language === 'en') {
      return `Invoice ${invoice.number} for customer ${invoice.customer.name} is ${invoice.status} with total ${invoice.total}.`;
    }
    return `La factura ${invoice.number} del cliente ${invoice.customer.name} está en estado ${invoice.status} con total ${invoice.total}.`;
  }

  if (intent === 'customer_balance') {
    const totalOutstanding = data.totalOutstanding || 0;
    const invoicesCount = data.invoicesCount || 0;
    if (language === 'en') {
      return `There are ${invoicesCount} pending invoices with a total outstanding balance of ${totalOutstanding}.`;
    }
    return `Hay ${invoicesCount} facturas pendientes con un saldo total de ${totalOutstanding}.`;
  }

  if (language === 'en') {
    return 'I processed your request.';
  }
  return 'He procesado tu solicitud.';
}

export async function formatResponse(
  intent: ChatIntent,
  language: ChatLanguage,
  executionResult: QueryExecutionResult,
  messages?: { role: 'system' | 'user' | 'assistant'; content: string }[],
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return fallbackFormat(intent, language, executionResult);
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const baseMessages: OpenAIMessage[] = messages
    ? messages
    : [
        { role: 'system', content: buildSystemPrompt(language) },
        { role: 'user', content: buildUserPrompt(intent, language, executionResult) },
      ];

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: baseMessages,
      }),
    });

    if (!response.ok) {
      return fallbackFormat(intent, language, executionResult);
    }

    const data = (await response.json()) as OpenAIResponse;
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return fallbackFormat(intent, language, executionResult);
    }
    return content.trim();
  } catch (error) {
    console.error('[CHAT_OPENAI_ERROR]', error);
    return fallbackFormat(intent, language, executionResult);
  }
}

