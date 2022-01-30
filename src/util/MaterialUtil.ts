import { message } from "antd";
import { abteilungenCollection, abteilungenMaterialsCollection } from "config/firebase/collections";
import { firestore } from "config/firebase/firebase";
import { Material } from "types/material.types";

export const dateFormat = 'DD.MM.YYYY';
export const dateFormatWithTime = 'DD.MM.YYYY HH:mm';

export const generateKeywords = (text: string) => {
    text = text.toLowerCase();
    const keywords = [];
    for (let i = 1; i < text.length + 1; i++) {
        keywords.push(text.substring(0, i));
       }
    return keywords;
}

export const deleteMaterial = async (abteilungId: string, mat: Material) => {
    try {
        await firestore().collection(abteilungenCollection).doc(abteilungId).collection(abteilungenMaterialsCollection).doc(mat.id).delete();
        message.success(`Material ${mat.name} erfolgreich gelöscht`);
    } catch(ex) {
        message.error(`Es ist ein Fehler aufgetreten: ${ex}`)
    }
}