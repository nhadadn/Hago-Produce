import prisma from '@/lib/db';

export type AuditAction = 'create' | 'update' | 'delete' | 'status_change' | string;

export interface AuditLogEntry {
  userId?: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
  ipAddress?: string;
}

export async function logAudit(entry: AuditLogEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        changes: entry.changes ?? undefined,
        ipAddress: entry.ipAddress,
      },
    });
  } catch (error) {
    console.error('[AUDIT_LOG_ERROR]', error);
  }
}

export function diffObjects(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  fields: string[],
): Record<string, { old: unknown; new: unknown }> | undefined {
  const changes: Record<string, { old: unknown; new: unknown }> = {};

  for (const field of fields) {
    const oldValue = before[field];
    const newValue = after[field];

    const isDifferent =
      (oldValue === undefined && newValue !== undefined) ||
      (oldValue !== undefined && newValue === undefined) ||
      oldValue !== newValue;

    if (isDifferent) {
      changes[field] = { old: oldValue, new: newValue };
    }
  }

  return Object.keys(changes).length > 0 ? changes : undefined;
}

