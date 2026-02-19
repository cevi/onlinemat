import {
    abteilungenCollection,
    abteilungenStandortCollection
} from "config/firebase/collections";
import { db } from "config/firebase/firebase";
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
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
