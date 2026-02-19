import {abteilungenCategoryCollection, abteilungenCollection} from "config/firebase/collections";
import {db} from "config/firebase/firebase";
import {doc, deleteDoc, updateDoc} from 'firebase/firestore';
import {Categorie} from "../types/categorie.types";
import { firestoreOperation } from "./firestoreOperation";
import i18n from "config/i18n/i18n";


export const deleteCategory = async (abteilungId: string, category: Categorie) => {
    await firestoreOperation(
        () => deleteDoc(doc(db, abteilungenCollection, abteilungId, abteilungenCategoryCollection, category.id)),
        i18n.t('category:delete.success', { name: category.name }),
    );
}

export const editCategory = async (abteilungId: string, category: Categorie) => {
    await firestoreOperation(
        () => updateDoc(doc(db, abteilungenCollection, abteilungId, abteilungenCategoryCollection, category.id), category),
        i18n.t('category:edit.success', { name: category.name }),
    );
}
