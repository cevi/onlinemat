import {
    abteilungenCollection,
    abteilungenStandortCollection
} from "config/firebase/collections";
import { db } from "config/firebase/firebase";
import { collection, doc, deleteDoc, getDocs, updateDoc, writeBatch, addDoc } from 'firebase/firestore';
import {Standort} from "../types/standort.types";
import { firestoreOperation } from "./firestoreOperation";
import i18n from "config/i18n/i18n";



export const deleteStandort = async (abteilungId: string, standort: Standort) => {
    await firestoreOperation(
        () => deleteDoc(doc(db, abteilungenCollection, abteilungId, abteilungenStandortCollection, standort.id)),
        i18n.t('standort:delete.success', { name: standort.name }),
    );
}

export const editStandort = async (abteilungId: string, standort: Standort) => {
    await firestoreOperation(
        () => updateDoc(doc(db, abteilungenCollection, abteilungId, abteilungenStandortCollection, standort.id), standort),
        i18n.t('standort:edit.success', { name: standort.name }),
    );
}

export const massImportStandort = async (abteilungId: string, standorte: Omit<Standort, 'id' | '__caslSubjectType__'>[]): Promise<Standort[]> => {
    const created: Standort[] = [];
    for (const ort of standorte) {
        const docRef = await addDoc(
            collection(db, abteilungenCollection, abteilungId, abteilungenStandortCollection),
            ort
        );
        created.push({ __caslSubjectType__: 'Standort', id: docRef.id, ...ort } as Standort);
    }
    return created;
}

export const deleteAllStandorte = async (abteilungId: string): Promise<void> => {
    const snapshot = await getDocs(
        collection(db, abteilungenCollection, abteilungId, abteilungenStandortCollection)
    );
    const batch = writeBatch(db);
    snapshot.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
}
