import { message } from "antd";
import { usersCollection } from "config/firebase/collections";
import { firestore, functions } from "config/firebase/firebase";
import { setPublicUsers } from "config/redux/publicUser/publicUser";
import { usePublicUsers } from "hooks/use-publicUser";
import { useDispatch } from "react-redux";
import { PublicUser } from "types/user.type";
import { CustomDisplayName } from "views/profile/profile";


export const updateCustomDisplayName = async (uid: string, userSettings: CustomDisplayName) => {
    try {
        await firestore().collection(usersCollection).doc(uid).update({ ...userSettings });
    } catch(err) {
        message.error(`Es ist ein Fehler aufgetreten ${err}`)
        console.error('Es ist ein Fehler aufgetreten', err)
    }
}

export const useGetPublicUser = async (uid: string | undefined): Promise<PublicUser> => {
    const publicUsersState = usePublicUsers();
    const dispatch = useDispatch();

    console.log('publicUsersState', publicUsersState)

    if(!uid) return {
        displayName: 'Loading...',
        id: 'loadingUser'
    }

    //check if user is in state
    if(publicUsersState && publicUsersState.publicUsers) {
        if(publicUsersState.publicUsers[uid]) {
            console.log('user exists', publicUsersState.publicUsers[uid])
            return publicUsersState.publicUsers[uid];
        }
    }

    //user is not in state
    const user = await fetchPublicUser(uid);
    const newPublicUserList = {
        ...publicUsersState.publicUsers
    }
    newPublicUserList[uid] = user;
    await await dispatch(setPublicUsers(newPublicUserList))
    return user;
}

const fetchPublicUser = async (uid: string): Promise<PublicUser> => {
    const publicUser = await functions().httpsCallable('getPublicUserData')({ uid });

    return publicUser.data as PublicUser
}

