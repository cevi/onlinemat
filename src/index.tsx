import { createBrowserHistory } from 'history';
import ReactDOM from 'react-dom';
import 'antd/dist/antd.css'; 
import * as serviceWorker from './serviceWorker';
import { BrowserRouter, Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from 'config/redux/store';
import 'config/firebase/firebase';
import 'moment/locale/de-ch';
import * as Sentry from '@sentry/react';
import App from 'App';
import { AppState, Auth0Provider } from "@auth0/auth0-react";
import { Integrations } from "@sentry/tracing";
import { AbilityContext } from 'config/casl/casl';
import { ability } from 'config/casl/ability';

const store = configureStore();
export const history = createBrowserHistory();

Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DNS,
    integrations: [new Integrations.BrowserTracing() as any],
  
    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
  });


  const onRedirectCallback = (appState: AppState) => {
    // Use the router's history module to replace the url
    history.replace(appState?.returnTo || window.location.pathname);
  };

  //TODO: replace <BrowserRouter> with <HistoryRouter> as soon as it's stable
ReactDOM.render(<Provider store={store}>
    
    <BrowserRouter>
        <Auth0Provider
            domain={process.env.REACT_APP_AUTH0_DOMAIN as string}
            clientId={process.env.REACT_APP_AUTH0_CLIENT_ID as string}
            redirectUri={window.location.origin}
            onRedirectCallback={onRedirectCallback}
            cacheLocation='localstorage'
        >
            <AbilityContext.Provider value={ability}>
                <App />
            </AbilityContext.Provider>
            
        </Auth0Provider>
    </BrowserRouter>
</Provider>, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
