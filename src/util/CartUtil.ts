import { CartItem, DetailedCartItem } from "types/cart.types";

export const getCartName = (abteilungId: string)=> {
    return `cart_${abteilungId}`;
}

export const cookieToCart = (cookieRaw: any, abteilungId: string): CartItem[] => {
    let cartItems: CartItem[] = [];
    if(cookieRaw) {
        cartItems = cookieRaw as CartItem[]
    }
    return cartItems;
}

export const getCartCount = (cartItems: CartItem[]) => {
    if(cartItems.length <= 0) return 0;
    let count = 0;
    cartItems.forEach(item => {
        count += item.count;
    })
    return count;
}

export const removeFromCart = (cartItems: DetailedCartItem[], item: DetailedCartItem): CartItem[] => {
    return cartItems.filter(i => i.matId !== item.matId).map(i => ({
        __caslSubjectType__: 'CartItem',
        count: i.count,
        matId: i.matId
    } as CartItem));
}

export const changeCountFromCart = (cartItems: DetailedCartItem[], item: DetailedCartItem, count: number | null): CartItem[] => {
    return cartItems.map(i => ({
        __caslSubjectType__: 'CartItem',
        count: i.matId === item.matId ? count || 0: i.count,
        matId: i.matId
    } as CartItem));
}