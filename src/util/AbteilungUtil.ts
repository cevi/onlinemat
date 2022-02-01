import { abteilungenCollection } from 'config/firebase/collections'
import { firestore } from 'config/firebase/firebase'
import { Abteilung } from 'types/abteilung.type';


//check if doc exits by slug, then return id
export const getAbteilungIdBySlugOrId = async (abteilungSlugOrId: string) => {
    if(!abteilungSlugOrId) return undefined;
    const doc = await firestore().collection(abteilungenCollection).where('slug', '==', abteilungSlugOrId).get()

    if(doc.empty) {
        return abteilungSlugOrId;
    }

    return doc.docs[0].id;
}

export const getGroupName = (groupId: string | undefined, abteilung: Abteilung, defaultValue?: string) => {
    const group = abteilung.groups.find(g => g.id === groupId);
    const groupName = group ? group.name : defaultValue ? defaultValue : 'Unbekannt';
    return groupName;
}