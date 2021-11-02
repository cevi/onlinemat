export interface Material {
    id: string
    name: string
    comment: string
    categoryIds?: string[]
    weightInKg?: number
    count: number
    consumables: boolean
}