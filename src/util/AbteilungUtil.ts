import { abteilungenCollection } from "config/firebase/collections"
import { firestore } from "config/firebase/firebase"


//check if doc exits by slug, then return id
export const getAbteilungIdBySlugOrId = async (abteilungSlugOrId: string) => {
    if(!abteilungSlugOrId) return undefined;
    const doc = await firestore().collection(abteilungenCollection).where('slug', '==', abteilungSlugOrId).get()

    if(doc.empty) {
        return abteilungSlugOrId;
    }

    return doc.docs[0].id;
}