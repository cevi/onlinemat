import { createStore, applyMiddleware, Store } from 'redux';
import thunk from 'redux-thunk';
import { rootReducer, ApplicationState } from './index';
import { composeWithDevTools } from 'redux-devtools-extension';

export function configureStore(): Store<ApplicationState> {
    return createStore(
        rootReducer(),
        composeWithDevTools(
            applyMiddleware(
                thunk
            )
        )
    );
}
