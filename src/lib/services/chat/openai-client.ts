import { ChatIntent, ChatLanguage, DetectedIntent, QueryExecutionResult } from '@/lib/chat/types';
import { logger } from '@/lib/logger/logger.service';
import { formatCustomerBalance } from './formatters/customer-balance.formatter';
import { formatOverdueInvoices } from './formatters/overdue-invoices.formatter';

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

export function buildSystemPrompt(language: ChatLanguage): string {
  if (language === 'en') {
    return (
      'You are the assistant of HAGO PRODUCE, a fresh produce distributor in Canada. ' +
      'You have access to real inventory, prices, suppliers, invoices and customer information. ' +
      'Always answer in the user language (es/en). ' +
      'For creating invoices or drafts, always confirm with the user before proceeding. ' +
      'Answer concisely based on the provided JSON data and context. Do not invent data.'
    );
  }
  return (
    'Eres el asistente de HAGO PRODUCE, una empresa distribuidora de frutas y verduras en Canadá. ' +
    'Tienes acceso a datos reales de inventario, precios, proveedores, facturas e información de clientes. ' +
    'Responde siempre en el idioma del usuario (es/en). ' +
    'Para crear facturas o borradores, confirma siempre con el usuario antes de proceder. ' +
    'Responde de forma concisa basado en los datos JSON y el contexto proporcionado. No inventes datos.'
  );
}

export function buildUserPrompt(intent: ChatIntent, language: ChatLanguage, executionResult: QueryExecutionResult): string {
  const data = executionResult.data as any;
  const lang = language === 'es' ? 'Spanish' : 'English';
  const langEs = language === 'es';

  // ── product_info ──────────────────────────────────────
  if (intent === 'product_info') {

    if (!data?.items || data.items.length === 0) {
      if (data?.message) return data.message;
      if (data?.suggestions?.length > 0) {
        const list = (data.suggestions as string[]).join(', ');
        return langEs
          ? 'No encontré el producto "' + String(data.query || '') + '". ¿Quisiste decir: ' + list + '?'
          : 'No product found for "' + String(data.query || '') + '". Did you mean: ' + list + '?';
      }
      return langEs
        ? 'No encontré información para "' + String(data.query || '') + '".'
        : 'No product information found for "' + String(data.query || '') + '".';
    }

    const items = data.items as Array<{
      name: string;
      nameEs?: string | null;
      category?: string | null;
      unit?: string | null;
      sku?: string | null;
      description?: string | null;
    }>;

    const productList = items.map((p) => {
      const displayName = langEs && p.nameEs ? p.nameEs : p.name;
      const parts: string[] = ['Name: ' + displayName];
      if (p.category) parts.push('Category: ' + p.category);
      if (p.unit) parts.push('Unit: ' + p.unit);
      if (p.sku) parts.push('SKU: ' + p.sku);
      if (p.description) parts.push('Description: ' + p.description);
      return parts.join(', ');
    }).join('\n');

    return (langEs
      ? 'Eres un asistente de HAGO PRODUCE, distribuidor de frutas y verduras en Toronto, Canada. '
        + 'Con la siguiente informacion de productos, escribe una respuesta clara y profesional en Español. '
        + 'Menciona nombre, categoria y unidad. Si hay varios productos, listalos brevemente. '
        + 'No menciones IDs internos.\n\n'
      : 'You are an assistant for HAGO PRODUCE, a fresh produce distributor in Toronto, Canada. '
        + 'Using the following product information, write a clear and professional response in English. '
        + 'Mention name, category, and unit. If multiple products, list them briefly. '
        + 'Do not mention internal IDs.\n\n'
    ) + productList;
  }

  // ── inventory_summary ─────────────────────────────────
  if (intent === 'inventory_summary') {

    const items = Array.isArray(data?.items) ? data.items as Array<{
      name: string;
      nameEs?: string | null;
      category?: string | null;
      unit?: string | null;
      isActive?: boolean;
    }> : [];

    const summary = data?.summary as {
      totalProducts?: number;
      categories?: string[];
    } | undefined;

    const totalProducts = summary?.totalProducts ?? items.length;
    const categories = Array.isArray(summary?.categories)
      ? (summary!.categories as string[]).join(', ')
      : '';

    const sampleNames = items.slice(0, 8).map((p) =>
      (langEs && p.nameEs ? p.nameEs : p.name)
    ).join(', ');

    const filters = data?.filters as {
      category?: string | null;
      searchTerm?: string | null;
    } | undefined;

    const filterNote = filters?.category
      ? (langEs ? 'Categoria filtrada: ' : 'Filtered category: ') + filters.category
      : filters?.searchTerm
        ? (langEs ? 'Busqueda: ' : 'Search term: ') + filters.searchTerm
        : '';

    const context = [
      'Total active products: ' + totalProducts,
      categories ? 'Categories: ' + categories : '',
      sampleNames ? 'Sample products: ' + sampleNames : '',
      filterNote,
    ].filter(Boolean).join('\n');

    return (langEs
      ? 'Eres un asistente de HAGO PRODUCE, distribuidor de frutas y verduras en Toronto, Canada. '
        + 'Con el siguiente resumen de inventario, escribe una respuesta concisa en Español. '
        + 'Menciona el total de productos, categorias disponibles y algunos ejemplos. '
        + 'Tono profesional y directo.\n\n'
      : 'You are an assistant for HAGO PRODUCE, a fresh produce distributor in Toronto, Canada. '
        + 'Using the following inventory summary, write a concise response in English. '
        + 'Mention total products, available categories, and a few examples. '
        + 'Professional and direct tone.\n\n'
    ) + context;
  }

  // ── generic fallback for all other intents ────────────
  const base = { intent, data: executionResult.data };
  const json = JSON.stringify(base, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  );
  return langEs
    ? 'Con los siguientes datos en JSON, escribe una respuesta corta y clara para el usuario en Español.\n\n' + json
    : 'Given the following JSON data, write a short, clear answer for the user in English.\n\n' + json;
}

