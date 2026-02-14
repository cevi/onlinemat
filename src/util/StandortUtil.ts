import { message } from "antd";
import {
    abteilungenCollection,
    abteilungenMaterialsCollection,
    abteilungenStandortCollection
} from "config/firebase/collections";
import { db } from "config/firebase/firebase";
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Material } from "types/material.types";
import {Standort} from "../types/standort.types";



export const deleteStandort = async (abteilungId: string, standort: Standort) => {
    try {
        await deleteDoc(doc(db, abteilungenCollection, abteilungId, abteilungenStandortCollection, standort.id));
        message.success(`Standort ${standort.name} erfolgreich gelöscht`);
    } catch (ex) {
        message.error(`Es ist ein Fehler aufgetreten: ${ex}`)
    }
}

export const editStandort = async (abteilungId: string, standort: Standort) => {
    try {
        await updateDoc(doc(db, abteilungenCollection, abteilungId, abteilungenStandortCollection, standort.id), standort);
        message.success(`Standort ${standort.name} erfolgreich bearbeitet`);
    } catch (ex) {
        message.error(`Es ist ein Fehler aufgetreten: ${ex}`)
    }
}