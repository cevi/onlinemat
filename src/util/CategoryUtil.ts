import {abteilungenCategoryCollection, abteilungenCollection} from "config/firebase/collections";
import {db} from "config/firebase/firebase";
import {collection, doc, deleteDoc, getDocs, updateDoc, writeBatch, addDoc} from 'firebase/firestore';
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

export const massImportCategory = async (abteilungId: string, names: string[]): Promise<Categorie[]> => {
    const created: Categorie[] = [];
    for (const name of names) {
        const docRef = await addDoc(
            collection(db, abteilungenCollection, abteilungId, abteilungenCategoryCollection),
            { name } as Omit<Categorie, 'id' | '__caslSubjectType__'>
        );
        created.push({ __caslSubjectType__: 'Categorie', id: docRef.id, name });
    }
    return created;
}

export const deleteAllCategories = async (abteilungId: string): Promise<void> => {
    const snapshot = await getDocs(
        collection(db, abteilungenCollection, abteilungId, abteilungenCategoryCollection)
    );
    const batch = writeBatch(db);
    snapshot.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
}
