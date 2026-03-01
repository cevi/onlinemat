import { abteilungenCollection, abteilungenSammlungCollection } from "config/firebase/collections";
import { db } from "config/firebase/firebase";
import { collection, doc, deleteDoc, getDocs, updateDoc, writeBatch } from 'firebase/firestore';
import { Sammlung } from "types/sammlung.types";
import { firestoreOperation } from "./firestoreOperation";
import i18n from "config/i18n/i18n";


export const deleteSammlung = async (abteilungId: string, sammlung: Sammlung) => {
    await firestoreOperation(
        () => deleteDoc(doc(db, abteilungenCollection, abteilungId, abteilungenSammlungCollection, sammlung.id)),
        i18n.t('sammlung:delete.success', { name: sammlung.name }),
    );
}

export const editSammlung = async (abteilungId: string, sammlung: Sammlung) => {
    const cleanData: Record<string, any> = {};
    for (const [key, value] of Object.entries(sammlung)) {
        if (value !== undefined && key !== '__caslSubjectType__') {
            cleanData[key] = value;
        }
    }
    await firestoreOperation(
        () => updateDoc(doc(db, abteilungenCollection, abteilungId, abteilungenSammlungCollection, sammlung.id), cleanData),
        i18n.t('sammlung:edit.success', { name: sammlung.name }),
    );
}

export const massImportSammlung = async (abteilungId: string, sammlungen: Omit<Sammlung, 'id' | '__caslSubjectType__'>[]): Promise<void> => {
    if (sammlungen.length > 500) {
        throw new Error('Import limit exceeded: maximum 500 Sammlungen per import');
    }
    const batch = writeBatch(db);
    sammlungen.forEach(sammlung => {
        const insert = doc(collection(db, abteilungenCollection, abteilungId, abteilungenSammlungCollection));
        batch.set(insert, sammlung);
    });
    return await batch.commit();
}

export const deleteAllSammlungen = async (abteilungId: string): Promise<void> => {
    const snapshot = await getDocs(
        collection(db, abteilungenCollection, abteilungId, abteilungenSammlungCollection)
    );
    const batch = writeBatch(db);
    snapshot.docs.forEach((d) => {
        batch.delete(d.ref);
    });
    await batch.commit();
}
