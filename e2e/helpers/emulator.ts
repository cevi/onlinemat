import {
    FIRESTORE_BASE_URL,
    AUTH_BASE_URL,
    PROJECT_ID,
    TEST_ABTEILUNG_ID,
} from './constants';
import {
    SEED_ABTEILUNG,
    SEED_CATEGORIES,
    SEED_STANDORTE,
    SEED_MATERIALS,
    SEED_MEMBERS,
    SEED_USER_DOCS,
} from '../fixtures/seed-data';

/** Convert a plain JS value to Firestore REST API value format. */
function toFirestoreValue(value: unknown): Record<string, unknown> {
    if (value === null || value === undefined) return { nullValue: null };
    if (typeof value === 'string') return { stringValue: value };
    if (typeof value === 'number') {
        if (Number.isInteger(value)) return { integerValue: String(value) };
        return { doubleValue: value };
    }
    if (typeof value === 'boolean') return { booleanValue: value };
    if (Array.isArray(value)) {
        return { arrayValue: { values: value.map(toFirestoreValue) } };
    }
    if (typeof value === 'object') {
        const fields: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
            fields[k] = toFirestoreValue(v);
        }
        return { mapValue: { fields } };
    }
    return { stringValue: String(value) };
}

/** Convert a plain object into a Firestore REST document body. */
function toFirestoreDoc(obj: Record<string, unknown>): { fields: Record<string, unknown> } {
    const fields: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
        if (k === 'id') continue; // id is the document path, not a field
        fields[k] = toFirestoreValue(v);
    }
    return { fields };
}

/** Write a document to the Firestore emulator via REST. */
async function writeDocument(collectionPath: string, docId: string, data: Record<string, unknown>): Promise<void> {
    const url = `${FIRESTORE_BASE_URL}/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collectionPath}?documentId=${docId}`;
    const body = toFirestoreDoc(data);
    const resp = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer owner',
        },
        body: JSON.stringify(body),
    });
    if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`Failed to write ${collectionPath}/${docId}: ${resp.status} ${text}`);
    }
}

/** Clear all Firestore data in the emulator. */
export async function clearFirestoreData(): Promise<void> {
    const url = `${FIRESTORE_BASE_URL}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
    const resp = await fetch(url, { method: 'DELETE' });
    if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`Failed to clear Firestore: ${resp.status} ${text}`);
    }
}

/** Clear all Auth users in the emulator. */
export async function clearAuthUsers(): Promise<void> {
    const url = `${AUTH_BASE_URL}/emulator/v1/projects/${PROJECT_ID}/accounts`;
    const resp = await fetch(url, { method: 'DELETE' });
    if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`Failed to clear Auth users: ${resp.status} ${text}`);
    }
}

/** Clear all emulator data (Firestore + Auth). */
export async function clearEmulatorData(): Promise<void> {
    await Promise.all([clearFirestoreData(), clearAuthUsers()]);
}

/** Check if the emulators are running. */
export async function checkEmulatorsRunning(): Promise<boolean> {
    try {
        const [firestoreResp, authResp] = await Promise.all([
            fetch(`${FIRESTORE_BASE_URL}/`).catch(() => null),
            fetch(`${AUTH_BASE_URL}/`).catch(() => null),
        ]);
        return firestoreResp !== null && authResp !== null;
    } catch {
        return false;
    }
}

/** Seed all test data into the Firestore emulator. */
export async function seedTestData(): Promise<void> {
    // 1. Seed user documents
    for (const user of SEED_USER_DOCS) {
        await writeDocument('users', user.id, user);
    }

    // 2. Seed Abteilung
    await writeDocument('abteilungen', SEED_ABTEILUNG.id, SEED_ABTEILUNG);

    // 3. Seed categories
    for (const cat of SEED_CATEGORIES) {
        await writeDocument(`abteilungen/${TEST_ABTEILUNG_ID}/categories`, cat.id, cat);
    }

    // 4. Seed standorte
    for (const ort of SEED_STANDORTE) {
        await writeDocument(`abteilungen/${TEST_ABTEILUNG_ID}/standorte`, ort.id, ort);
    }

    // 5. Seed materials
    for (const mat of SEED_MATERIALS) {
        await writeDocument(`abteilungen/${TEST_ABTEILUNG_ID}/materials`, mat.id, mat);
    }

    // 6. Seed members
    for (const mem of SEED_MEMBERS) {
        await writeDocument(`abteilungen/${TEST_ABTEILUNG_ID}/members`, mem.id, mem);
    }
}
