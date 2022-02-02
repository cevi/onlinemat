import React, { useEffect, useMemo } from 'react';
import NavigationMenu from 'components/navigation/NavigationMenu';
import { useAuth0 } from '@auth0/auth0-react';
import { auth, firestore } from './config/firebase/firebase';
import { setUser } from 'config/redux/user/user';
import { useDispatch } from 'react-redux';
import { usersCollection } from 'config/firebase/collections';
import { UserData } from 'types/user.type';
import { message } from 'antd';
import { ability } from 'config/casl/ability';
import { updateAbility } from 'util/UserPermission';
import * as Sentry from '@sentry/browser';

const App = () => {

  const { user, isAuthenticated } = useAuth0();

  const dispatch = useDispatch();

  useEffect(() => {
    let unsubscribe: () => void;
    return auth().onAuthStateChanged(user => {
      
      if (user && user !== null) {
        const userRef = firestore().collection(usersCollection).doc(user.uid);
         unsubscribe = userRef.onSnapshot(snap => {
          const userLoaded = {
            ...snap.data() as UserData,
            id: snap.id
          } as UserData;

          updateAbility(ability, userLoaded);

          dispatch(setUser(user, userLoaded));
          //set sentry user
          Sentry.setUser({ id: user.uid });
        }, (err) => {
          message.error(`Es ist ein Fehler aufgetreten ${err}`)
          console.error('Es ist ein Fehler aufgetreten', err)
        });
      } else {
        if(unsubscribe) {
          unsubscribe();
        }
        dispatch(setUser(user, null));
        //unset sentry user
        Sentry.configureScope(scope => scope.setUser(null));
      }


    })
  }, [dispatch])


  useMemo(() => {
    if (isAuthenticated && user && user['https://mat.cevi.tools/firebase_token']) {
      const token = user['https://mat.cevi.tools/firebase_token']
      auth().signInWithCustomToken(token).catch(err => console.error('unable to login to firebase with token', err))
    }

  }, [user])



  return <NavigationMenu />;
}

export default App;
