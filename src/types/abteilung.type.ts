export interface Abteilung {
    id: string
    name: string
    ceviDBId?: string
    logoUrl?: string
}


export interface AbteilungMember {
    userId: string
    role: 'guest' | 'member' | 'matchef' | 'admin'
}