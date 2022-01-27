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
}