import {db} from "../config/firebase/firebase";
import {doc, updateDoc} from 'firebase/firestore';
import {usersCollection} from "../config/firebase/collections";
import {UserData, UserDataUpdate} from "../types/user.type";
import { firestoreOperation } from "./firestoreOperation";

export const editUserData = async (userId: string | undefined, userData: UserDataUpdate) => {
    await firestoreOperation(
        () => updateDoc(doc(db, usersCollection, userId), {
            ...userData,
            defaultAbteilung: userData.defaultAbteilung || null
        } as Partial<UserData>),
        `User ${userData.name} erfolgreich bearbeitet`,
    );
}
