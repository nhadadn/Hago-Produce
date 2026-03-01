
import { Resend } from 'resend';
import sgMail from '@sendgrid/mail';
import { logger } from '@/lib/logger/logger.service';
import { logAudit } from '@/lib/audit/logger';

const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY) 
  : null;

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Dirección de envío por defecto (usar onboarding@resend.dev para pruebas sin dominio)
const DEFAULT_FROM_EMAIL = process.env.EMAIL_FROM || 'onboarding@resend.dev';

export interface EmailSendSuccess {
  success: true;
  messageId: string;
  attempts?: number;
}

export interface EmailSendError {
  success: false;
  error: string;
  attempts?: number;
}

export type SendEmailResult = EmailSendSuccess | EmailSendError;

const MAX_RETRIES = 3;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  attachments?: { filename: string; content: Buffer }[]
): Promise<SendEmailResult> {
  const provider = process.env.EMAIL_PROVIDER || 'mock';
  let attempts = 0;
  let lastError: unknown;

  for (let i = 0; i < MAX_RETRIES; i++) {
    attempts++;
    
    if (provider === 'resend' && resend) {
      try {
        const { data, error } = await resend.emails.send({
          from: DEFAULT_FROM_EMAIL,
          to: [to],
          subject,
          html,
          attachments: attachments as any,
        });

        if (error) {
          throw new Error(error.message);
        }

        if (data?.id) {
          logger.info('[EMAIL_SEND_SUCCESS]', {
            provider,
            to,
            subject,
            messageId: data.id,
          });
          return { success: true, messageId: data.id, attempts };
        }
      } catch (error) {
        lastError = error;
        logger.error('[EMAIL_SEND_ERROR]', {
          provider,
          to,
          error,
          attempt: attempts,
        });
      }
    } else if (provider === 'sendgrid' && process.env.SENDGRID_API_KEY) {
      try {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        const msg = {
          to,
          from: DEFAULT_FROM_EMAIL,
          subject,
          html,
          attachments: attachments?.map(a => ({
            content: a.content.toString('base64'),
            filename: a.filename,
            type: 'application/pdf',
            disposition: 'attachment',
          })),
        };

        const [response] = await sgMail.send(msg);
        const messageId = response.headers['x-message-id'] || `sg-${Date.now()}`;

        logger.info('[EMAIL_SEND_SUCCESS]', {
          provider,
          to,
          subject,
          messageId,
        });
        return { success: true, messageId, attempts };
      } catch (error) {
        lastError = error;
        logger.error('[EMAIL_SEND_ERROR]', {
          provider,
          to,
          error,
          attempt: attempts,
        });
      }
    } else {
      // MOCK Implementation
      try {
        logger.info('[EMAIL_SEND_ATTEMPT]', {
          provider: 'mock',
          to,
          subject,
          attempt: attempts,
        });

        const messageId = `mock-email-${Date.now()}`;
        await sleep(500);

        logger.info('[EMAIL_SEND_SUCCESS]', {
          provider: 'mock',
          to,
          subject,
          messageId,
        });

        return { success: true, messageId, attempts };
      } catch (error) {
        lastError = error;
      }
    }

    if (attempts < MAX_RETRIES) {
      await sleep(1000 * attempts);
    }
  }

  return {
    success: false,
    error: lastError instanceof Error ? lastError.message : 'Unknown email error',
    attempts,
  };
}

export async function sendNotificationEmail(
  to: string,
  subject: string,
  text: string
): Promise<SendEmailResult> {
  return sendEmail(to, subject, `<h1>${subject}</h1><p>${text}</p>`);
}

export async function sendPurchaseOrderEmail(
  supplierEmail: string,
  orderNumber: string,
  pdfBuffer: Buffer,
  supplierName: string
): Promise<SendEmailResult> {
  const subject = `Orden de Compra #${orderNumber} - ${supplierName}`;
  const html = `
    <h1>Orden de compra ${orderNumber}</h1>
    <p>Estimado ${supplierName},</p>
    <p>Adjunto encontrará la orden de compra solicitada.</p>
    <p>Atentamente,<br/>El equipo de Hago Produce</p>
  `;
  const attachments = [
    {
      filename: `Orden-${orderNumber}.pdf`,
      content: pdfBuffer,
    },
  ];

  return sendEmail(supplierEmail, subject, html, attachments);
}

export async function sendInvoiceEmail(
  customerEmail: string,
  invoiceNumber: string,
  pdfBuffer: Buffer,
  customerName: string
): Promise<SendEmailResult> {
  const subject = `Factura #${invoiceNumber} - ${customerName}`;
  const html = `
    <h1>Factura ${invoiceNumber}</h1>
    <p>Estimado ${customerName},</p>
    <p>Adjunto encontrará su factura.</p>
    <p>Atentamente,<br/>El equipo de Hago Produce</p>
  `;
  const attachments = [
    {
      filename: `Factura-${invoiceNumber}.pdf`,
      content: pdfBuffer,
    },
  ];

  return sendEmail(customerEmail, subject, html, attachments);
}
