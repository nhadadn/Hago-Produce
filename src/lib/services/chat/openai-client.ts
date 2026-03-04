import { ChatIntent, ChatLanguage, DetectedIntent, QueryExecutionResult } from '@/lib/chat/types';
import { logger } from '@/lib/logger/logger.service';

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
  const base = {
    intent,
    data: executionResult.data,
  };
  const json = JSON.stringify(base, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  );

  if (language === 'en') {
    return `Given the following JSON data, write a short, clear answer for the user in English.\n\n${json}`;
  }

  return `Con los siguientes datos en JSON, escribe una respuesta corta y clara para el usuario en Español.\n\n${json}`;
}

function buildIntentClassificationSystemPrompt(language: ChatLanguage): string {
  if (language === 'en') {
    return [
      'You are an AI assistant for the HAGO PRODUCE ERP system.',
      'Your task is to classify the user intent and extract structured parameters.',
      'Respond with a strict JSON object: { "intent": string, "params": object }.',
      '',
      'INTENT DEFINITIONS:',
      '1. price_lookup: User asks for the price/cost of a product.',
      '   - CRITICAL: Extract ONLY the product name into params.searchTerm.',
      '   - Remove "price of", "how much is", articles (the, a).',
      '   - Example: "price of apple" -> searchTerm: "apple"',
      '',
      '2. best_supplier: User asks for the best/cheapest supplier.',
      '   - Extract product name into params.searchTerm.',
      '',
      '3. invoice_status: User asks for specific invoices, lists, or the last invoice.',
      '   - Distinct from customer_balance (TOTAL debt / AGGREGATE).',
      '   - PARAMS:',
      '     * customerName (string | null): Customer name.',
      '     * invoiceNumber (string | null): Specific invoice number if provided.',
      '     * isLast (boolean): Set to true if user asks for "last", "latest", "newest" invoice.',
      '   - MODES:',
      '     1. Specific Invoice: "status of invoice 1024" -> { "intent": "invoice_status", "params": { "invoiceNumber": "1024" } }',
      '     2. Last Invoice: "latest invoice for Walmart" -> { "intent": "invoice_status", "params": { "customerName": "Walmart", "isLast": true } }',
      '     3. List Invoices: "show me invoices for Walmart" -> { "intent": "invoice_status", "params": { "customerName": "Walmart" } }',
      '',
      '4. customer_balance: User asks for balance, total debt, or "how much they owe" (AGGREGATE).',
      '   - CRITICAL: Distinguish from invoice_status (LIST of invoices) and overdue_invoices (LIST of overdue).',
      '   - If asking for "invoices of X" -> invoice_status. If asking for "balance of X" -> customer_balance.',
      '   - PARAMS:',
      '     * customerName (string | null): Customer name. If asking for "all" or "general" -> null.',
      '     * queryType (string): "single_customer" (if customerName exists) or "global_summary" (if customerName is null).',
      '   - EXAMPLES:',
      '     * "how much does Walmart owe?" -> { "intent": "customer_balance", "params": { "customerName": "Walmart", "queryType": "single_customer" } }',
      '     * "total customer balance" -> { "intent": "customer_balance", "params": { "customerName": null, "queryType": "global_summary" } }',
      '     * "invoices for Walmart" -> { "intent": "invoice_status", "params": { "customerName": "Walmart" } }',
      '     * "how much does Walmart owe in overdue invoices?" -> { "intent": "overdue_invoices" }',
      '',
      '5. product_info: User wants general information, specs, or "what is" a product.',
      '   - Distinct from price_lookup (price) and best_supplier (who sells).',
      '   - PARAMS:',
      '     * productName (string): ONLY the product name. Clean "info about", "details of".',
      '     * NOT SUPPORTED: Category searches (e.g. "vegetables"). Return null for productName.',
      '   - DISAMBIGUATION RULES (Example: "tomato"):',
      '     * "info about tomato" -> { "intent": "product_info", "params": { "productName": "tomato" } }',
      '     * "price of tomato" -> { "intent": "price_lookup", "params": { "searchTerm": "tomato" } } (PRICE wins)',
      '     * "who sells tomato" -> { "intent": "best_supplier", "params": { "searchTerm": "tomato" } } (SUPPLIER wins)',
      '     * "what is broccoli?" -> { "intent": "product_info", "params": { "productName": "broccoli" } }',
      '',
      '6. customer_info: User asks for contact details, address, email, or tax ID of a customer.',
      '   - Distinct from customer_balance (financials) and invoice_status (documents).',
      '   - PARAMS:',
      '     * customerName (string | null): Customer name. Preserve original spelling.',
      '     * customerEmail (string | null): Extract ONLY if email is explicitly mentioned.',
      '     * customerTaxId (string | null): Extract ONLY if tax ID/RFC is explicitly mentioned.',
      '     * searchType (string): "by_name" (default), "by_email", "by_taxid", or "unknown".',
      '   - EXAMPLES:',
      '     * "info for Walmart" -> { "intent": "customer_info", "params": { "customerName": "Walmart", "searchType": "by_name" } }',
      '     * "email of Walmart" -> { "intent": "customer_info", "params": { "customerName": "Walmart", "searchType": "by_name" } }',
      '     * "customer with RFC ABC1234" -> { "intent": "customer_info", "params": { "customerTaxId": "ABC1234", "searchType": "by_taxid" } }',
      '     * "balance of Walmart" -> { "intent": "customer_balance", "params": { "customerName": "Walmart" } } (FINANCIAL signal wins)',
      '',
      '7. overdue_invoices: User asks for OVERDUE, past due, or unpaid invoices (URGENCY/COLLECTION).',
      '   - Distinct from invoice_status (documents) and customer_balance (total balance).',
      '   - KEY SIGNAL: "overdue", "late", "past due", "unpaid". Urgency trumps "invoice" or "balance".',
      '   - PARAMS:',
      '     * customerName (string | null): Customer name. If global report -> null.',
      '     * queryType (string): "single_customer" (if customerName exists) or "global_report" (if null).',
      '     * daysOverdue (number | null): Days overdue if mentioned (e.g. "more than 30 days"). Default null.',
      '   - EXAMPLES:',
      '     * "overdue invoices for Walmart" -> { "intent": "overdue_invoices", "params": { "customerName": "Walmart", "queryType": "single_customer" } }',
      '     * "collection report" -> { "intent": "overdue_invoices", "params": { "customerName": null, "queryType": "global_report" } }',
      '     * "how much does Walmart owe?" -> { "intent": "customer_balance", "params": { "customerName": "Walmart" } } (NO urgency)',
      '     * "show invoices for Walmart" -> { "intent": "invoice_status", "params": { "customerName": "Walmart" } } (NO urgency)',
      '',
      '8. inventory_summary: User asks for a LIST of products, CATALOG, or what is available in a category.',
      '   - Distinct from product_info (details of ONE product) and price_lookup (specific PRICE).',
      '   - KEY SIGNAL: "what do you have", "show me products", "list of [category]", "catalog".',
      '   - PARAMS:',
      '     * category (string | null): If user mentions a category (e.g. "fruits", "vegetables"). Else null.',
      '     * searchTerm (string | null): If user mentions a specific product/term to list. Else null.',
      '   - EXAMPLES:',
      '     * "what fruits do you have?" -> { "intent": "inventory_summary", "params": { "category": "fruits" } }',
      '     * "show me catalog" -> { "intent": "inventory_summary", "params": { "category": null } }',
      '     * "list of tomatoes" -> { "intent": "inventory_summary", "params": { "searchTerm": "tomato" } }',
      '     * "info about tomato" -> { "intent": "product_info", "params": { "productName": "tomato" } } (DETAIL wins)',
      '',
      '9. create_order: User wants to buy, order, or purchase items.',
      '   - Distinct from price_lookup. "I want to buy apples" is create_order.',
      '',
      '10. Other intents: create_purchase_order, create_invoice.',
      '',
      'RULES:',
      '- If params.searchTerm is required, ensure it is clean and contains only the entity name.',
      '- If the user intention is ambiguous between price and order, prefer price_lookup unless "buy/order" is explicit.'
    ].join('\n');
  }

  return [
    'Eres un asistente de IA para el sistema ERP de HAGO PRODUCE.',
    'Tu tarea es clasificar la intención del usuario y extraer parámetros estructurados.',
    'Responde con un objeto JSON estricto: { "intent": string, "params": object }.',
    '',
    'DEFINICIÓN DE INTENCIONES:',
    '1. price_lookup: El usuario pregunta por el precio o costo de un producto.',
    '   - CRÍTICO: Extrae SOLO el nombre del producto en params.searchTerm.',
    '   - Elimina palabras como "precio de", "cuánto cuesta", "a cómo está", artículos (el, la, los).',
    '   - Ejemplo: "¿A cómo está el aguacate?" -> { "intent": "price_lookup", "params": { "searchTerm": "aguacate" } }',
    '   - Ejemplo: "precio de la manzana" -> { "intent": "price_lookup", "params": { "searchTerm": "manzana" } }',
    '',
    '2. best_supplier: El usuario busca el proveedor más barato o mejor.',
    '   - Extrae el producto en params.searchTerm.',
    '',
    '3. invoice_status: El usuario busca una factura específica, una lista o la última factura.',
    '   - Distinto de customer_balance (deuda TOTAL / AGREGADO).',
    '   - PARÁMETROS:',
    '     * customerName (string | null): Nombre del cliente.',
    '     * invoiceNumber (string | null): Número de factura específico.',
    '     * isLast (boolean): true si el usuario pide la "última", "más reciente" o "nueva".',
    '   - MODOS:',
    '     1. Factura Específica: "estado de la factura 1024" -> { "intent": "invoice_status", "params": { "invoiceNumber": "1024" } }',
    '     2. Última Factura: "última factura de Walmart" -> { "intent": "invoice_status", "params": { "customerName": "Walmart", "isLast": true } }',
    '     3. Lista de Facturas: "muéstrame las facturas de Walmart" -> { "intent": "invoice_status", "params": { "customerName": "Walmart" } }',
    '',
    '4. customer_balance: El usuario pregunta por saldo, deuda total o "cuánto debe" (AGREGADO).',
    '   - CRÍTICO: Distinguir de invoice_status (LISTA de facturas) y overdue_invoices (LISTA de vencidas).',
    '   - Si pide "facturas de X" -> invoice_status. Si pide "saldo de X" -> customer_balance.',
    '   - PARÁMETROS:',
    '     * customerName (string | null): Nombre del cliente. Si pregunta por "todos" o "general" -> null.',
    '     * queryType (string): "single_customer" (si hay customerName) o "global_summary" (si customerName es null).',
    '   - EJEMPLOS:',
    '     * "¿cuánto debe Walmart?" -> { "intent": "customer_balance", "params": { "customerName": "Walmart", "queryType": "single_customer" } }',
    '     * "saldo total de clientes" -> { "intent": "customer_balance", "params": { "customerName": null, "queryType": "global_summary" } }',
    '     * "facturas de Walmart" -> { "intent": "invoice_status", "params": { "customerName": "Walmart" } }',
    '     * "¿cuánto debe Walmart en facturas vencidas?" -> { "intent": "overdue_invoices" }',
    '',
    '5. product_info: El usuario quiere información general, ficha técnica o "qué es" un producto.',
    '   - Distinto de price_lookup (precio) y best_supplier (quién vende).',
    '   - PARÁMETROS:',
    '     * productName (string): SOLO el nombre del producto. Limpia "info de", "detalles sobre".',
    '     * NO SOPORTADO: Búsquedas por categoría (ej. "verduras"). Retorna null en productName.',
    '   - REGLAS DE DESAMBIGUACIÓN (Ejemplo: "tomate"):',
    '     * "info del tomate" -> { "intent": "product_info", "params": { "productName": "tomate" } }',
    '     * "precio del tomate" -> { "intent": "price_lookup", "params": { "searchTerm": "tomate" } } (Gana PRECIO)',
    '     * "quién vende tomate" -> { "intent": "best_supplier", "params": { "searchTerm": "tomate" } } (Gana PROVEEDOR)',
    '     * "¿qué es el brócoli?" -> { "intent": "product_info", "params": { "productName": "brócoli" } }',
    '',
    '6. customer_info: El usuario pide datos de contacto, dirección, email o RFC de un cliente.',
    '   - Distinto de customer_balance (financiero) y invoice_status (documentos).',
    '   - PARÁMETROS:',
    '     * customerName (string | null): Nombre del cliente. Preserva la escritura original.',
    '     * customerEmail (string | null): Extraer SOLO si se menciona explícitamente el email.',
    '     * customerTaxId (string | null): Extraer SOLO si se menciona explícitamente RFC/Tax ID.',
    '     * searchType (string): "by_name" (defecto), "by_email", "by_taxid", o "unknown".',
    '   - EJEMPLOS:',
    '     * "info de Walmart" -> { "intent": "customer_info", "params": { "customerName": "Walmart", "searchType": "by_name" } }',
    '     * "email de Walmart" -> { "intent": "customer_info", "params": { "customerName": "Walmart", "searchType": "by_name" } }',
    '     * "cliente con RFC ABC1234" -> { "intent": "customer_info", "params": { "customerTaxId": "ABC1234", "searchType": "by_taxid" } }',
    '     * "saldo de Walmart" -> { "intent": "customer_balance", "params": { "customerName": "Walmart" } } (Gana FINANCIERO)',
    '',
    '7. overdue_invoices: El usuario busca facturas VENCIDAS, atrasadas o necesita COBRANZA (URGENCIA).',
    '   - Distinto de invoice_status (documentos) y customer_balance (saldo total).',
    '   - SEÑAL CLAVE: "vencido", "atrasado", "cobrar", "sin pagar". La urgencia domina sobre "factura" o "saldo".',
    '   - PARÁMETROS:',
    '     * customerName (string | null): Nombre del cliente. Si es reporte global -> null.',
    '     * queryType (string): "single_customer" (si hay customerName) o "global_report" (si es null).',
    '     * daysOverdue (number | null): Días de antigüedad si se menciona (ej. "más de 30 días"). Default null.',
    '   - EJEMPLOS:',
    '     * "facturas vencidas de Walmart" -> { "intent": "overdue_invoices", "params": { "customerName": "Walmart", "queryType": "single_customer" } }',
    '     * "reporte de cobranza" -> { "intent": "overdue_invoices", "params": { "customerName": null, "queryType": "global_report" } }',
    '     * "¿cuánto debe Walmart?" -> { "intent": "customer_balance", "params": { "customerName": "Walmart" } } (SIN urgencia)',
    '     * "ver facturas de Walmart" -> { "intent": "invoice_status", "params": { "customerName": "Walmart" } } (SIN urgencia)',
    '',
    '8. inventory_summary: El usuario pide una LISTA de productos, CATÁLOGO o qué hay en una categoría.',
    '   - Distinto de product_info (detalle de UN producto) y price_lookup (PRECIO específico).',
    '   - SEÑAL CLAVE: "qué tienes", "muéstrame productos", "lista de [categoría]", "catálogo".',
    '   - PARÁMETROS:',
    '     * category (string | null): Si menciona categoría (ej. "frutas", "verduras"). Si no -> null.',
    '     * searchTerm (string | null): Si menciona un producto/término específico para listar. Si no -> null.',
    '   - EJEMPLOS:',
    '     * "¿qué frutas tienes?" -> { "intent": "inventory_summary", "params": { "category": "frutas" } }',
    '     * "ver catálogo completo" -> { "intent": "inventory_summary", "params": { "category": null } }',
    '     * "lista de tomates" -> { "intent": "inventory_summary", "params": { "searchTerm": "tomate" } }',
    '     * "info del tomate" -> { "intent": "product_info", "params": { "productName": "tomate" } } (Gana DETALLE)',
    '',
    '9. create_order: El usuario quiere comprar, pedir o hacer un pedido.',
    '   - Distinto a price_lookup. "Quiero comprar tomate" es create_order.',
    '',
    '10. Otras intenciones: create_purchase_order, create_invoice.',
    '',
    'REGLAS:',
    '- Si se requiere params.searchTerm, asegúrate de que esté limpio y contenga solo el nombre de la entidad.',
    '- Prioriza la extracción precisa de entidades sobre la coincidencia exacta de palabras clave.'
  ].join('\n');
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

