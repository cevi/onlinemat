import {firestore} from "../config/firebase/firebase";
import {usersCollection} from "../config/firebase/collections";
import {message} from "antd";
import {UserData} from "../types/user.type";

export const dateFormat = 'DD.MM.YYYY';
export const dateFormatWithTime = 'DD.MM.YYYY HH:mm';

export const editUserData = async (userId: string | undefined, userData: UserData) => {
    try {

        await firestore().collection(usersCollection).doc(userId).update(userData);
        message.success(`User ${userData.name} erfolgreich bearbeitet`);
    } catch (ex) {
        message.error(`Es ist ein Fehler aufgetreten: ${ex}`)
    }

}