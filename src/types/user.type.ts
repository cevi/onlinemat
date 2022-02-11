export interface UserData {
    __caslSubjectType__ : 'UserData'
    id: string;
    email: string
    displayName: string
    photoURL: string
    given_name: string,
    nickname: string,
    name: string,
    email_verified?: boolean
    user_metadata?: any
    customDisplayName?: string
    defaultAbteilung?: string
    staff?: boolean;
    roles: { [abteilungId: string]: role }
}

export type role = 'pending' | 'guest' | 'member' | 'matchef' | 'admin';