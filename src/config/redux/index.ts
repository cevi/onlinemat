import { combineReducers, Reducer } from 'redux';
import { UserReducer, UserState } from './user/user';

export interface ApplicationState {
    user: UserState
}


export const rootReducer: () => Reducer<ApplicationState> = () => {
    let combinedReducers = combineReducers({
        user: UserReducer,
    });
    return combinedReducers;
};
