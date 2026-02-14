import { message } from "antd";
import { abteilungenCollection, abteilungenMaterialsCollection } from "config/firebase/collections";
import { db } from "config/firebase/firebase";
import { collection, doc, deleteDoc, updateDoc, writeBatch } from 'firebase/firestore';
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
        await deleteDoc(doc(db, abteilungenCollection, abteilungId, abteilungenMaterialsCollection, mat.id));
        message.success(`Material ${mat.name} erfolgreich gelöscht`);
    } catch (ex) {
        message.error(`Es ist ein Fehler aufgetreten: ${ex}`)
    }
}

export const editMaterial = async (abteilungId: string, material: Material) => {
    try {
        material.keywords = generateKeywords(material.name)

        await updateDoc(doc(db, abteilungenCollection, abteilungId, abteilungenMaterialsCollection, material.id), material);
        message.success(`Material ${material.name} erfolgreich bearbeitet`);
    } catch (ex) {
        message.error(`Es ist ein Fehler aufgetreten: ${ex}`)
    }

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
            return 'unbegrenzt';
        }
    } else {
        maxCount = mat.count - ((mat.damaged || 0) + (mat.lost || 0))
    }

    return maxCount;
}

export const getAvailableMatCountToEdit = (mat: Material | undefined): { damged: number, lost: number } => {
    if (!mat) return {
        damged: 0,
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
        damged: maxDamged,
        lost: maxLost
    }
}

export const massImportMaterial = async (abteilungId: string, materials: Material[]): Promise<void> => {
    if (materials.length > 500) {
        throw new Error('Import limit exceeded: maximum 500 materials per import');
    }
    const batch = writeBatch(db);
    materials.forEach(mat => {
        const insert = doc(collection(db, abteilungenCollection, abteilungId, abteilungenMaterialsCollection));
        batch.set(insert, mat);
    });
    return await batch.commit();
}
