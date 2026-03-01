import { CartItem, DetailedCartItem } from "types/cart.types";
import { Material } from "types/material.types";
import { SammlungItem } from "types/sammlung.types";
import { getAvailableMatCount } from "./MaterialUtil";

export interface UnavailableItem {
    matId: string;
    name: string;
    requested: number;
    available: number;
}

export interface PrepareSammlungResult {
    availableItems: CartItem[];
    unavailableItems: UnavailableItem[];
}

export const prepareSammlungForCart = (
    sammlungItems: SammlungItem[],
    allMaterials: Material[],
    existingCart: CartItem[],
): PrepareSammlungResult => {
    const availableItems: CartItem[] = [];
    const unavailableItems: UnavailableItem[] = [];

    for (const item of sammlungItems) {
        const mat = allMaterials.find(m => m.id === item.matId);
        if (!mat) continue;

        const totalAvailable = getAvailableMatCount(mat);
        const alreadyInCart = existingCart.find(c => c.matId === item.matId)?.count || 0;
        const remaining = Math.max(0, totalAvailable - alreadyInCart);
        const toAdd = Math.min(item.count, remaining);

        if (toAdd < item.count) {
            unavailableItems.push({
                matId: item.matId,
                name: mat.name,
                requested: item.count,
                available: remaining,
            });
        }

        if (toAdd > 0) {
            availableItems.push({
                __caslSubjectType__: 'CartItem',
                matId: item.matId,
                count: toAdd,
            });
        }
    }

    return { availableItems, unavailableItems };
};

export const getCartName = (abteilungId: string)=> {
    return `cart_${abteilungId}`;
}

export const cookieToCart = (cookieRaw: CartItem[] | undefined, abteilungId: string): CartItem[] => {
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

export const replaceCart = (orderItems: CartItem[]): CartItem[] => {
    return orderItems.map(item => ({
        __caslSubjectType__: 'CartItem' as const,
        matId: item.matId,
        count: item.count,
    }));
};

export const mergeCart = (existingCart: CartItem[], orderItems: CartItem[]): CartItem[] => {
    const merged = [...existingCart];
    orderItems.forEach(orderItem => {
        if (!merged.find(ci => ci.matId === orderItem.matId)) {
            merged.push({
                __caslSubjectType__: 'CartItem' as const,
                matId: orderItem.matId,
                count: orderItem.count,
            });
        }
    });
    return merged;
};