import { Reducer, AnyAction } from 'redux';
import { handleActions, createAction } from 'redux-actions';
import { Dispatch } from 'react';
import { User } from 'firebase/auth';
import { UserData } from 'types/user.type';

export interface AppUser {
    firebaseUser: User,
    userData: UserData
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

export const setUser = (user: User | null, userData: UserData | null) => {
    return async (dispatch: Dispatch<AnyAction>) => {
        if(!user || !userData) {
            dispatch(setUserInner(null));
            return;
        }

        dispatch(setUserInner({ firebaseUser: user, userData }))
    }
}
