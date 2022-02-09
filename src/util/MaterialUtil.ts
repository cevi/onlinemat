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
    } catch (ex) {
        message.error(`Es ist ein Fehler aufgetreten: ${ex}`)
    }
}

export const editMaterial = async (abteilungId: string, material: Material) => {
    try {
        material.keywords = generateKeywords(material.name)

        await firestore().collection(abteilungenCollection).doc(abteilungId).collection(abteilungenMaterialsCollection).doc(material.id).update(material);
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
    const batch = firestore().batch();
    materials.forEach(mat => {
        const insert = firestore()
        .collection(abteilungenCollection).doc(abteilungId).collection(abteilungenMaterialsCollection)
            .doc();
        batch.set(insert, mat);
    });
    return await batch.commit();
}
