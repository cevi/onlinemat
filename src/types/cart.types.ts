
export interface CartItem {
    __caslSubjectType__ : 'CartItem'
    matId: string
    count: number
    sammlungId?: string
}


export interface DetailedCartItem extends Omit<CartItem, '__caslSubjectType__'> {
    __caslSubjectType__ : 'DetailedCartItem'
    name: string
    imageUrls?: string[]
    maxCount: number
    comment?: string
    weightInKg?: number
    standortNames?: string[]
    categorieNames?: string[]
    sammlungName?: string
}