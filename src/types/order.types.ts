import { Moment } from "moment";
import { CartItem } from "./cart.types";


export interface Order {
    __caslSubjectType__ : 'Order'
    id: string
    startDate: Moment
    endDate: Moment
    items: CartItem[]
    orderer: string
    creationTime: Moment
    status: 'created' | 'delivered' | 'completed'
    history: OrderHistory[]
    comment?: string
    groupId?: string
    customGroupName?: string
}

export interface OrderHistory {
    __caslSubjectType__ : 'OrderHistory'
    color: string
    icon: 'time' | undefined
    timestamp: Moment
    text: string
}