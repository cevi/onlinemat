import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export interface AppState {
  returnTo?: string;
}

type LocalUser = {
  sub: string;
  email: string;
  email_verified: boolean;
  given_name: string;
  family_name: string;
  name: string;
  nickname: string;
  picture: string;
  'https://mat.cevi.tools/firebase_token': string;
};

type LogoutOptions = {
  logoutParams?: {
    returnTo?: string;
  };
};

type Auth0ContextValue = {
  user?: LocalUser;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithRedirect: () => Promise<void>;
  logout: (options?: LogoutOptions) => Promise<void>;
};

type Auth0ProviderProps = React.PropsWithChildren<{
  domain?: string;
  clientId?: string;
  authorizationParams?: Record<string, unknown>;
  onRedirectCallback?: (appState: AppState | undefined) => void;
  cacheLocation?: string;
}>;

type WithAuthenticationRequiredOptions = {
  onRedirecting?: () => React.ReactElement;
};

const LOCAL_UID = 'test-admin-uid';

const toBase64Url = (value: string): string =>
  btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const createFakeCustomToken = (uid: string): string => {
  const now = Math.floor(Date.now() / 1000);
  const header = toBase64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = toBase64Url(
    JSON.stringify({
      uid,
      iat: now,
      exp: now + 3600,
      aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',
      iss: 'firebase-auth-emulator@example.com',
      sub: 'firebase-auth-emulator@example.com',
      claims: {},
    })
  );
  return `${header}.${payload}.fake-signature`;
};

const createLocalUser = (): LocalUser => ({
  sub: `auth0|${LOCAL_UID}`,
  email: 'admin@test.com',
  email_verified: true,
  given_name: 'Admin',
  family_name: 'Test',
  name: 'Test Admin',
  nickname: 'admin',
  picture: '',
  'https://mat.cevi.tools/firebase_token': createFakeCustomToken(LOCAL_UID),
});

const Auth0Context = createContext<Auth0ContextValue | undefined>(undefined);

export const Auth0Provider: React.FC<Auth0ProviderProps> = ({
  children,
  onRedirectCallback,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [user, setUser] = useState<LocalUser | undefined>(() => createLocalUser());

  const loginWithRedirect = useCallback(async () => {
    setUser(createLocalUser());
    setIsAuthenticated(true);
    onRedirectCallback?.(undefined);
  }, [onRedirectCallback]);

  const logout = useCallback(async (options?: LogoutOptions) => {
    setIsAuthenticated(false);
    setUser(undefined);
    if (options?.logoutParams?.returnTo) {
      window.location.assign(options.logoutParams.returnTo);
    }
  }, []);

  const value = useMemo<Auth0ContextValue>(
    () => ({
      user,
      isAuthenticated,
      isLoading: false,
      loginWithRedirect,
      logout,
    }),
    [isAuthenticated, loginWithRedirect, logout, user]
  );

  return <Auth0Context.Provider value={value}>{children}</Auth0Context.Provider>;
};

export const useAuth0 = (): Auth0ContextValue => {
  const context = useContext(Auth0Context);
  if (!context) {
    throw new Error('useAuth0 must be used within Auth0Provider');
  }
  return context;
};

export const withAuthenticationRequired = <P extends object>(
  Component: React.ComponentType<P>,
  options?: WithAuthenticationRequiredOptions
): React.FC<P> => {
  return function WithAuthenticationRequiredWrapper(props: P) {
    const { isAuthenticated, loginWithRedirect } = useAuth0();
    useEffect(() => {
      if (!isAuthenticated) {
        void loginWithRedirect();
      }
    }, [isAuthenticated, loginWithRedirect]);

    if (!isAuthenticated) {
      return options?.onRedirecting?.() ?? <></>;
    }
    return <Component {...props} />;
  };
};
