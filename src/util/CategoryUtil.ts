import {message} from "antd";
import {abteilungenCategoryCollection, abteilungenCollection} from "config/firebase/collections";
import {db} from "config/firebase/firebase";
import {doc, deleteDoc, updateDoc} from 'firebase/firestore';
import {Categorie} from "../types/categorie.types";


export const deleteCategory = async (abteilungId: string, category: Categorie) => {
    try {
        await deleteDoc(doc(db, abteilungenCollection, abteilungId, abteilungenCategoryCollection, category.id));
        message.success(`Kategorie ${category.name} erfolgreich gelöscht`);
    } catch (ex) {
        message.error(`Es ist ein Fehler aufgetreten: ${ex}`)
    }
}

export const editCategory = async (abteilungId: string, category: Categorie) => {
    try {
        await updateDoc(doc(db, abteilungenCollection, abteilungId, abteilungenCategoryCollection, category.id), category);
        message.success(`Kategorie ${category.name} erfolgreich bearbeitet`);
    } catch (ex) {
        message.error(`Es ist ein Fehler aufgetreten: ${ex}`)
    }
}