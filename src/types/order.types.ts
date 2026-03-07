import { Dayjs } from "dayjs";
import { CartItem } from "./cart.types";
import { DamagedMaterial } from "./material.types";


export interface Order {
    __caslSubjectType__ : 'Order'
    id: string
    startDate: Dayjs
    endDate: Dayjs
    items: CartItem[]
    orderer: string
    creationTime: Dayjs
    status: 'pending' | 'created' | 'delivered' | 'completed' | 'rejected'
    history: OrderHistory[]
    comment?: string
    groupId?: string
    customGroupName?: string
    matchefComment?: string
    damagedMaterial?: DamagedMaterial[] | null
    preparedItems?: string[]
    controlledItems?: string[]
    pfand?: number
    price?: number
    pricePaidBy?: string
    pricePaidAt?: Date
    pfandPaidBy?: string
    pfandPaidAt?: Date
    pfandReturnedTo?: string
    pfandReturnedAt?: Date
    pfandReturnedAmount?: number
    rejectionReason?: string
    lastReturnReminderSentAt?: Date
}

export interface OrderHistory {
    color: string | null
    timestamp: Date
    text: string
    type: 'creation' | 'matchefComment' | 'startDate' | 'endDate' | 'delivered' | 'completed' | 'reset' | 'completed-damaged' | 'edited' | 'approved' | 'rejected' | 'pricePaid' | 'pfandPaid' | 'pfandReturned' | null
}