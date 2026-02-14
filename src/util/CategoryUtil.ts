import {abteilungenCategoryCollection, abteilungenCollection} from "config/firebase/collections";
import {db} from "config/firebase/firebase";
import {doc, deleteDoc, updateDoc} from 'firebase/firestore';
import {Categorie} from "../types/categorie.types";
import { firestoreOperation } from "./firestoreOperation";


export const deleteCategory = async (abteilungId: string, category: Categorie) => {
    await firestoreOperation(
        () => deleteDoc(doc(db, abteilungenCollection, abteilungId, abteilungenCategoryCollection, category.id)),
        `Kategorie ${category.name} erfolgreich gelöscht`,
    );
}

export const editCategory = async (abteilungId: string, category: Categorie) => {
    await firestoreOperation(
        () => updateDoc(doc(db, abteilungenCollection, abteilungId, abteilungenCategoryCollection, category.id), category),
        `Kategorie ${category.name} erfolgreich bearbeitet`,
    );
}
