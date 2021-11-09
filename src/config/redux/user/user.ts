import { firestore } from 'config/firebase/firebase';
import { Reducer, AnyAction } from 'redux';
import { handleActions, createAction } from 'redux-actions';
import { Dispatch } from 'react';
import { UserData } from 'types/user.type';
import { abteilungenCollection, abteilungenMembersCollection } from 'config/firebase/collections';

export interface AppUser {
    firebaseUser: firebase.default.User, 
    isStaff: boolean
    roles: {[abteilungId: string] : string}
}

export interface UserState {
    appUser: AppUser | null
    loading: boolean
}

const defaultState: UserState = {
    appUser: null,
    loading: true
}

const setUserInner = createAction('SET_USER', (user: AppUser | null) => user)

export const UserReducer: Reducer<UserState, AnyAction> = handleActions<UserState, AnyAction>({
    SET_USER: (state, action: AnyAction) => ({
        ...state,
        loading: false,
        appUser: action.payload
    })
}, defaultState) as Reducer<UserState, AnyAction>;

export const setUser = (user: firebase.default.User | null) => {
    return async (dispatch: Dispatch<AnyAction>) => {
        if(!user) {
            dispatch(setUserInner(null));
            return;
        }
        const uid = user.uid;
        let isStaff = false;
        let roles = {};
        try {
            const adminDoc = await firestore().collection('users').doc(uid).get();
            isStaff = (adminDoc.data() as UserData).staff || false;
            roles =  (adminDoc.data() as UserData).roles || {}

            const memberList = await firestore().collectionGroup(abteilungenMembersCollection).where('userId', '==', uid).get();
            console.log('memberList', memberList)
        } catch(err) {
            console.error('Failed to fetch user data', err);
        }

        dispatch(setUserInner({ firebaseUser: user, isStaff: isStaff, roles: roles }))
    }
}
