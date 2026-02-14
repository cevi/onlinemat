import { useEffect, useMemo } from "react";
import NavigationMenu from "components/navigation/NavigationMenu";
import { useAuth0 } from "@auth0/auth0-react";
import { auth, db } from "./config/firebase/firebase";
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
  const { user, isAuthenticated } = useAuth0();

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

  useMemo(() => {
    if (
      isAuthenticated &&
      user &&
      user["https://mat.cevi.tools/firebase_token"]
    ) {
      const token = user["https://mat.cevi.tools/firebase_token"];
      signInWithCustomToken(auth, token)
        .catch((err) =>
          console.error("unable to login to firebase with token", err)
        );
    }
  }, [user, isAuthenticated]);

  const { i18n: i18nInstance } = useTranslation();
  const antdLocale = i18nInstance.language === 'en' ? enUS : deDE;

  return (
    <ConfigProvider locale={antdLocale}>
      <NavigationMenu />
    </ConfigProvider>
  );
};

export default App;
