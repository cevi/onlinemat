import { describe, it, expect, vi } from 'vitest';
import { TFunction } from 'i18next';
import { auditEntryMatchesQuery, buildImportAuditDetail, formatAuditValue, getAuditActionColor, getAuditFieldLabel } from '../AuditLogUtil';
import { AuditLogEntry } from 'types/auditLog.types';

vi.mock('config/firebase/firebase', () => ({ db: {} }));

// Minimal translation stub: returns known keys from a lookup, otherwise the key itself (like i18next without resources)
const translations: Record<string, string> = {
  'audit:changes.empty': '(leer)',
  'audit:changes.yes': 'Ja',
  'audit:changes.no': 'Nein',
  'audit:fields.count': 'Anzahl',
  'audit:fields.enabled': 'Aktiv',
  'audit:import.label': 'Excel-Import',
  'audit:import.modeAdd': 'Hinzugefügt',
  'audit:import.modeReplace': 'Ersetzt',
};
const t = ((key: string, opts?: Record<string, unknown>) => {
  if (key === 'audit:import.detail' && opts) {
    return `${opts.mode}: ${opts.materials} Material, ${opts.sammlungen} Sammlungen, ${opts.kategorien} Kategorien, ${opts.standorte} Standorte`;
  }
  return translations[key] ?? key;
}) as unknown as TFunction;

describe('AuditLogUtil', () => {
  describe('getAuditFieldLabel', () => {
    it('translates known fields', () => {
      expect(getAuditFieldLabel('count', t)).toBe('Anzahl');
    });

    it('falls back to the raw field name for unknown fields', () => {
      expect(getAuditFieldLabel('someCustomField', t)).toBe('someCustomField');
    });
  });

  describe('getAuditActionColor', () => {
    it('maps actions to tag colors', () => {
      expect(getAuditActionColor('create')).toBe('green');
      expect(getAuditActionColor('update')).toBe('blue');
      expect(getAuditActionColor('delete')).toBe('red');
    });
  });

  describe('formatAuditValue', () => {
    it('renders empty values', () => {
      expect(formatAuditValue(null, t)).toBe('(leer)');
      expect(formatAuditValue(undefined, t)).toBe('(leer)');
      expect(formatAuditValue('', t)).toBe('(leer)');
      expect(formatAuditValue([], t)).toBe('(leer)');
      expect(formatAuditValue({}, t)).toBe('(leer)');
    });

    it('renders booleans and numbers', () => {
      expect(formatAuditValue(true, t)).toBe('Ja');
      expect(formatAuditValue(false, t)).toBe('Nein');
      expect(formatAuditValue(42, t)).toBe('42');
    });

    it('formats ISO date strings in Swiss format', () => {
      expect(formatAuditValue('2026-07-01', t)).toBe('01.07.2026');
      // midnight local time -> date only
      const midnight = new Date(2026, 6, 1, 0, 0).toISOString();
      expect(formatAuditValue(midnight, t)).toBe('01.07.2026');
      // with time -> date + time
      const afternoon = new Date(2026, 6, 1, 14, 30).toISOString();
      expect(formatAuditValue(afternoon, t)).toBe('01.07.2026 14:30');
    });

    it('leaves normal strings untouched', () => {
      expect(formatAuditValue('Zelt 4x4', t)).toBe('Zelt 4x4');
    });

    it('joins arrays and renders nested objects', () => {
      expect(formatAuditValue(['a', 'b'], t)).toBe('a, b');
      expect(formatAuditValue([{ matId: 'm1', count: 2 }], t)).toBe('{"matId":"m1","count":2}');
      expect(formatAuditValue({ enabled: true, count: 3 }, t)).toBe('Aktiv: Ja, Anzahl: 3');
    });
  });

  describe('auditEntryMatchesQuery', () => {
    const entry: AuditLogEntry = {
      __caslSubjectType__: 'AuditLog',
      id: 'e1',
      entityType: 'material',
      entityId: 'm1',
      entityLabel: 'Zelt',
      action: 'update',
      actorId: 'u1',
      actorName: 'Leo',
      changes: [{ field: 'count', before: 3, after: 5 }],
      detail: 'Bestand angepasst',
      source: 'function',
      visibility: 'matchef',
      timestamp: null,
      expiresAt: {} as any,
    };

    it('matches everything for an empty query', () => {
      expect(auditEntryMatchesQuery(entry, '')).toBe(true);
      expect(auditEntryMatchesQuery(entry, '   ')).toBe(true);
    });

    it('matches label, actor, detail and change fields case-insensitively', () => {
      expect(auditEntryMatchesQuery(entry, 'zelt')).toBe(true);
      expect(auditEntryMatchesQuery(entry, 'LEO')).toBe(true);
      expect(auditEntryMatchesQuery(entry, 'bestand')).toBe(true);
      expect(auditEntryMatchesQuery(entry, 'count')).toBe(true);
    });

    it('rejects non-matching queries', () => {
      expect(auditEntryMatchesQuery(entry, 'kanu')).toBe(false);
    });
  });

  describe('buildImportAuditDetail', () => {
    it('describes an additive import', () => {
      expect(buildImportAuditDetail({ mode: 'add', materials: 10, sammlungen: 1, kategorien: 2, standorte: 0 }, t))
        .toBe('Hinzugefügt: 10 Material, 1 Sammlungen, 2 Kategorien, 0 Standorte');
    });

    it('describes a replacing import', () => {
      expect(buildImportAuditDetail({ mode: 'replace', materials: 3, sammlungen: 0, kategorien: 0, standorte: 1 }, t))
        .toBe('Ersetzt: 3 Material, 0 Sammlungen, 0 Kategorien, 1 Standorte');
    });
  });
});
