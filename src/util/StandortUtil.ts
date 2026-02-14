import {
    abteilungenCollection,
    abteilungenStandortCollection
} from "config/firebase/collections";
import { db } from "config/firebase/firebase";
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import {Standort} from "../types/standort.types";
import { firestoreOperation } from "./firestoreOperation";



export const deleteStandort = async (abteilungId: string, standort: Standort) => {
    await firestoreOperation(
        () => deleteDoc(doc(db, abteilungenCollection, abteilungId, abteilungenStandortCollection, standort.id)),
        `Standort ${standort.name} erfolgreich gelöscht`,
    );
}

export const editStandort = async (abteilungId: string, standort: Standort) => {
    await firestoreOperation(
        () => updateDoc(doc(db, abteilungenCollection, abteilungId, abteilungenStandortCollection, standort.id), standort),
        `Standort ${standort.name} erfolgreich bearbeitet`,
    );
}
