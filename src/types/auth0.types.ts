
export interface Auth0User {
    'https://mat.cevi.tools/firebase_token': string,
    given_name: string,
    nickname: string,
    name: string,
    picture: string | undefined,
    locale: string,
    updated_at: Date,
    email: string,
    email_verified: boolean,
    sub: string 
}