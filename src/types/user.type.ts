export interface UserData {
  __caslSubjectType__: "UserData";
  id: string;
  email: string;
  displayName: string;
  photoURL: string;
  given_name: string;
  family_name: string;
  nickname: string;
  name: string;
  email_verified?: boolean;
  user_metadata?: Record<string, unknown>;
  staff?: boolean;
  defaultAbteilung?: string;
  roles: { [abteilungId: string]: role };
}

export interface UserDataUpdate {
  email: string;
  displayName: string;
  photoURL: string;
  given_name: string;
  family_name: string;
  nickname: string;
  name: string;
  defaultAbteilung?: string;
}

export type role = "pending" | "guest" | "member" | "matchef" | "admin";

export interface AbteilungMember {
  userId: string;
  role: role;
  approved: boolean;
}
