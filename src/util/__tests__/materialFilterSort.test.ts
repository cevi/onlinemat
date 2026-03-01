import { describe, it, expect } from 'vitest';
import { Material } from 'types/material.types';
import { applyFilters, sortMaterials, applyFilterAndSort, MaterialFilterState, initialFilterState } from '../materialFilterSort';

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

const materials: Material[] = [
    makeMaterial({ id: '1', name: 'Zelt', categorieIds: ['cat1'], standort: ['s1'], count: 5, weightInKg: 3, comment: 'Blau' }),
    makeMaterial({ id: '2', name: 'Seil', categorieIds: ['cat2'], standort: ['s2'], count: 10, weightInKg: 1, comment: 'Lang' }),
    makeMaterial({ id: '3', name: 'Kompass', categorieIds: ['cat1', 'cat2'], standort: ['s1', 's2'], count: 2, damaged: 2, comment: '' }),
    makeMaterial({ id: '4', name: 'Lampe', count: 8, weightInKg: 0.5, comment: 'Rot' }),
];

describe('materialFilterSort', () => {
    describe('applyFilters', () => {
        it('returns all materials when no filters are active', () => {
            const result = applyFilters(materials, initialFilterState);
            expect(result).toHaveLength(4);
        });

        it('filters by single category', () => {
            const state: MaterialFilterState = { ...initialFilterState, selectedCategories: ['cat1'] };
            const result = applyFilters(materials, state);
            expect(result.map(m => m.id)).toEqual(['1', '3']);
        });

        it('filters by multiple categories (OR logic)', () => {
            const state: MaterialFilterState = { ...initialFilterState, selectedCategories: ['cat1', 'cat2'] };
            const result = applyFilters(materials, state);
            expect(result.map(m => m.id)).toEqual(['1', '2', '3']);
        });

        it('filters by __uncategorized__', () => {
            const state: MaterialFilterState = { ...initialFilterState, selectedCategories: ['__uncategorized__'] };
            const result = applyFilters(materials, state);
            expect(result.map(m => m.id)).toEqual(['4']);
        });

        it('filters by __uncategorized__ combined with a category', () => {
            const state: MaterialFilterState = { ...initialFilterState, selectedCategories: ['cat1', '__uncategorized__'] };
            const result = applyFilters(materials, state);
            expect(result.map(m => m.id)).toEqual(['1', '3', '4']);
        });

        it('filters by standort', () => {
            const state: MaterialFilterState = { ...initialFilterState, selectedStandorte: ['s1'] };
            const result = applyFilters(materials, state);
            expect(result.map(m => m.id)).toEqual(['1', '3']);
        });

        it('filters by multiple standorte (OR logic)', () => {
            const state: MaterialFilterState = { ...initialFilterState, selectedStandorte: ['s1', 's2'] };
            const result = applyFilters(materials, state);
            expect(result.map(m => m.id)).toEqual(['1', '2', '3']);
        });

        it('filters available only', () => {
            const state: MaterialFilterState = { ...initialFilterState, showAvailableOnly: true };
            const result = applyFilters(materials, state);
            // mat3 has count=2, damaged=2, so available=0
            expect(result.map(m => m.id)).toEqual(['1', '2', '4']);
        });

        it('combines category and availability filters (AND logic)', () => {
            const state: MaterialFilterState = { ...initialFilterState, selectedCategories: ['cat1'], showAvailableOnly: true };
            const result = applyFilters(materials, state);
            // cat1 matches 1,3 but 3 has 0 available
            expect(result.map(m => m.id)).toEqual(['1']);
        });

        it('returns empty when no materials match', () => {
            const state: MaterialFilterState = { ...initialFilterState, selectedCategories: ['nonexistent'] };
            const result = applyFilters(materials, state);
            expect(result).toHaveLength(0);
        });
    });

    describe('sortMaterials', () => {
        it('returns same order when no sort option', () => {
            const result = sortMaterials(materials, undefined);
            expect(result.map(m => m.id)).toEqual(['1', '2', '3', '4']);
        });

        it('sorts by name ascending', () => {
            const result = sortMaterials(materials, 'name_asc');
            expect(result.map(m => m.name)).toEqual(['Kompass', 'Lampe', 'Seil', 'Zelt']);
        });

        it('sorts by name descending', () => {
            const result = sortMaterials(materials, 'name_desc');
            expect(result.map(m => m.name)).toEqual(['Zelt', 'Seil', 'Lampe', 'Kompass']);
        });

        it('sorts by comment ascending', () => {
            const result = sortMaterials(materials, 'comment_asc');
            expect(result.map(m => m.comment)).toEqual(['', 'Blau', 'Lang', 'Rot']);
        });

        it('sorts by weight ascending', () => {
            const result = sortMaterials(materials, 'weight_asc');
            expect(result.map(m => m.id)).toEqual(['3', '4', '2', '1']);
        });

        it('sorts by weight descending', () => {
            const result = sortMaterials(materials, 'weight_desc');
            expect(result.map(m => m.id)).toEqual(['1', '2', '4', '3']);
        });

        it('sorts by available ascending', () => {
            const result = sortMaterials(materials, 'available_asc');
            // available: mat3=0, mat1=5, mat4=8, mat2=10
            expect(result.map(m => m.id)).toEqual(['3', '1', '4', '2']);
        });

        it('sorts by available descending', () => {
            const result = sortMaterials(materials, 'available_desc');
            expect(result.map(m => m.id)).toEqual(['2', '4', '1', '3']);
        });

        it('does not mutate original array', () => {
            const original = [...materials];
            sortMaterials(materials, 'name_asc');
            expect(materials.map(m => m.id)).toEqual(original.map(m => m.id));
        });
    });

    describe('applyFilterAndSort', () => {
        it('filters and sorts combined', () => {
            const state: MaterialFilterState = {
                selectedCategories: ['cat1', 'cat2'],
                selectedStandorte: [],
                showAvailableOnly: true,
                sortOption: 'name_desc',
            };
            const result = applyFilterAndSort(materials, state);
            // cat1|cat2 matches 1,2,3; available filters out 3; sort name desc
            expect(result.map(m => m.name)).toEqual(['Zelt', 'Seil']);
        });
    });
});
