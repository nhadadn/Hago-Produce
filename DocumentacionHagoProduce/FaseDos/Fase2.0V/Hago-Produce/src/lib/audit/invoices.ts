import { InvoiceStatus } from '@prisma/client';
import { logAudit, diffObjects } from '@/lib/audit/logger';

interface InvoiceSnapshot {
  id: string;
  status: InvoiceStatus;
  subtotal: unknown;
  taxRate: unknown;
  taxAmount: unknown;
  total: unknown;
}

export async function logInvoiceCreate(
  userId: string | undefined,
  invoice: InvoiceSnapshot,
): Promise<void> {
  await logAudit({
    userId,
    action: 'create',
    entityType: 'invoice',
    entityId: invoice.id,
    changes: {
      status: { old: undefined, new: invoice.status },
      subtotal: { old: undefined, new: invoice.subtotal },
      taxRate: { old: undefined, new: invoice.taxRate },
      taxAmount: { old: undefined, new: invoice.taxAmount },
      total: { old: undefined, new: invoice.total },
    },
  });
}

export async function logInvoiceUpdate(
  userId: string | undefined,
  before: InvoiceSnapshot,
  after: InvoiceSnapshot,
): Promise<void> {
  const changes = diffObjects(before, after, [
    'status',
    'subtotal',
    'taxRate',
    'taxAmount',
    'total',
  ]);

  if (!changes) return;

  await logAudit({
    userId,
    action: 'update',
    entityType: 'invoice',
    entityId: after.id,
    changes,
  });
}

export async function logInvoiceDelete(
  userId: string | undefined,
  invoice: InvoiceSnapshot,
): Promise<void> {
  await logAudit({
    userId,
    action: 'delete',
    entityType: 'invoice',
    entityId: invoice.id,
    changes: {
      status: { old: invoice.status, new: undefined },
      subtotal: { old: invoice.subtotal, new: undefined },
      taxRate: { old: invoice.taxRate, new: undefined },
      taxAmount: { old: invoice.taxAmount, new: undefined },
      total: { old: invoice.total, new: undefined },
    },
  });
}

export async function logInvoiceStatusChange(
  userId: string | undefined,
  invoiceId: string,
  previousStatus: InvoiceStatus,
  newStatus: InvoiceStatus,
): Promise<void> {
  if (previousStatus === newStatus) return;

  await logAudit({
    userId,
    action: 'status_change',
    entityType: 'invoice',
    entityId: invoiceId,
    changes: {
      status: { old: previousStatus, new: newStatus },
    },
  });
}

