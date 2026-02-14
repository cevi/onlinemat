import { message } from 'antd';
import { abteilungenCollection, abteilungenMembersCollection } from 'config/firebase/collections';
import { db } from 'config/firebase/firebase';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { AbteilungMember } from 'types/abteilung.type'


export const changeRoleOfMember = async (abteilungId: string, userId: string, role: AbteilungMember['role'] ) => {
    try {
        await updateDoc(doc(db, abteilungenCollection, abteilungId, abteilungenMembersCollection, userId), {role});
    } catch(err) {
        message.error(`Es ist ein Fehler aufgetreten ${err}`)
        console.error('Es ist ein Fehler aufgetreten', err)
    }
}

export const approveMemberRequest =  async (abteilungId: string, userId: string) => {
    try {
        await updateDoc(doc(db, abteilungenCollection, abteilungId, abteilungenMembersCollection, userId), { approved: true });
    } catch(err) {
        message.error(`Es ist ein Fehler aufgetreten ${err}`)
        console.error('Es ist ein Fehler aufgetreten', err)
    }
}

export const removeMember = async (abteilungId: string, userId: string) => {
    try {
        await deleteDoc(doc(db, abteilungenCollection, abteilungId, abteilungenMembersCollection, userId));
    } catch(err) {
        message.error(`Es ist ein Fehler aufgetreten ${err}`)
        console.error('Es ist ein Fehler aufgetreten', err)
    }
}

export const denyMemberRequest = async (abteilungId: string, userId: string) => {
    await removeMember(abteilungId, userId);
}

//user is not allowed to request access again
export const banMember = async (abteilungId: string, userId: string) => {
    try {
        await updateDoc(doc(db, abteilungenCollection, abteilungId, abteilungenMembersCollection, userId), { approved: false, banned: true });
    } catch(err) {
        message.error(`Es ist ein Fehler aufgetreten ${err}`)
        console.error('Es ist ein Fehler aufgetreten', err)
    }
}

export const unBanMember = async (abteilungId: string, userId: string) => {
    try {
        await updateDoc(doc(db, abteilungenCollection, abteilungId, abteilungenMembersCollection, userId), { approved: false, banned: false });
    } catch(err) {
        message.error(`Es ist ein Fehler aufgetreten ${err}`)
        console.error('Es ist ein Fehler aufgetreten', err)
    }
}