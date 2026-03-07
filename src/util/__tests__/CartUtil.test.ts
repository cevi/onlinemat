import { describe, it, expect } from 'vitest';
import {
  getCartName,
  cookieToCart,
  getCartCount,
  removeFromCart,
  changeCountFromCart,
  replaceCart,
  mergeCart,
  prepareSammlungForCart,
} from '../CartUtil';
import { CartItem, DetailedCartItem } from 'types/cart.types';
import { Material } from 'types/material.types';
import { SammlungItem } from 'types/sammlung.types';

const makeCartItem = (matId: string, count: number): CartItem => ({
  __caslSubjectType__: 'CartItem',
  matId,
  count,
});

const makeDetailedCartItem = (matId: string, count: number): DetailedCartItem => ({
  __caslSubjectType__: 'DetailedCartItem',
  matId,
  count,
  name: `Material ${matId}`,
  maxCount: 10,
});

describe('CartUtil', () => {
  describe('getCartName', () => {
    it('returns cart key prefixed with abteilung id', () => {
      expect(getCartName('abc123')).toBe('cart_abc123');
    });

    it('handles empty string', () => {
      expect(getCartName('')).toBe('cart_');
    });
  });

  describe('cookieToCart', () => {
    it('returns items when cookie has data', () => {
      const items: CartItem[] = [makeCartItem('mat1', 2)];
      expect(cookieToCart(items, 'abt1')).toEqual(items);
    });

    it('returns empty array when cookie is undefined', () => {
      expect(cookieToCart(undefined, 'abt1')).toEqual([]);
    });
  });

  describe('getCartCount', () => {
    it('returns 0 for empty cart', () => {
      expect(getCartCount([])).toBe(0);
    });

    it('sums counts of all items', () => {
      const items = [makeCartItem('a', 3), makeCartItem('b', 5)];
      expect(getCartCount(items)).toBe(8);
    });

    it('handles single item', () => {
      expect(getCartCount([makeCartItem('a', 7)])).toBe(7);
    });
  });

  describe('removeFromCart', () => {
    it('removes item by matId', () => {
      const items = [makeDetailedCartItem('a', 2), makeDetailedCartItem('b', 3)];
      const result = removeFromCart(items, makeDetailedCartItem('a', 2));
      expect(result).toHaveLength(1);
      expect(result[0].matId).toBe('b');
    });

    it('returns CartItem type (not DetailedCartItem)', () => {
      const items = [makeDetailedCartItem('a', 2)];
      const result = removeFromCart(items, makeDetailedCartItem('a', 2));
      expect(result).toEqual([]);
    });

    it('returns all items if matId not found', () => {
      const items = [makeDetailedCartItem('a', 2)];
      const result = removeFromCart(items, makeDetailedCartItem('nonexistent', 1));
      expect(result).toHaveLength(1);
    });
  });

  describe('changeCountFromCart', () => {
    it('updates count for matching item', () => {
      const items = [makeDetailedCartItem('a', 2), makeDetailedCartItem('b', 3)];
      const result = changeCountFromCart(items, makeDetailedCartItem('a', 2), 5);
      expect(result.find(i => i.matId === 'a')?.count).toBe(5);
      expect(result.find(i => i.matId === 'b')?.count).toBe(3);
    });

    it('sets count to 0 when null is passed', () => {
      const items = [makeDetailedCartItem('a', 2)];
      const result = changeCountFromCart(items, makeDetailedCartItem('a', 2), null);
      expect(result[0].count).toBe(0);
    });
  });

  describe('replaceCart', () => {
    it('maps order items to cart items', () => {
      const items = [makeCartItem('a', 2), makeCartItem('b', 3)];
      const result = replaceCart(items);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ __caslSubjectType__: 'CartItem', matId: 'a', count: 2 });
    });

    it('returns empty array for empty input', () => {
      expect(replaceCart([])).toEqual([]);
    });
  });

  describe('mergeCart', () => {
    it('adds new items to existing cart', () => {
      const existing = [makeCartItem('a', 2)];
      const newItems = [makeCartItem('b', 3)];
      const result = mergeCart(existing, newItems);
      expect(result).toHaveLength(2);
      expect(result.find(i => i.matId === 'b')?.count).toBe(3);
    });

    it('skips duplicate matIds (keeps existing count)', () => {
      const existing = [makeCartItem('a', 2)];
      const newItems = [makeCartItem('a', 5)];
      const result = mergeCart(existing, newItems);
      expect(result).toHaveLength(1);
      expect(result[0].count).toBe(2); // keeps existing, not new
    });

    it('handles empty existing cart', () => {
      const result = mergeCart([], [makeCartItem('a', 1)]);
      expect(result).toHaveLength(1);
    });

    it('handles empty new items', () => {
      const existing = [makeCartItem('a', 2)];
      const result = mergeCart(existing, []);
      expect(result).toHaveLength(1);
    });

    it('does not mutate existing cart', () => {
      const existing = [makeCartItem('a', 2)];
      const copy = [...existing];
      mergeCart(existing, [makeCartItem('b', 3)]);
      expect(existing).toEqual(copy);
    });
  });

  describe('prepareSammlungForCart', () => {
    const makeMaterial = (id: string, name: string, count: number, opts?: Partial<Material>): Material => ({
      __caslSubjectType__: 'Material',
      id,
      name,
      count,
      consumables: false,
      damaged: 0,
      lost: 0,
      keywords: [],
      onlyLendInternal: false,
      ...opts,
    } as Material);

    const materials = [
      makeMaterial('m1', 'Seil', 5),
      makeMaterial('m2', 'Karabiner', 10),
      makeMaterial('m3', 'Helm', 0),
    ];

    it('returns all items as available when stock is sufficient', () => {
      const items: SammlungItem[] = [
        { matId: 'm1', count: 2 },
        { matId: 'm2', count: 3 },
      ];
      const result = prepareSammlungForCart(items, materials, []);
      expect(result.availableItems).toHaveLength(2);
      expect(result.unavailableItems).toHaveLength(0);
      expect(result.availableItems[0].count).toBe(2);
      expect(result.availableItems[1].count).toBe(3);
    });

    it('marks items as unavailable when stock is zero', () => {
      const items: SammlungItem[] = [{ matId: 'm3', count: 1 }];
      const result = prepareSammlungForCart(items, materials, []);
      expect(result.availableItems).toHaveLength(0);
      expect(result.unavailableItems).toHaveLength(1);
      expect(result.unavailableItems[0].name).toBe('Helm');
      expect(result.unavailableItems[0].requested).toBe(1);
      expect(result.unavailableItems[0].available).toBe(0);
    });

    it('reduces available count by existing cart items', () => {
      const items: SammlungItem[] = [{ matId: 'm1', count: 4 }];
      const existingCart: CartItem[] = [makeCartItem('m1', 3)];
      const result = prepareSammlungForCart(items, materials, existingCart);
      expect(result.availableItems).toHaveLength(1);
      expect(result.availableItems[0].count).toBe(2); // 5 total - 3 in cart = 2 remaining
      expect(result.unavailableItems).toHaveLength(1);
      expect(result.unavailableItems[0].requested).toBe(4);
      expect(result.unavailableItems[0].available).toBe(2);
    });

    it('skips materials that no longer exist', () => {
      const items: SammlungItem[] = [{ matId: 'deleted', count: 1 }];
      const result = prepareSammlungForCart(items, materials, []);
      expect(result.availableItems).toHaveLength(0);
      expect(result.unavailableItems).toHaveLength(0);
    });

    it('handles mixed available and unavailable items', () => {
      const items: SammlungItem[] = [
        { matId: 'm1', count: 2 },
        { matId: 'm3', count: 1 },
      ];
      const result = prepareSammlungForCart(items, materials, []);
      expect(result.availableItems).toHaveLength(1);
      expect(result.availableItems[0].matId).toBe('m1');
      expect(result.unavailableItems).toHaveLength(1);
      expect(result.unavailableItems[0].matId).toBe('m3');
    });

    it('handles empty sammlung items', () => {
      const result = prepareSammlungForCart([], materials, []);
      expect(result.availableItems).toHaveLength(0);
      expect(result.unavailableItems).toHaveLength(0);
    });

    it('caps at available count when requesting more than available', () => {
      const items: SammlungItem[] = [{ matId: 'm1', count: 100 }];
      const result = prepareSammlungForCart(items, materials, []);
      expect(result.availableItems).toHaveLength(1);
      expect(result.availableItems[0].count).toBe(5);
      expect(result.unavailableItems).toHaveLength(1);
      expect(result.unavailableItems[0].requested).toBe(100);
      expect(result.unavailableItems[0].available).toBe(5);
    });

    it('accounts for damaged and lost materials', () => {
      const damagedMaterials = [makeMaterial('m1', 'Seil', 5, { damaged: 2, lost: 1 })];
      const items: SammlungItem[] = [{ matId: 'm1', count: 3 }];
      const result = prepareSammlungForCart(items, damagedMaterials, []);
      // available = 5 - 2 - 1 = 2
      expect(result.availableItems).toHaveLength(1);
      expect(result.availableItems[0].count).toBe(2);
      expect(result.unavailableItems).toHaveLength(1);
      expect(result.unavailableItems[0].available).toBe(2);
    });
  });
});
