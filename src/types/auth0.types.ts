import { Roles } from "./roles.types";

export interface Auth0User {
    'https://mat.cevi.tools/firebase_token': string,
    'https://mat.cevi.tools/roles': {
        [key: string]: Roles
    },
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