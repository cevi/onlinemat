import { UserData } from "./user.type";

export interface Abteilung {
    id: string
    name: string
    ceviDBId?: string
    logoUrl?: string
}


export interface AbteilungMember {
    userId: string
    role: 'guest' | 'member' | 'matchef' | 'admin'
    approved: boolean
    banned?: boolean
}

export interface AbteilungMemberUserData extends AbteilungMember, UserData {

}