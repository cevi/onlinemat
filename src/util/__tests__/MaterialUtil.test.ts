import { describe, it, expect } from 'vitest';
import {
  generateKeywords,
  getAvailableMatCount,
  getAvailableMatCountToEdit,
} from '../MaterialUtil';
import { Material } from 'types/material.types';

const makeMaterial = (overrides: Partial<Material> = {}): Material => ({
  __caslSubjectType__: 'Material',
  id: 'mat1',
  name: 'Zelt',
  comment: '',
  count: 10,
  consumables: false,
  keywords: [],
  onlyLendInternal: false,
  ...overrides,
});

describe('MaterialUtil', () => {
  describe('generateKeywords', () => {
    it('generates prefix substrings for a word', () => {
      expect(generateKeywords('Zelt')).toEqual(['z', 'ze', 'zel', 'zelt']);
    });

    it('converts to lowercase', () => {
      expect(generateKeywords('ABC')).toEqual(['a', 'ab', 'abc']);
    });

    it('handles single character', () => {
      expect(generateKeywords('X')).toEqual(['x']);
    });

    it('handles empty string', () => {
      expect(generateKeywords('')).toEqual([]);
    });

    it('handles string with spaces', () => {
      const result = generateKeywords('Ab Cd');
      expect(result).toEqual(['a', 'ab', 'ab ', 'ab c', 'ab cd']);
    });

    it('handles umlauts', () => {
      const result = generateKeywords('Überzelt');
      expect(result[0]).toBe('ü');
      expect(result.length).toBe(8);
    });
  });

  describe('getAvailableMatCount', () => {
    it('returns 0 for undefined material', () => {
      expect(getAvailableMatCount(undefined)).toBe(0);
    });

    it('returns full count when no damage or loss', () => {
      expect(getAvailableMatCount(makeMaterial({ count: 10 }))).toBe(10);
    });

    it('subtracts damaged items', () => {
      expect(getAvailableMatCount(makeMaterial({ count: 10, damaged: 3 }))).toBe(7);
    });

    it('subtracts lost items', () => {
      expect(getAvailableMatCount(makeMaterial({ count: 10, lost: 2 }))).toBe(8);
    });

    it('subtracts both damaged and lost', () => {
      expect(getAvailableMatCount(makeMaterial({ count: 10, damaged: 3, lost: 2 }))).toBe(5);
    });

    it('can return negative when damage exceeds count', () => {
      expect(getAvailableMatCount(makeMaterial({ count: 2, damaged: 5 }))).toBe(-3);
    });

    it('returns 1 for consumable with no damage', () => {
      expect(getAvailableMatCount(makeMaterial({ consumables: true, count: 99 }))).toBe(1);
    });

    it('returns 0 for consumable that is damaged', () => {
      expect(getAvailableMatCount(makeMaterial({ consumables: true, damaged: 1 }))).toBe(0);
    });

    it('returns 0 for consumable that is lost', () => {
      expect(getAvailableMatCount(makeMaterial({ consumables: true, lost: 1 }))).toBe(0);
    });
  });

  describe('getAvailableMatCountToEdit', () => {
    it('returns zeros for undefined material', () => {
      expect(getAvailableMatCountToEdit(undefined)).toEqual({ damaged: 0, lost: 0 });
    });

    it('returns full count when no existing damage/loss', () => {
      const result = getAvailableMatCountToEdit(makeMaterial({ count: 10 }));
      expect(result).toEqual({ damaged: 10, lost: 10 });
    });

    it('reduces max damaged by existing lost', () => {
      const result = getAvailableMatCountToEdit(makeMaterial({ count: 10, lost: 3 }));
      expect(result.damaged).toBe(7);
    });

    it('reduces max lost by existing damaged', () => {
      const result = getAvailableMatCountToEdit(makeMaterial({ count: 10, damaged: 4 }));
      expect(result.lost).toBe(6);
    });

    it('clamps to 0 when loss exceeds count', () => {
      const result = getAvailableMatCountToEdit(makeMaterial({ count: 2, lost: 5 }));
      expect(result.damaged).toBe(0);
    });

    it('both constrained', () => {
      const result = getAvailableMatCountToEdit(makeMaterial({ count: 5, damaged: 3, lost: 2 }));
      expect(result.damaged).toBe(3); // 5 - 2
      expect(result.lost).toBe(2);    // 5 - 3
    });
  });
});