function buildIntentClassificationSystemPrompt(language: ChatLanguage): string {
  if (language === 'en') {
    return `SECTION 1 — ROLE
You are the intent classifier for HAGO PRODUCE, a fresh produce distribution company in Canada. Your only job is to analyze the user message and return a single JSON object. Nothing else.

SECTION 2 — STRICT OUTPUT RULE
Return ONLY a raw JSON object. No markdown. No explanation. No code blocks. The JSON must be parseable by JSON.parse() with zero modifications.

SECTION 3 — INPUT STRUCTURE
You will receive:
- message: the user's current text
- context: optional object with lastProduct, lastCustomer, lastIntent, language
Use context.lastProduct and context.lastCustomer to resolve pronouns like "it", "that", "them", "the same one".

SECTION 4 — THE 7 QUERY INTENTS
Define each intent with:
- When to use it (semantic trigger, not just keywords)
- Exact param names (these are non-negotiable, handlers depend on them):
  * price_lookup     → searchTerm (string), supplierName (string|null)
  * best_supplier    → searchTerm (string), maxResults (number, default 5)
  * product_info     → productName (string)
  * invoice_status   → invoiceNumber (string|null), customerName (string|null), isLast (boolean)
  * customer_balance → customerName (string|null), queryType ("single_customer"|"global_summary")
  * inventory_summary → category (string|null), searchTerm (string|null)
  * overdue_invoices → customerName (string|null), queryType ("single_customer"|"global_report"), daysOverdue (number|null)
- When NOT to use it (disambiguation rules)

SECTION 5 — DISAMBIGUATION RULES
Include these 4 explicit rules:
1. "how much" / "price" / "cost" = price_lookup
   "who sells" / "best supplier" / "cheapest" = best_supplier
2. List of invoices = invoice_status
   Total debt/balance = customer_balance
3. "overdue"/"past due"/"unpaid"/"late"/"collection" = overdue_invoices
   (these urgency words override invoice_status and customer_balance)
4. Single specific product detail = product_info
   Category or list request = inventory_summary
5. Single product name fallback: 
If the message contains only a product name or short 
product phrase with no action verb (price, cost, show, 
find, list, etc.), classify as price_lookup with that 
term as searchTerm. Do not ask for clarification. 
Examples: 
  "manzana" → price_lookup, searchTerm: "apple" 
  "celery" → price_lookup, searchTerm: "celery" 
  "tomate cherry" → price_lookup, searchTerm: "cherry tomato" 
6. Multiple products in one message: 
If the message contains multiple product names separated 
by "and", "y", commas, or "también"/"also", extract ALL 
products and return intent price_lookup with: 
  searchTerm: first product name in English (string) 
  searchTerms: all product names in English (string[]) 
If only one product is found, searchTerms must still be 
an array with one element: [searchTerm]

SECTION 6 — LANGUAGE RULES
- Default language: English (Canadian client, all DB data is in English)
- If user writes in Spanish: detect and respond in Spanish
- Product names in params MUST always be in English regardless of input
  Example: "precio del tomate" → searchTerm must be "tomato" not "tomate"
- Never translate product names before searching the database

SECTION 7 — CLARIFICATION INTENT
Use intent "clarification_needed" when:
- Required parameter cannot be inferred from message or context
- Confidence would be below 0.65
- Two intents have nearly equal confidence
Params for clarification_needed must include:
- "question": exact question to ask user (in their detected language)
- "candidates": array of 1-2 most likely intent names

SECTION 8 — CONCRETE OUTPUT EXAMPLES
Include exactly these 5 examples:

Example 1 (price_lookup, English):
Input: "What's the price of tomato?"
Output: {"intent":"price_lookup","params":{"searchTerm":"tomato","supplierName":null},"confidence":0.97}

Example 2 (price_lookup, context resolution):
Input: "And how much does it cost?"
Context: { "lastProduct": "avocado" }
Output: {"intent":"price_lookup","params":{"searchTerm":"avocado","supplierName":null},"confidence":0.91}

Example 3 (best_supplier, Spanish input → English param):
Input: "¿Quién vende tomate más barato?"
Output: {"intent":"best_supplier","params":{"searchTerm":"tomato","maxResults":5},"confidence":0.95}

Example 4 (invoice_status, isLast):
Input: "Show me the latest invoice for Walmart"
Output: {"intent":"invoice_status","params":{"invoiceNumber":null,"customerName":"Walmart","isLast":true},"confidence":0.96}

Example 5 (clarification_needed):
Input: "Show me the balance"
Output: {"intent":"clarification_needed","params":{"question":"Which customer's balance would you like to see, or would you like a summary of all customers?","candidates":["customer_balance","overdue_invoices"]},"confidence":0.45}

Example 6 (single product name, no verb): 
Input: "manzana" 
Output: {"intent":"price_lookup","params":{"searchTerm":"apple","searchTerms":["apple"],"supplierName":null},"confidence":0.85} 

Example 7 (multiple products): 
Input: "celery ocean mist and apples price" 
Output: {"intent":"price_lookup","params":{"searchTerm":"celery ocean mist","searchTerms":["celery ocean mist","apple"],"supplierName":null},"confidence":0.92}`;
  }

  return `SECTION 1 — ROLE
You are the intent classifier for HAGO PRODUCE, a fresh produce distribution company in Canada. Your only job is to analyze the user message and return a single JSON object. Nothing else.

SECTION 2 — STRICT OUTPUT RULE
Return ONLY a raw JSON object. No markdown. No explanation. No code blocks. The JSON must be parseable by JSON.parse() with zero modifications.

SECTION 3 — INPUT STRUCTURE
You will receive:
- message: the user's current text
- context: optional object with lastProduct, lastCustomer, lastIntent, language
Use context.lastProduct and context.lastCustomer to resolve pronouns like "it", "that", "them", "the same one".

SECTION 4 — THE 7 QUERY INTENTS
Define each intent with:
- When to use it (semantic trigger, not just keywords)
- Exact param names (these are non-negotiable, handlers depend on them):
  * price_lookup     → searchTerm (string), supplierName (string|null)
  * best_supplier    → searchTerm (string), maxResults (number, default 5)
  * product_info     → productName (string)
  * invoice_status   → invoiceNumber (string|null), customerName (string|null), isLast (boolean)
  * customer_balance → customerName (string|null), queryType ("single_customer"|"global_summary")
  * inventory_summary → category (string|null), searchTerm (string|null)
  * overdue_invoices → customerName (string|null), queryType ("single_customer"|"global_report"), daysOverdue (number|null)
- When NOT to use it (disambiguation rules)

SECTION 5 — DISAMBIGUATION RULES
Include these 4 explicit rules:
5. Fallback de nombre de producto único:
Si el mensaje contiene solo un nombre de producto o una frase corta de producto sin verbo de acción (precio, costo, mostrar, encontrar, listar, etc.), clasifícalo como price_lookup con ese término como searchTerm. No pidas aclaración.
Ejemplos:
  "manzana" → price_lookup, searchTerm: "apple"
  "celery" → price_lookup, searchTerm: "celery"
  "tomate cherry" → price_lookup, searchTerm: "cherry tomato"
6. Múltiples productos en un mensaje:
Si el mensaje contiene múltiples nombres de productos separados por "y", "and", comas o "también"/"also", extrae TODOS los productos y devuelve el intent price_lookup con:
  searchTerm: primer nombre de producto en inglés (string)
  searchTerms: todos los nombres de productos en inglés (string[])
Si solo se encuentra un producto, searchTerms debe ser un array con un elemento: [searchTerm]
1. "how much" / "price" / "cost" = price_lookup
   "who sells" / "best supplier" / "cheapest" = best_supplier
2. List of invoices = invoice_status
   Total debt/balance = customer_balance
3. "overdue"/"past due"/"unpaid"/"late"/"collection" = overdue_invoices
   (these urgency words override invoice_status and customer_balance)
4. Single specific product detail = product_info
   Category or list request = inventory_summary

SECTION 6 — LANGUAGE RULES
- Default language: English (Canadian client, all DB data is in English)
- If user writes in Spanish: detect and respond in Spanish
- Product names in params MUST always be in English regardless of input
  Example: "precio del tomate" → searchTerm must be "tomato" not "tomate"
- Never translate product names before searching the database

SECTION 7 — CLARIFICATION INTENT
Use intent "clarification_needed" when:
- Required parameter cannot be inferred from message or context
- Confidence would be below 0.65
- Two intents have nearly equal confidence
Params for clarification_needed must include:
- "question": exact question to ask user (in their detected language)
- "candidates": array of 1-2 most likely intent names

SECTION 8 — CONCRETE OUTPUT EXAMPLES
Include exactly these 5 examples:

Example 1 (price_lookup, English):

Example 6 (nombre de producto único, sin verbo): 
Input: "manzana" 
Output: {"intent":"price_lookup","params":{"searchTerm":"apple","searchTerms":["apple"],"supplierName":null},"confidence":0.85} 

Example 7 (múltiples productos): 
Input: "precio de apio y manzana" 
Output: {"intent":"price_lookup","params":{"searchTerm":"celery","searchTerms":["celery","apple"],"supplierName":null},"confidence":0.92}
Input: "What's the price of tomato?"
Output: {"intent":"price_lookup","params":{"searchTerm":"tomato","supplierName":null},"confidence":0.97}

Example 2 (price_lookup, context resolution):
Input: "And how much does it cost?"
Context: { "lastProduct": "avocado" }
Output: {"intent":"price_lookup","params":{"searchTerm":"avocado","supplierName":null},"confidence":0.91}

Example 3 (best_supplier, Spanish input → English param):
Input: "¿Quién vende tomate más barato?"
Output: {"intent":"best_supplier","params":{"searchTerm":"tomato","maxResults":5},"confidence":0.95}

Example 4 (invoice_status, isLast):
Input: "Show me the latest invoice for Walmart"
Output: {"intent":"invoice_status","params":{"invoiceNumber":null,"customerName":"Walmart","isLast":true},"confidence":0.96}

Example 5 (clarification_needed):
Input: "Show me the balance"
Output: {"intent":"clarification_needed","params":{"question":"Which customer's balance would you like to see, or would you like a summary of all customers?","candidates":["customer_balance","overdue_invoices"]},"confidence":0.45}`;
}

