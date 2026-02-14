import { abteilungenCollection } from 'config/firebase/collections'
import { db } from 'config/firebase/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Abteilung } from 'types/abteilung.type';


//check if doc exits by slug, then return id
export const getAbteilungIdBySlugOrId = async (abteilungSlugOrId: string) => {
    if(!abteilungSlugOrId) return undefined;
    const q = query(collection(db, abteilungenCollection), where('slug', '==', abteilungSlugOrId));
    const snapshot = await getDocs(q);

    if(snapshot.empty) {
        return abteilungSlugOrId;
    }

    return snapshot.docs[0].id;
}

export const getGroupName = (groupId: string | undefined, abteilung: Abteilung, defaultValue?: string) => {
    if(!groupId) return 'Unbekannt';
    const group = abteilung.groups[groupId];
    const groupName = group ? group.name : defaultValue ? defaultValue : 'Unbekannt';
    return groupName;
}