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
    location?: string
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