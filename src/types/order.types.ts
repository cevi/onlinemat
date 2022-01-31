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
    status: 'created' | 'delivered' | 'completed' | 'completed-damaged'
    history: OrderHistory[]
    comment?: string
    groupId?: string
    customGroupName?: string
    matchefComment?: string
}

export interface OrderHistory {
    color: string | null
    timestamp: Date
    text: string
    type: 'creation' | 'matchefComment' | 'startDate' | 'endDate' | 'delivered' | 'completed' | 'reset' | 'completed-damaged' | null
}