import { abteilungenCollection, abteilungenMembersCollection } from 'config/firebase/collections';
import { db } from 'config/firebase/firebase';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { AbteilungMember } from 'types/abteilung.type'
import { firestoreOperation } from './firestoreOperation';


export const changeRoleOfMember = async (abteilungId: string, userId: string, role: AbteilungMember['role'] ) => {
    await firestoreOperation(
        () => updateDoc(doc(db, abteilungenCollection, abteilungId, abteilungenMembersCollection, userId), {role}),
    );
}

export const approveMemberRequest =  async (abteilungId: string, userId: string) => {
    await firestoreOperation(
        () => updateDoc(doc(db, abteilungenCollection, abteilungId, abteilungenMembersCollection, userId), { approved: true }),
    );
}

export const removeMember = async (abteilungId: string, userId: string) => {
    await firestoreOperation(
        () => deleteDoc(doc(db, abteilungenCollection, abteilungId, abteilungenMembersCollection, userId)),
    );
}

export const denyMemberRequest = async (abteilungId: string, userId: string) => {
    await removeMember(abteilungId, userId);
}

//user is not allowed to request access again
export const banMember = async (abteilungId: string, userId: string) => {
    await firestoreOperation(
        () => updateDoc(doc(db, abteilungenCollection, abteilungId, abteilungenMembersCollection, userId), { approved: false, banned: true }),
    );
}

export const unBanMember = async (abteilungId: string, userId: string) => {
    await firestoreOperation(
        () => updateDoc(doc(db, abteilungenCollection, abteilungId, abteilungenMembersCollection, userId), { approved: false, banned: false }),
    );
}
