import prisma from '@/lib/db';
import { logger } from '@/lib/logger/logger.service';

export type TelegramParseMode = 'Markdown' | 'HTML';

export interface TelegramSendSuccess {
  success: true;
  messageId: string;
  attempts: number;
}

export interface TelegramSendError {
  success: false;
  error: string;
  attempts: number;
}

export type SendMessageResult = TelegramSendSuccess | TelegramSendError;
export type SendDocumentResult = TelegramSendSuccess | TelegramSendError;

const MAX_RETRIES = 3;
const BACKOFF_MS = [1000, 2000, 4000];

function getBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN no configurado');
  }
  return token;
}

async function sleep(ms: number): Promise<void> {
  if (process.env.NODE_ENV === 'test') {
    return;
  }
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendTelegramRequest(
  kind: 'message' | 'document',
  chatId: string,
  execute: () => Promise<string>,
): Promise<TelegramSendSuccess | TelegramSendError> {
  let attempts = 0;
  let lastError: unknown;

  for (let i = 0; i < MAX_RETRIES; i += 1) {
    attempts += 1;
    try {
      logger.info('[TELEGRAM_SEND_ATTEMPT]', {
        kind,
        chatId,
        attempt: attempts,
      });

      const messageId = await execute();

      logger.info('[TELEGRAM_SEND_SUCCESS]', {
        kind,
        chatId,
        attempt: attempts,
        messageId,
      });

      return {
        success: true,
        messageId,
        attempts,
      };
    } catch (error) {
      lastError = error;
      logger.error('[TELEGRAM_SEND_ERROR]', error, {
        kind,
        chatId,
        attempt: attempts,
      });

      if (attempts >= MAX_RETRIES) {
        break;
      }

      const delay = BACKOFF_MS[attempts - 1] ?? BACKOFF_MS[BACKOFF_MS.length - 1];
      await sleep(delay);
    }
  }

  const errorMessage = lastError instanceof Error ? lastError.message : 'Error desconocido enviando mensaje a Telegram';

  return {
    success: false,
    error: errorMessage,
    attempts,
  };
}

export async function sendMessage(
  chatId: string,
  text: string,
  parseMode?: TelegramParseMode,
): Promise<SendMessageResult> {
  let token: string;
  try {
    token = getBotToken();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'TELEGRAM_BOT_TOKEN no configurado';
    return { success: false, error: message, attempts: 0 };
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  return sendTelegramRequest('message', chatId, async () => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode,
      }),
    });

    if (!response.ok) {
      throw new Error(`Telegram sendMessage request failed with status ${response.status}`);
    }

    const data = (await response.json()) as any;
    if (!data.ok || !data.result || typeof data.result.message_id === 'undefined') {
      throw new Error('Telegram sendMessage response inválida');
    }

    return String(data.result.message_id);
  });
}

export async function sendDocument(
  chatId: string,
  fileBuffer: Buffer,
  filename: string,
  caption?: string,
): Promise<SendDocumentResult> {
  let token: string;
  try {
    token = getBotToken();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'TELEGRAM_BOT_TOKEN no configurado';
    return { success: false, error: message, attempts: 0 };
  }

  const url = `https://api.telegram.org/bot${token}/sendDocument`;

  return sendTelegramRequest('document', chatId, async () => {
    const form = new FormData();
    form.append('chat_id', chatId);
    const blob = new Blob([new Uint8Array(fileBuffer)], { type: 'application/pdf' });
    form.append('document', blob, filename);
    if (caption) {
      form.append('caption', caption);
      form.append('parse_mode', 'Markdown');
    }

    const response = await fetch(url, {
      method: 'POST',
      body: form as any,
    });

    if (!response.ok) {
      throw new Error(`Telegram sendDocument request failed with status ${response.status}`);
    }

    const data = (await response.json()) as any;
    if (!data.ok || !data.result || typeof data.result.message_id === 'undefined') {
      throw new Error('Telegram sendDocument response inválida');
    }

    return String(data.result.message_id);
  });
}

export async function sendInvoiceDocument(
  chatId: string,
  invoiceNumber: string,
  pdfBuffer: Buffer,
  customerName: string,
): Promise<SendDocumentResult> {
  const caption = `Factura ${invoiceNumber} para ${customerName}`;
  const filename = `Factura-${invoiceNumber}.pdf`;
  return sendDocument(chatId, pdfBuffer, filename, caption);
}

export async function sendPurchaseOrderDocument(
  chatId: string,
  orderNumber: string,
  pdfBuffer: Buffer,
  supplierName: string,
): Promise<SendDocumentResult> {
  const caption = `Orden de compra ${orderNumber} para ${supplierName}`;
  const filename = `Orden-${orderNumber}.pdf`;
  return sendDocument(chatId, pdfBuffer, filename, caption);
}

export async function sendNotification(
  chatId: string,
  message: string,
): Promise<SendMessageResult> {
  return sendMessage(chatId, message, 'Markdown');
}

export async function linkTelegramChat(customerId: string, chatId: string): Promise<void> {
  await prisma.customer.update({
    where: { id: customerId },
    data: { telegramChatId: chatId },
  });
}

export async function getCustomerChatId(customerId: string): Promise<string | null> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { telegramChatId: true },
  });

  return customer?.telegramChatId ?? null;
}

