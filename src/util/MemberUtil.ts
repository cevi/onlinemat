import { message } from 'antd';
import { abteilungenCollection, abteilungenMembersCollection } from 'config/firebase/collections';
import { firestore } from 'config/firebase/firebase';
import { AbteilungMember } from 'types/abteilung.type'


export const changeRoleOfMember = async (abteilungId: string, userId: string, role: AbteilungMember['role'] ) => {
    try {
        await firestore().collection(abteilungenCollection).doc(abteilungId).collection(abteilungenMembersCollection).doc(userId).update({role});
    } catch(err) {
        message.error(`Es ist ein Fehler aufgetreten ${err}`)
    }
}

export const approveMemberRequest =  async (abteilungId: string, userId: string) => {
    try {
        await firestore().collection(abteilungenCollection).doc(abteilungId).collection(abteilungenMembersCollection).doc(userId).update({ approved: true });
    } catch(err) {
        message.error(`Es ist ein Fehler aufgetreten ${err}`)
    }
}

export const removeMember = async (abteilungId: string, userId: string) => {
    try {
        await firestore().collection(abteilungenCollection).doc(abteilungId).collection(abteilungenMembersCollection).doc(userId).delete();
    } catch(err) {
        message.error(`Es ist ein Fehler aufgetreten ${err}`)
    }
}

export const denyMemberRequest = async (abteilungId: string, userId: string) => {
    await removeMember(abteilungId, userId);
}

//user is not allowed to request access again
export const banMember = async (abteilungId: string, userId: string) => {
    try {
        await firestore().collection(abteilungenCollection).doc(abteilungId).collection(abteilungenMembersCollection).doc(userId).update({ approved: false, banned: true });
    } catch(err) {
        message.error(`Es ist ein Fehler aufgetreten ${err}`)
    }
}

export const unBanMember = async (abteilungId: string, userId: string) => {
    try {
        await firestore().collection(abteilungenCollection).doc(abteilungId).collection(abteilungenMembersCollection).doc(userId).update({ approved: false, banned: false });
    } catch(err) {
        message.error(`Es ist ein Fehler aufgetreten ${err}`)
    }
}