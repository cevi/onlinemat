import { addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { TFunction } from 'i18next';
import dayjs from 'dayjs';
import { db } from 'config/firebase/firebase';
import { abteilungenAuditLogCollection, abteilungenCollection } from 'config/firebase/collections';
import { AUDIT_RETENTION_DAYS, AuditAction, AuditLogEntry } from 'types/auditLog.types';
import { dateFormat, dateFormatWithTime } from './constants';

const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Translated label for a changed field, falling back to the raw field name. */
export const getAuditFieldLabel = (field: string, t: TFunction): string => {
    const key = `audit:fields.${field}`;
    const translated = t(key);
    return translated === key ? field : translated;
};

/** Tag color for an audit action. */
export const getAuditActionColor = (action: AuditAction): string => {
    switch (action) {
        case 'create': return 'green';
        case 'update': return 'blue';
        case 'delete': return 'red';
        default: return 'default';
    }
};

/**
 * Renders a before/after value of an audit change as readable text.
 * Values were normalized server-side (dates are ISO strings, no undefined).
 */
export const formatAuditValue = (value: unknown, t: TFunction): string => {
    if (value === null || value === undefined || value === '') return t('audit:changes.empty');
    if (typeof value === 'boolean') return value ? t('audit:changes.yes') : t('audit:changes.no');
    if (typeof value === 'number') return String(value);
    if (typeof value === 'string') {
        if (ISO_DATE_TIME.test(value)) {
            const parsed = dayjs(value);
            if (parsed.isValid()) {
                // Midnight values are almost always pure dates
                return parsed.hour() === 0 && parsed.minute() === 0
                    ? parsed.format(dateFormat)
                    : parsed.format(dateFormatWithTime);
            }
        }
        if (ISO_DATE.test(value)) {
            const parsed = dayjs(value);
            if (parsed.isValid()) return parsed.format(dateFormat);
        }
        return value;
    }
    if (value instanceof Timestamp) return dayjs(value.toDate()).format(dateFormatWithTime);
    if (Array.isArray(value)) {
        if (value.length === 0) return t('audit:changes.empty');
        return value.map(item => (typeof item === 'object' && item !== null ? JSON.stringify(item) : formatAuditValue(item, t))).join(', ');
    }
    if (typeof value === 'object') {
        const entries = Object.entries(value as Record<string, unknown>);
        if (entries.length === 0) return t('audit:changes.empty');
        return entries.map(([key, val]) => `${getAuditFieldLabel(key, t)}: ${formatAuditValue(val, t)}`).join(', ');
    }
    return String(value);
};

/** Free-text match across the visible fields of an entry. */
export const auditEntryMatchesQuery = (entry: AuditLogEntry, query: string): boolean => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const haystack = [
        entry.entityLabel,
        entry.actorName,
        entry.detail || '',
        entry.entityType,
        ...entry.changes.flatMap(c => [c.field, JSON.stringify(c.before ?? ''), JSON.stringify(c.after ?? '')]),
    ].join(' ').toLowerCase();
    return haystack.includes(q);
};

export interface ImportAuditSummary {
    mode: 'add' | 'replace';
    materials: number;
    sammlungen: number;
    kategorien: number;
    standorte: number;
}

export const buildImportAuditDetail = (summary: ImportAuditSummary, t: TFunction): string => {
    return t('audit:import.detail', {
        mode: summary.mode === 'replace' ? t('audit:import.modeReplace') : t('audit:import.modeAdd'),
        materials: summary.materials,
        sammlungen: summary.sammlungen,
        kategorien: summary.kategorien,
        standorte: summary.standorte,
    });
};

/**
 * Adds a summary entry for an Excel import to the audit trail.
 * The individual created/deleted documents are logged server-side; this entry
 * groups them so the import is recognizable as one action.
 * Never throws – the import itself already succeeded.
 */
export const logImportAuditEntry = async (
    abteilungId: string,
    actor: { id: string; name: string },
    summary: ImportAuditSummary,
    t: TFunction,
): Promise<void> => {
    try {
        await addDoc(collection(db, abteilungenCollection, abteilungId, abteilungenAuditLogCollection), {
            entityType: 'import',
            entityId: 'import',
            entityLabel: t('audit:import.label'),
            action: 'create',
            actorId: actor.id,
            actorName: actor.name,
            changes: [],
            detail: buildImportAuditDetail(summary, t),
            source: 'client',
            visibility: 'matchef',
            timestamp: serverTimestamp(),
            expiresAt: Timestamp.fromMillis(Date.now() + AUDIT_RETENTION_DAYS * 24 * 60 * 60 * 1000),
        });
    } catch (err) {
        console.error('Failed to write import audit entry', err);
    }
};
