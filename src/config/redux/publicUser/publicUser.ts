import { Reducer, AnyAction } from 'redux';
import { handleActions, createAction } from 'redux-actions';
import { Dispatch } from 'react';
import { PublicUser } from 'types/user.type';

export type PublicUsers = {[uid: string]: PublicUser}

export interface PublicUsersState {
    publicUsers: PublicUsers | null
    loading: boolean
}

const defaultState: PublicUsersState = {
    publicUsers: null,
    loading: true
}

const setPublicUsersInner = createAction('SET_PUBLIC_USERS', (publicUsers: PublicUsers | null) => publicUsers)

export const PublicUserReducer: Reducer<PublicUsersState, AnyAction> = handleActions<PublicUsersState, AnyAction>({
    SET_PUBLIC_USERS: (state, action: AnyAction) => ({
        ...state,
        loading: false,
        publicUsers: action.payload
    })
}, defaultState) as Reducer<PublicUsersState, AnyAction>;

export const setPublicUsers = (publicUsers: PublicUsers | null) => {
    return async (dispatch: Dispatch<AnyAction>) => {
        if(!publicUsers) {
            dispatch(setPublicUsersInner(null));
            return;
        }

        dispatch(setPublicUsersInner(publicUsers))
    }
}
