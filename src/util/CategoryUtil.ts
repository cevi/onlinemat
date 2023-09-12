import {message} from "antd";
import {abteilungenCategoryCollection, abteilungenCollection} from "config/firebase/collections";
import {firestore} from "config/firebase/firebase";
import {Categorie} from "../types/categorie.types";


export const deleteCategory = async (abteilungId: string, category: Categorie) => {
    try {
        await firestore().collection(abteilungenCollection).doc(abteilungId).collection(abteilungenCategoryCollection).doc(category.id).delete();
        message.success(`Kategorie ${category.name} erfolgreich gelöscht`);
    } catch (ex) {
        message.error(`Es ist ein Fehler aufgetreten: ${ex}`)
    }
}

export const editCategory = async (abteilungId: string, category: Categorie) => {
    try {
        await firestore().collection(abteilungenCollection).doc(abteilungId).collection(abteilungenCategoryCollection).doc(category.id).update(category);
        message.success(`Kategorie ${category.name} erfolgreich bearbeitet`);
    } catch (ex) {
        message.error(`Es ist ein Fehler aufgetreten: ${ex}`)
    }
}