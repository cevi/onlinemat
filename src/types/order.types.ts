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
    comment?: string
    groupId?: string
    customGroupName?: string
}