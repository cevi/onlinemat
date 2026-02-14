import { createStore, applyMiddleware, Store, compose } from 'redux';
import thunk from 'redux-thunk';
import { rootReducer, ApplicationState } from './index';

const composeEnhancers =
    (import.meta.env.DEV && typeof window !== 'undefined' && (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) || compose;

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
