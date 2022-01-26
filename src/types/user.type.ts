export interface UserData {
    __caslSubjectType__ : 'UserData'
    id: string;
    email: string
    displayName: string
    photoURL: string
    given_name: string,
    family_name: string,
    nickname: string,
    name: string,
    email_verified?: boolean
    user_metadata?: any
    staff?: boolean;
    roles: { [abteilungId: string]: string }
}