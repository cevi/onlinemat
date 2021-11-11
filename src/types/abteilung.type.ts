import { UserData } from "./user.type";

export interface Abteilung {
    __caslSubjectType__ : 'Abteilung'
    id: string
    name: string
    slug: string
    ceviDBId?: string
    logoUrl?: string
}


export interface AbteilungMember {
    __caslSubjectType__ : 'AbteilungMember'
    userId: string
    role: 'guest' | 'member' | 'matchef' | 'admin'
    approved: boolean
    banned?: boolean
}

export interface AbteilungMemberUserData extends Omit<AbteilungMember, "__caslSubjectType__">, Omit<UserData, "__caslSubjectType__"> {
}