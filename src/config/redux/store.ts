import { createStore, applyMiddleware, Store, compose } from 'redux';
import thunk from 'redux-thunk';
import { rootReducer, ApplicationState } from './index';

declare global {
    interface Window {
        __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof compose;
    }
}

const composeEnhancers =
    (typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) || compose;

export function configureStore(): Store<ApplicationState> {
    return createStore(
        rootReducer(),
        composeEnhancers(
            applyMiddleware(
                thunk
            )
        )
    );
}
