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
import { message } from "antd";
import { ability } from "config/casl/ability";
import { updateAbility } from "util/UserPermission";
import * as Sentry from "@sentry/react";

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
            message.error(`Es ist ein Fehler aufgetreten ${err}`);
            console.error("Es ist ein Fehler aufgetreten", err);
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

  return <NavigationMenu />;
};

export default App;
