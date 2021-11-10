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

const App = () => {

  const { user, isAuthenticated } = useAuth0();

  const dispatch = useDispatch();

  useEffect(() => {
    return auth().onAuthStateChanged(user => {
      if (user) {
        firestore().collection(usersCollection).doc(user.uid).onSnapshot(snap => {
          const userLoaded = {
            ...snap.data() as UserData,
            id: snap.id
          } as UserData;

          updateAbility(ability, userLoaded);

          dispatch(setUser(user, userLoaded));
        }, (err) => {
          message.error(`Es ist ein Fehler aufgetreten ${err}`)
        });
      } else {
        dispatch(setUser(user, null));
      }


    })
  }, [dispatch])


  useMemo(() => {
    if (isAuthenticated && user && user['https://mat.cevi.tools/firebase_token']) {
      auth().signInWithCustomToken(user['https://mat.cevi.tools/firebase_token'])
    }
  }, [user])



  return <NavigationMenu />;
}

export default App;
