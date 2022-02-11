import { message } from "antd";
import { usersCollection } from "config/firebase/collections";
import { firestore } from "config/firebase/firebase";


export const updateCustomDisplayName = async (uid: string, customDisplayName: string) => {
    try {
        await firestore().collection(usersCollection).doc(uid).update({ customDisplayName });
    } catch(err) {
        message.error(`Es ist ein Fehler aufgetreten ${err}`)
        console.error('Es ist ein Fehler aufgetreten', err)
    }
}