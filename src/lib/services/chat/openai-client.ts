import { ChatIntent, ChatLanguage, QueryExecutionResult } from '@/lib/chat/types';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIChoice {
  message?: {
    content?: string | null;
  };
}

interface OpenAIResponse {
  choices?: OpenAIChoice[];
}

function buildSystemPrompt(language: ChatLanguage): string {
  if (language === 'en') {
    return 'You are an assistant for a produce ERP. Answer concisely based on the provided JSON data. Do not invent data.';
  }
  return 'Eres un asistente para un ERP de productos frescos. Responde de forma concisa basado en los datos JSON proporcionados. No inventes datos.';
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
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return fallbackFormat(intent, language, executionResult);
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const messages: OpenAIMessage[] = [
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
        messages,
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

