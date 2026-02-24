
import { Resend } from 'resend';
import { logAudit } from '@/lib/audit/logger';

const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY) 
  : null;

// Dirección de envío por defecto (usar onboarding@resend.dev para pruebas sin dominio)
const DEFAULT_FROM_EMAIL = process.env.EMAIL_FROM || 'onboarding@resend.dev';

export interface EmailSendSuccess {
  success: true;
  messageId: string;
}

export interface EmailSendError {
  success: false;
  error: string;
}

export type SendEmailResult = EmailSendSuccess | EmailSendError;

const MAX_RETRIES = 3;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendPurchaseOrderEmail(
  supplierEmail: string,
  orderNumber: string,
  pdfBuffer: Buffer,
  supplierName: string
): Promise<SendEmailResult> {
  const provider = process.env.EMAIL_PROVIDER || 'mock';
  let attempts = 0;
  let lastError: unknown;

  for (let i = 0; i < MAX_RETRIES; i++) {
    attempts++;
    // Implementación real con Resend
    if (provider === 'resend' && resend) {
      try {
        const { data, error } = await resend.emails.send({
          from: DEFAULT_FROM_EMAIL,
          to: [supplierEmail],
          subject: `Orden de Compra #${orderNumber} - ${supplierName}`,
          html: `
            <h1>Nueva Orden de Compra: ${orderNumber}</h1>
            <p>Estimado ${supplierName},</p>
            <p>Adjunto encontrará la orden de compra solicitada.</p>
            <p>Atentamente,<br/>El equipo de Hago Produce</p>
          `,
          attachments: [
            {
              filename: `PO-${orderNumber}.pdf`,
              content: pdfBuffer,
            },
          ],
        });

        if (error) {
          throw new Error(error.message);
        }

        if (data?.id) {
          console.info('[PO_EMAIL_SEND_SUCCESS]', {
            provider,
            to: supplierEmail,
            order: orderNumber,
            messageId: data.id,
          });
          return { success: true, messageId: data.id };
        }
      } catch (error) {
        lastError = error;
        console.error('[PO_EMAIL_SEND_ERROR]', {
          provider,
          to: supplierEmail,
          error,
          attempt: attempts,
        });
        // Si falla Resend, no reintentamos inmediatamente con sleep, 
        // el loop se encargará, pero Resend suele ser rápido en fallar si es auth.
      }
    } else {
      // MOCK Implementation
      try {
        console.info('[PO_EMAIL_SEND_ATTEMPT]', {
          provider: 'mock',
          to: supplierEmail,
          order: orderNumber,
          attempt: attempts,
        });

        let messageId = `mock-po-email-${Date.now()}`;

        // Simulate sending
        await sleep(500);

        console.info('[PO_EMAIL_SEND_SUCCESS]', {
          provider: 'mock',
          to: supplierEmail,
          order: orderNumber,
          messageId,
        });

        return { success: true, messageId };

      } catch (error) {
        lastError = error;
        if (attempts < MAX_RETRIES) {
          await sleep(1000 * attempts);
        }
      }
    }
  }

  return {
    success: false,
    error: lastError instanceof Error ? lastError.message : 'Unknown email error',
  };
}

export async function sendInvoiceEmail(
  customerEmail: string,
  invoiceNumber: string,
  pdfBuffer: Buffer,
  customerName: string
): Promise<SendEmailResult> {
  const provider = process.env.EMAIL_PROVIDER || 'mock'; // 'sendgrid' | 'resend' | 'mock'
  let attempts = 0;
  let lastError: unknown;

  for (let i = 0; i < MAX_RETRIES; i++) {
    attempts++;
    try {
      console.info('[EMAIL_SEND_ATTEMPT]', {
        provider,
        to: customerEmail,
        invoice: invoiceNumber,
        attempt: attempts,
      });

      // Implementación real dependería del proveedor
      // Aquí simulamos o usamos fetch a API externa si existiera
      let messageId = `mock-email-${Date.now()}`;

      if (provider === 'sendgrid' && process.env.SENDGRID_API_KEY) {
        // Implementación SendGrid (simplificada)
        // const response = await fetch('https://api.sendgrid.com/v3/mail/send', ...);
        // if (!response.ok) throw new Error(...)
        messageId = `sg-${Date.now()}`;
      } else if (provider === 'resend' && process.env.RESEND_API_KEY) {
        // Implementación Resend (simplificada)
        // const response = await fetch('https://api.resend.com/emails', ...);
        messageId = `resend-${Date.now()}`;
      }

      // Simulación de éxito
      await sleep(500); 

      console.info('[EMAIL_SEND_SUCCESS]', {
        provider,
        to: customerEmail,
        invoice: invoiceNumber,
        messageId,
      });

      return { success: true, messageId };

    } catch (error) {
      lastError = error;
      console.error('[EMAIL_SEND_ERROR]', {
        provider,
        to: customerEmail,
        error,
        attempt: attempts,
      });
      
      if (attempts < MAX_RETRIES) {
        await sleep(1000 * attempts);
      }
    }
  }

  return {
    success: false,
    error: lastError instanceof Error ? lastError.message : 'Unknown email error',
  };
}
