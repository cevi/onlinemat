import {db} from "../config/firebase/firebase";
import {doc, updateDoc} from 'firebase/firestore';
import {usersCollection} from "../config/firebase/collections";
import {message} from "antd";
import {UserData, UserDataUpdate} from "../types/user.type";

export const dateFormat = 'DD.MM.YYYY';
export const dateFormatWithTime = 'DD.MM.YYYY HH:mm';

export const editUserData = async (userId: string | undefined, userData: UserDataUpdate) => {
    try {

        await updateDoc(doc(db, usersCollection, userId), {
            ...userData,
            defaultAbteilung: userData.defaultAbteilung || null
        } as Partial<UserData>);
        message.success(`User ${userData.name} erfolgreich bearbeitet`);
    } catch (ex) {
        message.error(`Es ist ein Fehler aufgetreten: ${ex}`)
    }

}