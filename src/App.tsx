import { useEffect, useRef } from "react";
import NavigationMenu from "components/navigation/NavigationMenu";
import { useAuth0 } from "@auth0/auth0-react";
import { auth, db } from "config/firebase/firebase";
import { onAuthStateChanged, signInWithCustomToken } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { setUser } from "config/redux/user/user";
import { useDispatch } from "react-redux";
import { usersCollection } from "config/firebase/collections";
import { UserData } from "types/user.type";
import { ConfigProvider, message } from "antd";
import deDE from "antd/locale/de_DE";
import enUS from "antd/locale/en_US";
import { ability } from "config/casl/ability";
import { updateAbility } from "util/UserPermission";
import * as Sentry from "@sentry/react";
import { useTranslation } from "react-i18next";
import i18n from "config/i18n/i18n";

const App = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    getAccessTokenSilently,
    getIdTokenClaims,
    loginWithRedirect,
  } = useAuth0();
  const firebaseTokenClaim = "https://mat.cevi.tools/firebase_token";
  const lastAttemptedTokenRef = useRef<string | null>(null);
  const retryDoneForTokenRef = useRef<Set<string>>(new Set());

  const dispatch = useDispatch();

  useEffect(()=> {
    if(import.meta.env.VITE_DEV_ENV === 'true') {
      document.title = 'Onlinemat (DEV)'
    }
  }, [])

  useEffect(() => {
    let unsubscribe: () => void;
    return onAuthStateChanged(auth, (user) => {
      if (user && user !== null) {
        const userRef = doc(db, usersCollection, user.uid);
        unsubscribe = onSnapshot(
          userRef,
          (snap) => {
            const userLoaded = {
              ...(snap.data() as UserData),
              id: snap.id,
            } as UserData;

            updateAbility(ability, userLoaded);

            dispatch(setUser(user, userLoaded));
            //set sentry user as base64 (otherwise it's getting masked by sentry)
            const base64 = btoa(user.uid);
            Sentry.setUser({ id: base64 });
          },
          (err) => {
            if ((err as any).code === 'permission-denied') return;
            message.error(i18n.t('common:errors.generic', { error: String(err) }));
            console.error("Error occurred", err);
          }
        );
      } else {
        if (unsubscribe) {
          unsubscribe();
        }
        dispatch(setUser(user, null));
        //unset sentry user
        Sentry.setUser(null);
      }
    });
  }, [dispatch]);

  useEffect(() => {
    if (!isAuthenticated) {
      lastAttemptedTokenRef.current = null;
      retryDoneForTokenRef.current.clear();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !user || isLoading) {
      return;
    }

    if (auth.currentUser) {
      return;
    }

    const token = user[firebaseTokenClaim];
    if (!token || lastAttemptedTokenRef.current === token) {
      return;
    }

    lastAttemptedTokenRef.current = token;
    let cancelled = false;

    const returnTo =
      window.location.pathname + window.location.search + window.location.hash;

    const redirectToLogin = async () => {
      if (cancelled) return;
      try {
        await loginWithRedirect({ appState: { returnTo } });
      } catch (redirectErr: any) {
        console.error("unable to redirect to login", {
          code: redirectErr?.code,
          error: redirectErr,
        });
      }
    };

    const signInWithToken = async (candidateToken: string) => {
      await signInWithCustomToken(auth, candidateToken);
    };

    (async () => {
      try {
        await signInWithToken(token);
      } catch (err: any) {
        const code = err?.code;
        if (
          code === "auth/invalid-custom-token" &&
          !retryDoneForTokenRef.current.has(token)
        ) {
          retryDoneForTokenRef.current.add(token);
          try {
            await getAccessTokenSilently({ cacheMode: "off" });
            if (cancelled) return;

            const refreshedClaims = await getIdTokenClaims();
            if (cancelled) return;

            const refreshedToken = refreshedClaims?.[firebaseTokenClaim];
            if (refreshedToken) {
              lastAttemptedTokenRef.current = refreshedToken;
              try {
                await signInWithToken(refreshedToken);
                return;
              } catch (retryErr: any) {
                console.error("unable to login to firebase with token", {
                  code: retryErr?.code,
                  error: retryErr,
                });
                await redirectToLogin();
                return;
              }
            }
            await redirectToLogin();
            return;
          } catch (refreshErr: any) {
            console.error("unable to refresh auth token", {
              code: refreshErr?.code,
              error: refreshErr,
            });
            await redirectToLogin();
            return;
          }
        }

        console.error("unable to login to firebase with token", {
          code,
          error: err,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    user,
    isAuthenticated,
    isLoading,
    firebaseTokenClaim,
    getAccessTokenSilently,
    getIdTokenClaims,
    loginWithRedirect,
  ]);

  const { i18n: i18nInstance } = useTranslation();
  const antdLocale = i18nInstance.language === 'en' ? enUS : deDE;

  return (
    <ConfigProvider locale={antdLocale}>
      <NavigationMenu />
    </ConfigProvider>
  );
};

export default App;
