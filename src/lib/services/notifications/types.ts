export type NotificationTrigger = 'status_change' | 'due_date' | 'overdue';

export type NotificationChannel = 'email' | 'webhook' | 'telegram';

export interface NotificationPayloadBase {
  trigger: NotificationTrigger;
  invoiceId: string;
  customerId: string;
}

export interface StatusChangePayload extends NotificationPayloadBase {
  trigger: 'status_change';
  previousStatus: string;
  newStatus: string;
}

export interface DueDatePayload extends NotificationPayloadBase {
  trigger: 'due_date';
  dueDate: string;
}

export interface OverduePayload extends NotificationPayloadBase {
  trigger: 'overdue';
  dueDate: string;
  daysOverdue: number;
}

export type NotificationPayload =
  | StatusChangePayload
  | DueDatePayload
  | OverduePayload;

export interface NotificationLogEntry {
  id: string;
  trigger: NotificationTrigger;
  channel: NotificationChannel;
  invoiceId: string;
  customerId: string;
  status: 'success' | 'failed';
  attempts: number;
  errorMessage?: string;
  createdAt: Date;
}
