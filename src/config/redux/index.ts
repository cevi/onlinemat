import { combineReducers, Reducer } from 'redux';
import { PublicUserReducer, PublicUsersState } from './publicUser/publicUser';
import { UserReducer, UserState } from './user/user';

export interface ApplicationState {
    user: UserState
    publicUsers: PublicUsersState
}


export const rootReducer: () => Reducer<ApplicationState> = () => {
    let combinedReducers = combineReducers({
        user: UserReducer,
        publicUsers: PublicUserReducer
    });
    return combinedReducers;
};
