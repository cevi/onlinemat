
export interface CartItem {
    __caslSubjectType__ : 'CartItem'
    matId: string
    count: number
}


export interface DetailedCartItem extends Omit<CartItem, '__caslSubjectType__'> {
    __caslSubjectType__ : 'DetailedCartItem'
    name: string
    maxCount: number
}