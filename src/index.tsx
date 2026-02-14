import { createRoot } from "react-dom/client";
import * as serviceWorker from "./serviceWorker";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { configureStore } from "config/redux/store";
import "config/firebase/firebase";
import "./index.css";
import dayjs from "dayjs";
import "dayjs/locale/de-ch";
import "dayjs/locale/en";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import localizedFormat from "dayjs/plugin/localizedFormat";
dayjs.extend(isSameOrBefore);
dayjs.extend(localizedFormat);
import "config/i18n/i18n";
import * as Sentry from "@sentry/react";
import App from "App";
import { AppState, Auth0Provider } from "@auth0/auth0-react";
import { AbilityContext } from "config/casl/casl";
import { ability } from "config/casl/ability";
import { CookiesProvider } from "react-cookie";

const store = configureStore();

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DNS,
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 1.0,
  beforeSend(event) {
    if (event.exception) {
      Sentry.showReportDialog({ eventId: event.event_id });
    }
    return event;
  },
});

const onRedirectCallback = (appState: AppState | undefined) => {
  window.history.replaceState({}, "", appState?.returnTo || window.location.pathname);
};

const root = createRoot(document.getElementById("root")!);
root.render(
  <Provider store={store}>
    <BrowserRouter>
      <Auth0Provider
        domain={import.meta.env.VITE_AUTH0_DOMAIN as string}
        clientId={import.meta.env.VITE_AUTH0_CLIENT_ID as string}
        authorizationParams={{
          redirect_uri: window.location.origin,
        }}
        onRedirectCallback={onRedirectCallback}
        cacheLocation="localstorage"
      >
        <AbilityContext.Provider value={ability}>
          <CookiesProvider>
            <App />
          </CookiesProvider>
        </AbilityContext.Provider>
      </Auth0Provider>
    </BrowserRouter>
  </Provider>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
