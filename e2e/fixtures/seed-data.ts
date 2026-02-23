import { TEST_USERS } from './test-users';
import { TEST_ABTEILUNG_ID } from '../helpers/constants';

export const SEED_ABTEILUNG = {
    id: TEST_ABTEILUNG_ID,
    name: 'Test Abteilung',
    slug: 'test-abteilung',
    searchVisible: true,
    groups: {},
    email: 'test@test.com',
};

export const SEED_CATEGORIES = [
    { id: 'cat-1', name: 'Zelte' },
    { id: 'cat-2', name: 'Kochen' },
];

export const SEED_STANDORTE = [
    { id: 'ort-1', name: 'Materialraum', street: 'Teststrasse 1', city: 'Teststadt' },
    { id: 'ort-2', name: 'Lager', street: 'Lagerstrasse 2', city: 'Teststadt' },
];

export const SEED_MATERIALS = [
    {
        id: 'mat-1',
        name: 'Blache',
        comment: 'Grosse Blache',
        count: 10,
        consumables: false,
        onlyLendInternal: false,
        categorieIds: ['cat-1'],
        standort: ['ort-1'],
        keywords: ['blache', 'plane'],
        imageUrls: [],
    },
    {
        id: 'mat-2',
        name: 'Kochtopf',
        comment: '20L Kochtopf',
        count: 5,
        consumables: false,
        onlyLendInternal: false,
        categorieIds: ['cat-2'],
        standort: ['ort-2'],
        keywords: ['kochtopf', 'kochen'],
        imageUrls: [],
    },
    {
        id: 'mat-3',
        name: 'Seil 10m',
        comment: '',
        count: 20,
        consumables: true,
        onlyLendInternal: true,
        categorieIds: [],
        standort: ['ort-1'],
        keywords: ['seil'],
        imageUrls: [],
    },
];

export const SEED_MEMBERS = [
    { id: TEST_USERS.admin.uid, role: 'admin', approved: true },
    { id: TEST_USERS.member.uid, role: 'member', approved: true },
    { id: TEST_USERS.guest.uid, role: 'guest', approved: true },
];

export const SEED_USER_DOCS = Object.values(TEST_USERS).map((u) => ({
    id: u.uid,
    email: u.email,
    displayName: u.displayName,
    given_name: u.given_name,
    family_name: u.family_name,
    nickname: u.nickname,
    name: u.name,
    email_verified: u.email_verified,
    staff: u.staff,
    roles: u.roles,
    photoURL: u.photoURL,
}));
