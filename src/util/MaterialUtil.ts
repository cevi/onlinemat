import { abteilungenCollection, abteilungenMaterialsCollection } from "config/firebase/collections";
import { db } from "config/firebase/firebase";
import { collection, doc, deleteDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { Material } from "types/material.types";
import { firestoreOperation } from "./firestoreOperation";
import i18n from "config/i18n/i18n";

export const generateKeywords = (text: string) => {
    text = text.toLowerCase();
    const keywords = [];
    for (let i = 1; i < text.length + 1; i++) {
        keywords.push(text.substring(0, i));
    }
    return keywords;
}

export const deleteMaterial = async (abteilungId: string, mat: Material) => {
    await firestoreOperation(
        () => deleteDoc(doc(db, abteilungenCollection, abteilungId, abteilungenMaterialsCollection, mat.id)),
        i18n.t('material:delete.success', { name: mat.name }),
    );
}

export const editMaterial = async (abteilungId: string, material: Material) => {
    material.keywords = generateKeywords(material.name);
    await firestoreOperation(
        () => updateDoc(doc(db, abteilungenCollection, abteilungId, abteilungenMaterialsCollection, material.id), material),
        i18n.t('material:messages.editSuccess', { name: material.name }),
    );
}

export const getAvailableMatCount = (mat: Material | undefined): number => {
    if (!mat) return 0;
    let maxCount = 0;
    if (!!mat.consumables) {
        //max is 1 - lost/damaged
        maxCount = 1 - ((mat.damaged || 0) + (mat.lost || 0))
    } else {
        maxCount = mat.count - ((mat.damaged || 0) + (mat.lost || 0))
    }

    return maxCount;
}

export const getAvailableMatString = (mat: Material | undefined): number | string => {
    if (!mat) return 0;
    let maxCount = 0;
    if (!!mat.consumables) {
        //max is 1 - lost/damaged
        maxCount = 1 - ((mat.damaged || 0) + (mat.lost || 0))
        if (maxCount === 1) {
            return i18n.t('material:util.unlimited');
        }
    } else {
        maxCount = mat.count - ((mat.damaged || 0) + (mat.lost || 0))
    }

    return maxCount;
}

export const getAvailableMatCountToEdit = (mat: Material | undefined): { damaged: number, lost: number } => {
    if (!mat) return {
        damaged: 0,
        lost: 0
    };

    let maxDamged = mat.count - (mat.lost || 0);
    let maxLost = mat.count - (mat.damaged || 0);

    if (maxDamged < 0) {
        maxDamged = 0;
    }
    if (maxLost < 0) {
        maxLost = 0;
    }

    return {
        damaged: maxDamged,
        lost: maxLost
    }
}

export const massImportMaterial = async (abteilungId: string, materials: Material[]): Promise<void> => {
    const batch = writeBatch(db);
    materials.forEach(mat => {
        const insert = doc(collection(db, abteilungenCollection, abteilungId, abteilungenMaterialsCollection));
        batch.set(insert, mat);
    });
    return await batch.commit();
}
