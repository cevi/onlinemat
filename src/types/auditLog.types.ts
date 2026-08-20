import { Timestamp } from 'firebase/firestore';

export type AuditEntityType =
    | 'material'
    | 'category'
    | 'standort'
    | 'sammlung'
    | 'member'
    | 'abteilung'
    | 'order'
    | 'invitation'
    | 'import'
    | 'export';

export type AuditAction = 'create' | 'update' | 'delete';
export type AuditVisibility = 'admin' | 'matchef';
export type AuditSource = 'client' | 'function';

export const AUDIT_ENTITY_TYPES: AuditEntityType[] = [
    'material',
    'category',
    'standort',
    'sammlung',
    'order',
    'import',
    'export',
    'member',
    'invitation',
    'abteilung',
];

/** Entity types a matchef may see; everything else is admin/staff only. */
export const MATCHEF_VISIBLE_ENTITY_TYPES: AuditEntityType[] = ['material', 'category', 'standort', 'sammlung', 'order', 'import', 'export'];

/** Retention of audit entries (enforced by a Firestore TTL policy on `expiresAt`). */
export const AUDIT_RETENTION_DAYS = 365;

export interface AuditChange {
    field: string;
    before: unknown;
    after: unknown;
}

export interface AuditLogEntry {
    __caslSubjectType__: 'AuditLog';
    id: string;
    entityType: AuditEntityType;
    entityId: string;
    entityLabel: string;
    action: AuditAction;
    actorId: string;
    actorName: string;
    changes: AuditChange[];
    detail?: string | null;
    source: AuditSource;
    visibility: AuditVisibility;
    /** null while the server timestamp is still pending (local writes). */
    timestamp: Timestamp | null;
    expiresAt: Timestamp;
}
