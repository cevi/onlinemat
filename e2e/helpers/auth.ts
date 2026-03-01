import { Page } from '@playwright/test';
import { TestUser, TEST_USERS } from '../fixtures/test-users';
import { AUTH0_CLIENT_ID, AUTH0_DOMAIN } from './constants';

/**
 * Create a minimal JWT that the Firebase Auth emulator will accept for signInWithCustomToken.
 * The emulator does not verify signatures — it extracts the `uid` from the payload.
 */
function createFakeCustomToken(uid: string): string {
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({
        uid,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',
        iss: 'firebase-auth-emulator@example.com',
        sub: 'firebase-auth-emulator@example.com',
        claims: {},
    })).toString('base64url');
    return `${header}.${payload}.fake-signature`;
}

/**
 * Build the Auth0 SPA SDK localStorage cache entry.
 * The SDK stores token data under @@auth0spajs@@::<clientId>::default::openid profile email
 */
function buildAuth0Cache(user: TestUser, firebaseToken: string) {
    const cacheKey = `@@auth0spajs@@::${AUTH0_CLIENT_ID}::default::openid profile email`;

    const idTokenPayload = {
        sub: `auth0|${user.uid}`,
        email: user.email,
        email_verified: user.email_verified,
        given_name: user.given_name,
        family_name: user.family_name,
        name: user.name,
        nickname: user.nickname,
        picture: user.photoURL || '',
        'https://mat.cevi.tools/firebase_token': firebaseToken,
        aud: AUTH0_CLIENT_ID,
        iss: `https://${AUTH0_DOMAIN}/`,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 86400,
        nonce: 'fake-nonce',
    };

    // Build a fake id_token JWT (Auth0 SDK will decode it for user claims)
    const idTokenHeader = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const idTokenBody = Buffer.from(JSON.stringify(idTokenPayload)).toString('base64url');
    const idToken = `${idTokenHeader}.${idTokenBody}.fake-signature`;

    const cacheValue = {
        body: {
            access_token: 'fake-access-token',
            id_token: idToken,
            scope: 'openid profile email',
            expires_in: 86400,
            token_type: 'Bearer',
            decodedToken: {
                encoded: { header: idTokenHeader, payload: idTokenBody, signature: 'fake-signature' },
                header: { alg: 'RS256', typ: 'JWT' },
                claims: {
                    __raw: idToken,
                    ...idTokenPayload,
                },
                user: {
                    sub: `auth0|${user.uid}`,
                    email: user.email,
                    email_verified: user.email_verified,
                    given_name: user.given_name,
                    family_name: user.family_name,
                    name: user.name,
                    nickname: user.nickname,
                    picture: user.photoURL || '',
                    'https://mat.cevi.tools/firebase_token': firebaseToken,
                },
            },
            client_id: AUTH0_CLIENT_ID,
        },
        expiresAt: Math.floor(Date.now() / 1000) + 86400,
    };

    return { cacheKey, cacheValue };
}

/**
 * Set up authentication for a test page.
 * Must be called BEFORE page.goto() for localStorage to be ready.
 */
export async function setupAuth(page: Page, role: keyof typeof TEST_USERS): Promise<void> {
    const user = TEST_USERS[role];
    const firebaseToken = createFakeCustomToken(user.uid);
    const { cacheKey, cacheValue } = buildAuth0Cache(user, firebaseToken);

    // Inject Auth0 cache into localStorage before the page loads
    await page.addInitScript(({ key, value }) => {
        localStorage.setItem(key, JSON.stringify(value));
    }, { key: cacheKey, value: cacheValue });

    // Also set the auth0 "is authenticated" marker
    await page.addInitScript(({ clientId }) => {
        // The SDK also checks for a cache entry keyed by client_id alone
        const markerKey = `@@auth0spajs@@::${clientId}`;
        localStorage.setItem(markerKey, JSON.stringify({
            body: { client_id: clientId, audience: 'default' },
            expiresAt: Math.floor(Date.now() / 1000) + 86400,
        }));
    }, { clientId: AUTH0_CLIENT_ID });

    // Intercept all Auth0 network requests to prevent errors
    await interceptAuth0Routes(page, user, firebaseToken);
}

/**
 * Intercept Auth0 API calls so no real requests are made.
 */
async function interceptAuth0Routes(page: Page, user: TestUser, firebaseToken: string): Promise<void> {
    // Block the Auth0 authorize redirect
    await page.route(`**//${AUTH0_DOMAIN}/authorize**`, (route) => {
        route.fulfill({
            status: 200,
            contentType: 'text/html',
            body: '<html><body>Mocked Auth0</body></html>',
        });
    });

    // Mock the token endpoint
    await page.route(`**//${AUTH0_DOMAIN}/oauth/token`, (route) => {
        const idTokenPayload = {
            sub: `auth0|${user.uid}`,
            email: user.email,
            email_verified: user.email_verified,
            given_name: user.given_name,
            name: user.name,
            nickname: user.nickname,
            'https://mat.cevi.tools/firebase_token': firebaseToken,
        };
        const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
        const payload = Buffer.from(JSON.stringify(idTokenPayload)).toString('base64url');
        const idToken = `${header}.${payload}.fake-signature`;

        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                access_token: 'fake-access-token',
                id_token: idToken,
                scope: 'openid profile email',
                expires_in: 86400,
                token_type: 'Bearer',
            }),
        });
    });

    // Mock OIDC discovery
    await page.route(`**//${AUTH0_DOMAIN}/.well-known/openid-configuration`, (route) => {
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                issuer: `https://${AUTH0_DOMAIN}/`,
                authorization_endpoint: `https://${AUTH0_DOMAIN}/authorize`,
                token_endpoint: `https://${AUTH0_DOMAIN}/oauth/token`,
                userinfo_endpoint: `https://${AUTH0_DOMAIN}/userinfo`,
                jwks_uri: `https://${AUTH0_DOMAIN}/.well-known/jwks.json`,
            }),
        });
    });

    // Mock JWKS
    await page.route(`**//${AUTH0_DOMAIN}/.well-known/jwks.json`, (route) => {
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ keys: [] }),
        });
    });

    // Mock userinfo
    await page.route(`**//${AUTH0_DOMAIN}/userinfo`, (route) => {
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                sub: `auth0|${user.uid}`,
                email: user.email,
                email_verified: user.email_verified,
                given_name: user.given_name,
                family_name: user.family_name,
                name: user.name,
                nickname: user.nickname,
                picture: user.photoURL || '',
                'https://mat.cevi.tools/firebase_token': firebaseToken,
            }),
        });
    });

    // Catch-all for any other Auth0 requests
    await page.route(`**//${AUTH0_DOMAIN}/**`, (route) => {
        route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });
}