export async function classifyChatIntentWithOpenAI(
  message: string,
  language: ChatLanguage,
): Promise<DetectedIntent> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  if (!apiKey) {
    return {
      intent: 'clarification_needed',
      confidence: 0.0,
      params: {
        question: language === 'es'
          ? '¿Podrías reformular tu pregunta? Estoy teniendo dificultades técnicas.'
          : 'Could you please rephrase? I am experiencing technical difficulties.',
        candidates: []
      }
    };
  }

  const messages: OpenAIMessage[] = [
    { role: 'system', content: buildIntentClassificationSystemPrompt(language) },
    { role: 'user', content: message },
  ];

  logger.debug('OpenAI intent classification request', {
    model,
    messageLength: message.length,
    language
  });

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
        intent: 'clarification_needed',
        confidence: 0.0,
        params: {
          question: language === 'es'
            ? '¿Podrías reformular tu pregunta? Estoy teniendo dificultades técnicas.'
            : 'Could you please rephrase? I am experiencing technical difficulties.',
          candidates: []
        }
      };
    }

    const data = (await response.json()) as OpenAIResponse;
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return {
        intent: 'clarification_needed',
        confidence: 0.0,
        params: {
          question: language === 'es'
            ? '¿Podrías reformular tu pregunta? Estoy teniendo dificultades técnicas.'
            : 'Could you please rephrase? I am experiencing technical difficulties.',
          candidates: []
        }
      };
    }

    const parsed = JSON.parse(content) as { intent: ChatIntent; params?: Record<string, any> };
    const baseParams = parsed.params ?? { searchTerm: message, language };

    return {
      intent: parsed.intent,
      confidence: 0.9,
      params: { ...baseParams, rawMessage: message },
    };
  } catch (error) {
    logger.error('[CHAT_INTENT_OPENAI_ERROR]', error);
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

  if (intent === 'customer_info') {
    if (!data || !data.found || !data.customers || data.customers.length === 0) {
      return language === 'en'
        ? 'No customer found with that name.'
        : 'No se encontró ningún cliente con ese nombre.';
    }
    
    const customers = data.customers;
    if (customers.length === 1) {
      const c = customers[0];
      const info = [
        `Name: ${c.name}`,
         c.email ? `Email: ${c.email}` : null,
         c.phone ? `Phone: ${c.phone}` : null,
         c.address ? `Address: ${c.address}` : null,
       ].filter(Boolean).join('\n');
      
      return language === 'en'
        ? `Here is the information for ${c.name}:\n${info}`
        : `Aquí está la información de ${c.name}:\n${info}`;
    }

    const names = customers.map((c: any) => c.name).join(', ');
    return language === 'en'
      ? `Found multiple customers: ${names}. Please specify.`
      : `Encontré varios clientes: ${names}. Por favor especifica.`;
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
  if (intent === 'best_supplier') {
    const data = executionResult.data || {};
    
    // Handle multi-result response
    if (data.type === 'best_supplier_multi') {
      const results = data.results as Array<{
        query: string;
        items: Array<{
          rank: number;
          productName: string;
          productNameEs: string | null;
          supplierName: string;
          costPrice: number;
          currency: string;
          effectiveDate: string;
        }>;
      }>;

      const sections: string[] = [];

      for (const result of results) {
        if (result.items.length === 0) {
          const noResult = language === 'es'
            ? '🏆 Sin resultados para ' + result.query
            : '🏆 No results for ' + result.query;
          sections.push(noResult);
          continue;
        }

        const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthsEs = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        const d = new Date(result.items[0].effectiveDate);
        const dateStr = language === 'en'
          ? `${monthsEn[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}, ${d.getFullYear()}`
          : `${String(d.getDate()).padStart(2, '0')} ${monthsEs[d.getMonth()]} ${d.getFullYear()}`;

        const count = result.items.length;
        const header = language === 'es'
          ? '🏆 Mejores precios para ' + result.query + ' — ' + count + ' resultado(s)'
          : '🏆 Best prices for ' + result.query + ' — ' + count + ' result(s)';

        const lines = result.items.map((item) => {
          const displayName = language === 'en'
            ? item.productName
            : (item.productNameEs && item.productNameEs.trim() ? item.productNameEs : item.productName);
          const price = Number(item.costPrice).toFixed(2);
          return `#${item.rank}  ${displayName}  ·  ${item.supplierName}  ·  $${price} ${item.currency}`;
        });

        const footer = language === 'es'
          ? `Precios al ${dateStr} · Ordenado del más barato al más caro`
          : `Prices as of ${dateStr} · Sorted cheapest first`;

        sections.push([header, '', ...lines, '', footer].join('\n'));
      }

      return sections.join('\n\n---\n\n');
    }

    const query = String(data.query || '').trim();
    const items: Array<{
      rank: number;
      productName: string;
      productNameEs?: string | null;
      supplierName: string;
      costPrice: number;
      currency: string;
      effectiveDate: string;
    }> = Array.isArray(data.items) ? data.items : [];
    const suggestions: string[] = Array.isArray(data.suggestions) ? data.suggestions : [];

    if (items.length === 0 && suggestions.length > 0) {
      const alt = suggestions.slice(0, 2).join(', ');
      return language === 'en'
        ? `No prices found for '${query}'. Did you mean: ${alt}?`
        : `No encontré precios para '${query}'. ¿Quisiste decir: ${alt}?`;
    }

    if (items.length === 0) {
      return language === 'en'
        ? `No suppliers found for '${query}' in our current price list.`
        : `No encontré proveedores para '${query}' en nuestra lista de precios actual.`;
    }

    const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthsEs = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const first = items[0];
    const d = new Date(first.effectiveDate);
    const dateStr =
      language === 'en'
        ? `${monthsEn[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}, ${d.getFullYear()}`
        : `${String(d.getDate()).padStart(2, '0')} ${monthsEs[d.getMonth()]} ${d.getFullYear()}`;

    const headerProduct =
      language === 'en'
        ? first.productName
        : (first.productNameEs && first.productNameEs.trim() ? first.productNameEs : first.productName);
    const count = items.length;
    const header =
      language === 'en'
        ? `🏆 Best prices for ${headerProduct} — ${count} supplier(s) found`
        : `🏆 Mejores precios para ${headerProduct} — ${count} proveedor(es)`;

    const lines = items.map((item) => {
      const displayName =
        language === 'en'
          ? item.productName
          : (item.productNameEs && item.productNameEs.trim() ? item.productNameEs : item.productName);
      const price = Number(item.costPrice).toFixed(2);
      return `#${item.rank}  ${displayName}  ·  ${item.supplierName}  ·  $${price} ${item.currency}`;
    });

    const footer =
      language === 'en'
        ? `Prices as of ${dateStr} · Sorted cheapest first`
        : `Precios al ${dateStr} · Ordenado del más barato al más caro`;

    return [header, '', ...lines, footer].join('\n');
  }

  if (intent === 'price_lookup') {
    const data = executionResult.data || {};

    // Handle multi-result response
    if (data.type === 'price_lookup_multi') {
      const results = data.results as Array<{
        query: string;
        items: Array<{
          productName: string;
          nameEs?: string | null;
          supplierName: string;
          costPrice: number;
          currency: string;
          effectiveDate: string;
        }>;
      }>;

      const sections: string[] = [];

      for (const result of results) {
        if (result.items.length === 0) {
          const noResult = language === 'es'
            ? '🔍 Sin resultados para ' + result.query
            : '🔍 No results for ' + result.query;
          sections.push(noResult);
          continue;
        }

        const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthsEs = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        const d = new Date(result.items[0].effectiveDate);
        const dateStr = language === 'en'
          ? `${monthsEn[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}, ${d.getFullYear()}`
          : `${String(d.getDate()).padStart(2, '0')} ${monthsEs[d.getMonth()]} ${d.getFullYear()}`;

        const count = result.items.length;
        const header = language === 'es'
          ? '🔍 Precios para ' + result.query + ' — ' + count + ' resultado(s)'
          : '🔍 Prices for ' + result.query + ' — ' + count + ' result(s)';

        const lines = result.items.map((item, idx) => {
          const displayName = language === 'en'
            ? item.productName
            : (item.nameEs && item.nameEs.trim() ? item.nameEs : item.productName);
          const price = Number(item.costPrice).toFixed(2);
          return `#${idx + 1}  ${displayName}  ·  ${item.supplierName}  ·  $${price} ${item.currency}`;
        });

        const footer = language === 'es'
          ? `Precios al ${dateStr} · Ordenado del más barato al más caro`
          : `Prices as of ${dateStr} · Sorted cheapest first`;

        sections.push([header, '', ...lines, '', footer].join('\n'));
      }

      return sections.join('\n\n---\n\n');
    }

    const query = String(data.query || '').trim();
    const items: Array<{
      productName: string;
      nameEs?: string | null;
      supplierName: string;
      costPrice: number;
      sellPrice?: number | null;
      currency: string;
      effectiveDate: string;
    }> = Array.isArray(data.items) ? data.items : [];
    const suggestions: string[] = Array.isArray(data.suggestions) ? data.suggestions : [];

    if (items.length === 0 && suggestions.length > 0) {
      const alt = suggestions.slice(0, 2).join(', ');
      return language === 'en'
        ? `No prices found for '${query}'. Did you mean: ${alt}?`
        : `No encontré precios para '${query}'. ¿Quisiste decir: ${alt}?`;
    }

    if (items.length === 0) {
      return language === 'en'
        ? `No prices found for '${query}' in our current price list.`
        : `No encontré precios para '${query}' en nuestra lista de precios actual.`;
    }

    const sorted = [...items].sort((a, b) => Number(a.costPrice) - Number(b.costPrice));
    const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthsEs = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const first = sorted[0];
    const d = new Date(first.effectiveDate);
    const dateStr =
      language === 'en'
        ? `${monthsEn[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}, ${d.getFullYear()}`
        : `${String(d.getDate()).padStart(2, '0')} ${monthsEs[d.getMonth()]} ${d.getFullYear()}`;

    const header =
      language === 'en'
        ? `🔍 Prices for ${query} — ${sorted.length} result(s) found`
        : `🔍 Precios para ${query} — ${sorted.length} resultado(s)`;

    const lines = sorted.map((item, idx) => {
      const rank = idx + 1;
      const displayName =
        language === 'en'
          ? item.productName
          : (item.nameEs && item.nameEs.trim() ? item.nameEs : item.productName);
      const price = Number(item.costPrice).toFixed(2);
      return `#${rank}  ${displayName}  ·  ${item.supplierName}  ·  $${price} ${item.currency}`;
    });

    const footer =
      language === 'en'
        ? `Prices as of ${dateStr} · Sorted cheapest first`
        : `Precios al ${dateStr} · Ordenado del más barato al más caro`;

    return [header, '', ...lines, '', footer].join('\n');
  }

  if (intent === 'invoice_status') {
    const data = executionResult.data as any;
    if (data && typeof data === 'object' && data.type) {
      const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthsEs = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      const fmtDate = (iso: string | null, lang: ChatLanguage) => {
        if (!iso) return 'N/A';
        const d = new Date(iso);
        const day = String(d.getDate()).padStart(2, '0');
        const year = d.getFullYear();
        return lang === 'en'
          ? `${monthsEn[d.getMonth()]} ${day}, ${year}`
          : `${day} ${monthsEs[d.getMonth()]} ${year}`;
      };
      if (data.type === 'invoice_status_error') {
        const msg = String(data.message || '').trim();
        return msg
          ? msg
          : language === 'en'
          ? 'Please provide an invoice number or customer name.'
          : 'Por favor proporciona un número de factura o nombre de cliente.';
      }
      if (data.type === 'invoice_status_not_found') {
        const term = String(data.searchTerm || '').trim();
        const sugg = Array.isArray(data.suggestions) ? data.suggestions : [];
        const base =
          language === 'en'
            ? `Invoice not found for '${term}'.`
            : `No encontré facturas para '${term}'.`;
        if (sugg.length > 0) {
          const s = sugg.slice(0, 2).join(', ');
          const tail = language === 'en' ? ` Did you mean: ${s}?` : ` ¿Quisiste decir: ${s}?`;
          return base + tail;
        }
        return base;
      }
      if (data.type === 'invoice_detail') {
        const inv = data.invoice;
        const overdueFlag = inv?.isOverdue ? ' ⚠️' : '';
        const totalStr = inv ? Number(inv.total).toFixed(2) : '0.00';
        const issueStr = fmtDate(inv?.issueDate || null, language);
        const dueStr = fmtDate(inv?.dueDate || null, language);
        const header =
          data.isLast && inv?.customerName
            ? language === 'en'
              ? `📋 Latest invoice for ${inv.customerName}:`
              : `📋 Última factura de ${inv.customerName}:`
            : null;
        const card =
          language === 'en'
            ? [
                `Invoice #${inv.invoiceNumber}`,
                `Customer:  ${inv.customerName}`,
                `Status:    ${inv.statusLabel}${overdueFlag}`,
                `Total:     $${totalStr} ${inv.currency}`,
                `Issued:    ${issueStr}`,
                `Due:       ${dueStr}`,
              ].join('\n')
            : [
                `Factura #${inv.invoiceNumber}`,
                `Cliente:   ${inv.customerName}`,
                `Estado:    ${inv.statusLabel}${overdueFlag}`,
                `Total:     $${totalStr} ${inv.currency}`,
                `Emisión:   ${issueStr}`,
                `Vence:     ${dueStr}`,
              ].join('\n');
        return header ? [header, card].join('\n') : card;
      }
      if (data.type === 'invoice_list') {
        const cust = String(data.customerName || '').trim();
        const invs: Array<any> = Array.isArray(data.invoices) ? data.invoices : [];
        const summary = data.summary || {};
        const header =
          language === 'en'
            ? `📋 Invoices for ${cust} — ${Number(summary.totalInvoices || invs.length)} found`
            : `📋 Facturas de ${cust} — ${Number(summary.totalInvoices || invs.length)} encontradas`;
        const lines = invs.map((inv) => {
          const overdueFlag = inv.isOverdue ? ' ⚠️' : '';
          const totalStr = Number(inv.total).toFixed(2);
          const dueDateStr = inv.dueDate
            ? (() => {
                const d = new Date(inv.dueDate);
                return language === 'en'
                  ? `${monthsEn[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}, ${d.getFullYear()}`
                  : `${String(d.getDate()).padStart(2, '0')} ${monthsEs[d.getMonth()]} ${d.getFullYear()}`;
              })()
            : 'N/A';
          const dueLabel = language === 'en' ? 'Due:' : 'Vence:';
          return `${inv.invoiceNumber}  ·  ${inv.statusLabel}${overdueFlag}  ·  $${totalStr} ${inv.currency}  ·  ${dueLabel} ${dueDateStr}`;
        });
        const totalAmountStr = Number(summary.totalAmount || 0).toFixed(2);
        const footer =
          language === 'en'
            ? [`Total: $${totalAmountStr} ${summary.currency || 'CAD'}  ·`, `${Number(summary.overdueCount || 0)} overdue invoice(s)`].join(
                '\n',
              )
            : [`Total: $${totalAmountStr} ${summary.currency || 'CAD'}  ·`, `${Number(summary.overdueCount || 0)} factura(s) vencida(s)`].join(
                '\n',
              );
        return [header, '', ...lines, '', footer].join('\n');
      }
    }
  }

  if (intent === 'customer_balance') {
    const formatted = formatCustomerBalance(
      executionResult.data,
      language
    );
    if (formatted !== null) return formatted;
  }

  if (intent === 'overdue_invoices') {
    const formatted = formatOverdueInvoices(
      executionResult.data,
      language
    );
    if (formatted !== null) return formatted;
  }

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
    logger.error('[CHAT_OPENAI_ERROR]', error);
    return fallbackFormat(intent, language, executionResult);
  }
}

