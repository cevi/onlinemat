import { message } from "antd";
import { usersCollection } from "config/firebase/collections";
import { firestore } from "config/firebase/firebase";
import { CustomDisplayName } from "views/profile/profile";


export const updateCustomDisplayName = async (uid: string, userSettings: CustomDisplayName) => {
    try {
        await firestore().collection(usersCollection).doc(uid).update({ ...userSettings });
    } catch(err) {
        message.error(`Es ist ein Fehler aufgetreten ${err}`)
        console.error('Es ist ein Fehler aufgetreten', err)
    }
}