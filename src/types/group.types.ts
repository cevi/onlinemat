import { Moment } from "moment";

export interface Group {
    __caslSubjectType__ : 'Group'
    id: string
    name: string
    type: 'group' | 'event'
    members: string[]
    createdAt: Date
}