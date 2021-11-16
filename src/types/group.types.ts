export interface Group {
    __caslSubjectType__ : 'Group'
    id: string
    name: string
    type: 'group' | 'event'
    members: string[]
}