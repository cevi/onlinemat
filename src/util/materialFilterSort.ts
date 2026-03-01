import { Material } from 'types/material.types';
import { getAvailableMatCount } from './MaterialUtil';

export type SortOption =
    | 'name_asc' | 'name_desc'
    | 'comment_asc' | 'comment_desc'
    | 'weight_asc' | 'weight_desc'
    | 'available_asc' | 'available_desc';

export interface MaterialFilterState {
    selectedCategories: string[];
    selectedStandorte: string[];
    showAvailableOnly: boolean;
    sortOption: SortOption | undefined;
}

export const initialFilterState: MaterialFilterState = {
    selectedCategories: [],
    selectedStandorte: [],
    showAvailableOnly: false,
    sortOption: undefined,
};

export const applyFilters = (materials: Material[], state: MaterialFilterState): Material[] => {
    return materials.filter(mat => {
        if (state.selectedCategories.length > 0) {
            const hasUncategorized = state.selectedCategories.includes('__uncategorized__');
            const normalIds = state.selectedCategories.filter(id => id !== '__uncategorized__');
            const hasCats = mat.categorieIds && mat.categorieIds.length > 0;

            const matchesUncategorized = hasUncategorized && !hasCats;
            const matchesNormal = normalIds.length > 0 && hasCats && mat.categorieIds!.some(cId => normalIds.includes(cId));

            if (!matchesUncategorized && !matchesNormal) return false;
        }
        if (state.selectedStandorte.length > 0) {
            if (!mat.standort || !mat.standort.some(sId => state.selectedStandorte.includes(sId))) return false;
        }
        if (state.showAvailableOnly && getAvailableMatCount(mat) <= 0) return false;
        return true;
    });
};

export const sortMaterials = (materials: Material[], sortOption: SortOption | undefined): Material[] => {
    if (!sortOption) return materials;

    const sorted = [...materials];
    switch (sortOption) {
        case 'name_asc':
            return sorted.sort((a, b) => a.name.normalize().localeCompare(b.name.normalize()));
        case 'name_desc':
            return sorted.sort((a, b) => b.name.normalize().localeCompare(a.name.normalize()));
        case 'comment_asc':
            return sorted.sort((a, b) => (a.comment || '').normalize().localeCompare((b.comment || '').normalize()));
        case 'comment_desc':
            return sorted.sort((a, b) => (b.comment || '').normalize().localeCompare((a.comment || '').normalize()));
        case 'weight_asc':
            return sorted.sort((a, b) => (a.weightInKg || 0) - (b.weightInKg || 0));
        case 'weight_desc':
            return sorted.sort((a, b) => (b.weightInKg || 0) - (a.weightInKg || 0));
        case 'available_asc':
            return sorted.sort((a, b) => getAvailableMatCount(a) - getAvailableMatCount(b));
        case 'available_desc':
            return sorted.sort((a, b) => getAvailableMatCount(b) - getAvailableMatCount(a));
        default:
            return sorted;
    }
};

export const applyFilterAndSort = (materials: Material[], state: MaterialFilterState): Material[] => {
    return sortMaterials(applyFilters(materials, state), state.sortOption);
};
