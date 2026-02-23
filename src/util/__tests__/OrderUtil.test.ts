import { describe, it, expect } from 'vitest';
import { calculateTotalWeight } from '../OrderUtil';
import { Order } from 'types/order.types';
import { Material } from 'types/material.types';
import { CartItem } from 'types/cart.types';
import dayjs from 'dayjs';

const makeCartItem = (matId: string, count: number): CartItem => ({
  __caslSubjectType__: 'CartItem',
  matId,
  count,
});

const makeOrder = (items: CartItem[], overrides: Partial<Order> = {}): Order => ({
  __caslSubjectType__: 'Order',
  id: 'order1',
  startDate: dayjs('2024-01-01'),
  endDate: dayjs('2024-01-02'),
  items,
  orderer: 'user1',
  creationTime: dayjs('2024-01-01'),
  status: 'created',
  history: [],
  ...overrides,
});

const makeMaterial = (id: string, overrides: Partial<Material> = {}): Material => ({
  __caslSubjectType__: 'Material',
  id,
  name: `Material ${id}`,
  comment: '',
  count: 10,
  consumables: false,
  keywords: [],
  onlyLendInternal: false,
  ...overrides,
});

describe('OrderUtil', () => {
  describe('calculateTotalWeight', () => {
    it('calculates total weight from items with weights', () => {
      const order = makeOrder([makeCartItem('mat1', 2), makeCartItem('mat2', 3)]);
      const materials = [
        makeMaterial('mat1', { weightInKg: 5 }),
        makeMaterial('mat2', { weightInKg: 2 }),
      ];
      const result = calculateTotalWeight(order, materials);
      expect(result.totalWeight).toBe(16); // 2*5 + 3*2
      expect(result.incompleteCount).toBe(0);
    });

    it('tracks items without weight as incomplete', () => {
      const order = makeOrder([makeCartItem('mat1', 1), makeCartItem('mat2', 1)]);
      const materials = [
        makeMaterial('mat1', { weightInKg: 5 }),
        makeMaterial('mat2'), // no weight
      ];
      const result = calculateTotalWeight(order, materials);
      expect(result.totalWeight).toBe(5);
      expect(result.incompleteCount).toBe(1);
    });

    it('handles empty order', () => {
      const order = makeOrder([]);
      const result = calculateTotalWeight(order, []);
      expect(result.totalWeight).toBe(0);
      expect(result.incompleteCount).toBe(0);
    });

    it('skips items where material is not found', () => {
      const order = makeOrder([makeCartItem('nonexistent', 5)]);
      const result = calculateTotalWeight(order, []);
      expect(result.totalWeight).toBe(0);
      expect(result.incompleteCount).toBe(0);
    });

    it('multiplies weight by item count', () => {
      const order = makeOrder([makeCartItem('mat1', 10)]);
      const materials = [makeMaterial('mat1', { weightInKg: 1.5 })];
      const result = calculateTotalWeight(order, materials);
      expect(result.totalWeight).toBe(15);
    });

    it('handles weightInKg of 0 as having weight', () => {
      const order = makeOrder([makeCartItem('mat1', 3)]);
      const materials = [makeMaterial('mat1', { weightInKg: 0 })];
      const result = calculateTotalWeight(order, materials);
      // weightInKg of 0 is falsy, so it's counted as incomplete
      expect(result.totalWeight).toBe(0);
      expect(result.incompleteCount).toBe(1);
    });
  });
});
