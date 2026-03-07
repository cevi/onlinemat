export type MaterialCondition = 'new' | 'good' | 'fair' | 'poor';
export type MaintenanceType = 'repair' | 'control' | 'purchase' | 'other';

export interface MaintenanceHistoryEntry {
    date: string;
    type: MaintenanceType;
    notes: string;
    user?: string;
}

export interface Material {
    __caslSubjectType__ : 'Material'
    id: string
    name: string
    comment: string
    categorieIds?: string[]
    weightInKg?: number
    count: number
    consumables: boolean
    imageUrls?: string[]
    keywords: string[]
    damaged?: number
    lost?: number
    standort?: string[]
    onlyLendInternal: boolean;
    purchaseDate?: string;
    lifespanInYears?: number;
    purchasePrice?: number;
    supplier?: string;
    inventoryNumber?: string;
    brand?: string;
    condition?: MaterialCondition;
    warrantyUntil?: string;
    nextMaintenanceDue?: string;
    storageInstructions?: string;
    maintenanceHistory?: MaintenanceHistoryEntry[];
    lastMaintenanceReminderSentAt?: Date;
}

export interface DamagedMaterial {
    id: string
    type: 'damaged' | 'lost'
    count: number
}

export interface DamagedMaterialDetails extends DamagedMaterial{
    name: string
    imageUrls?: string[]
}