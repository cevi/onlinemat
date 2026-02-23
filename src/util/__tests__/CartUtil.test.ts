import { describe, it, expect } from 'vitest';
import {
  getCartName,
  cookieToCart,
  getCartCount,
  removeFromCart,
  changeCountFromCart,
  replaceCart,
  mergeCart,
} from '../CartUtil';
import { CartItem, DetailedCartItem } from 'types/cart.types';

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
});
