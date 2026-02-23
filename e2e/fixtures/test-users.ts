export interface TestUser {
    uid: string;
    email: string;
    displayName: string;
    given_name: string;
    family_name: string;
    name: string;
    nickname: string;
    email_verified: boolean;
    staff: boolean;
    roles: Record<string, string>;
    photoURL: string;
}

export const TEST_USERS: Record<string, TestUser> = {
    admin: {
        uid: 'test-admin-uid',
        email: 'admin@test.com',
        displayName: 'Test Admin',
        given_name: 'Admin',
        family_name: 'Test',
        name: 'Test Admin',
        nickname: 'admin',
        email_verified: true,
        staff: false,
        roles: { 'test-abt-1': 'admin' },
        photoURL: '',
    },
    member: {
        uid: 'test-member-uid',
        email: 'member@test.com',
        displayName: 'Test Member',
        given_name: 'Member',
        family_name: 'Test',
        name: 'Test Member',
        nickname: 'member',
        email_verified: true,
        staff: false,
        roles: { 'test-abt-1': 'member' },
        photoURL: '',
    },
    guest: {
        uid: 'test-guest-uid',
        email: 'guest@test.com',
        displayName: 'Test Guest',
        given_name: 'Guest',
        family_name: 'Test',
        name: 'Test Guest',
        nickname: 'guest',
        email_verified: true,
        staff: false,
        roles: { 'test-abt-1': 'guest' },
        photoURL: '',
    },
    staff: {
        uid: 'test-staff-uid',
        email: 'staff@test.com',
        displayName: 'Test Staff',
        given_name: 'Staff',
        family_name: 'Test',
        name: 'Test Staff',
        nickname: 'staff',
        email_verified: true,
        staff: true,
        roles: {},
        photoURL: '',
    },
};
