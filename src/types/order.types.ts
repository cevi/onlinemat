import { Moment } from "moment";


export interface Order {
    __caslSubjectType__ : 'Order'
    id: string
    startDate: Moment
    endDate: Moment
}