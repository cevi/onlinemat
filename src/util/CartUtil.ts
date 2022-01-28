import { CartItem } from "types/cart.types";

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