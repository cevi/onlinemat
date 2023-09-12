import { message } from "antd";
import {
    abteilungenCollection,
    abteilungenMaterialsCollection,
    abteilungenStandortCollection
} from "config/firebase/collections";
import { firestore } from "config/firebase/firebase";
import { Material } from "types/material.types";
import {Standort} from "../types/standort.types";



export const deleteStandort = async (abteilungId: string, standort: Standort) => {
    try {
        await firestore().collection(abteilungenCollection).doc(abteilungId).collection(abteilungenStandortCollection).doc(standort.id).delete();
        message.success(`Standort ${standort.name} erfolgreich gelöscht`);
    } catch (ex) {
        message.error(`Es ist ein Fehler aufgetreten: ${ex}`)
    }
}

export const editStandort = async (abteilungId: string, standort: Standort) => {
    try {
        await firestore().collection(abteilungenCollection).doc(abteilungId).collection(abteilungenStandortCollection).doc(standort.id).update(standort);
        message.success(`Standort ${standort.name} erfolgreich bearbeitet`);
    } catch (ex) {
        message.error(`Es ist ein Fehler aufgetreten: ${ex}`)
    }
}