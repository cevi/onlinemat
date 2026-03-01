import { abteilungenCollection, abteilungenSammlungCollection } from "config/firebase/collections";
import { db } from "config/firebase/firebase";
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
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
