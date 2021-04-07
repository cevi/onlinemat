import React, { useEffect, useMemo } from 'react';
import NavigationMenu from 'components/navigation/NavigationMenu';
import { useAuth0 } from '@auth0/auth0-react';
import { auth } from './config/firebase/firebase';
import { setUser } from 'config/redux/user/user';
import { useDispatch } from 'react-redux';

const App = ()=> {

  const { user, isAuthenticated  } = useAuth0();

  const dispatch = useDispatch();

  useEffect(() => {
    return auth().onAuthStateChanged(user => {
      dispatch(setUser(user));
    })
  }, [dispatch])


  useMemo(()=> {
    if(isAuthenticated && user && user['https://mat.cevi.tools/firebase_token']) {
      auth().signInWithCustomToken(user['https://mat.cevi.tools/firebase_token'])
    }
  }, [user])

  

  return <NavigationMenu/>;
}

export default App;
