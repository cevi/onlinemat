import { useEffect, useMemo } from "react";
import NavigationMenu from "components/navigation/NavigationMenu";
import { useAuth0 } from "@auth0/auth0-react";
import { auth, firestore } from "./config/firebase/firebase";
import { setUser } from "config/redux/user/user";
import { useDispatch } from "react-redux";
import { usersCollection } from "config/firebase/collections";
import { UserData } from "types/user.type";
import { message } from "antd";
import { ability } from "config/casl/ability";
import { updateAbility } from "util/UserPermission";
import * as Sentry from "@sentry/browser";

const App = () => {
  const { user, isAuthenticated } = useAuth0();

  const dispatch = useDispatch();

  useEffect(()=> {
    if(process.env.REACT_APP_DEV_ENV === 'true') {
      document.title = 'Onlinemat (DEV)'
    }
  }, [])

  useEffect(() => {
    let unsubscribe: () => void;
    return auth().onAuthStateChanged((user) => {
      if (user && user !== null) {
        const userRef = firestore().collection(usersCollection).doc(user.uid);
        unsubscribe = userRef.onSnapshot(
          (snap) => {
            const userLoaded = {
              ...(snap.data() as UserData),
              id: snap.id,
            } as UserData;

            updateAbility(ability, userLoaded);

            dispatch(setUser(user, userLoaded));
            //set sentry user as base64 (otherwise it's getting masked by sentry)
            // create a buffer
            const buff = Buffer.from(user.uid, "utf-8");
            // decode buffer as Base64
            const base64 = buff.toString("base64");
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
        Sentry.configureScope((scope) => scope.setUser(null));
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
      auth()
        .signInWithCustomToken(token)
        .catch((err) =>
          console.error("unable to login to firebase with token", err)
        );
    }
  }, [user, isAuthenticated]);

  return <NavigationMenu />;
};

export default App;
