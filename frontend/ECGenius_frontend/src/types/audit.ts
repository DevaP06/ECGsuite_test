export type AuditEventType =
  | 'uploaded'
  | 'analyzed'
  | 'clinicalContext'
  | 'ontologyProcessed'
  | 'reviewRequested'
  | 'reviewCompleted';

export type AuditEventStatus = 'completed' | 'pending';

export interface AuditEvent {
  type: AuditEventType;
  label: string;
  /** ISO timestamp when the event occurred; null when it hasn't happened yet */
  timestamp: string | null;
  status: AuditEventStatus;
  description?: string;
}
