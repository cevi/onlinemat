import React, { useState, createContext, useEffect } from 'react';
import styles from './NavigationMenu.module.scss';
import appStyles from 'styles.module.scss';
import classNames from 'classnames';
import { Menu, Layout, Typography, Spin, Result, Button, message } from 'antd';
import { AppRoutes, HomeRoute } from 'routes';
import { useLocation, useNavigate, Route, Routes } from 'react-router';
import { auth, firestore } from 'config/firebase/firebase';
import { AppRoute } from 'routes';
import { LoginOutlined, LogoutOutlined } from '@ant-design/icons';
import { useAuth0, withAuthenticationRequired } from '@auth0/auth0-react';
import { useUser } from 'hooks/use-user';
import { NotFoundView } from './NotFound';
import { Abteilung } from 'types/abteilung.type';
import { abteilungenCollection } from 'config/firebase/collections';

const { Header, Content, Footer, Sider } = Layout;

export const AbteilungenContext = createContext<{ abteilungen: Abteilung[], loading: boolean}>({loading: false, abteilungen: []});

const NavigationMenu: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const { isAuthenticated, isLoading, logout, loginWithRedirect } = useAuth0();
  const userState = useUser();

  const [loading, setLoading] = useState(false);
  const [abteilungen, setAbteilungen] = useState<Abteilung[]>([]);

  //fetch all abteilungen
  useEffect(() => {
    if(!isAuthenticated || !userState.appUser?.firebaseUser) return;
    setLoading(true);
    return firestore().collection(abteilungenCollection).onSnapshot(snap => {
        setLoading(false);
        const abteilungenLoaded = snap.docs.flatMap(doc => {
            return {
                ...doc.data(),
                __caslSubjectType__: 'Abteilung',
                id: doc.id
            } as Abteilung;
        });
        setAbteilungen(abteilungenLoaded);
    }, (err) => {
        message.error(`Es ist ein Fehler aufgetreten ${err}`)
    });
}, [isAuthenticated, userState]);


  const isStaff = userState.appUser?.userData.staff || false;


  const filteredRoutes = AppRoutes.filter((appRoute: AppRoute) => {
    // When the user is not signed in, return the public access
    if (!isAuthenticated) return appRoute.public;
    // if the route is not available on login, do not make it available
    if (!appRoute.private) return false;
    // if the route requires admin, only make it available if the user is admin
    if (appRoute.staffOnly) return isStaff;

    return appRoute.private;
  });

  // key is the base url, we exclude / from the initial search because it would match everything
  const matchedRoute = filteredRoutes.find((appRoute: AppRoute) => pathname.startsWith(appRoute.key));
  const matchedKey = matchedRoute ? matchedRoute.key : '/';

  return (
    <AbteilungenContext.Provider value={{
      abteilungen, loading
    }}>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider
          theme='dark'
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          breakpoint='lg'
        >
          <Header className={classNames(styles['app-logo-container'])} onClick={() => navigate('/')}>
            <Typography.Title ellipsis className={classNames(styles['app-logo'])}>{collapsed ? <span>OM</span> : 'Onlinemat'}</Typography.Title>
          </Header>
          <Menu
            mode='inline'
            theme='dark'
            selectedKeys={[matchedKey]}
            selectable={false}
          >
            {
              isLoading ?
                <Menu.Item key='menuLoader'><div style={{ justifyContent: 'center', display: 'flex' }}><Spin /></div></Menu.Item>
                :
                [HomeRoute, ...filteredRoutes].map(appRoute => {
                  if (appRoute.showInMenue) {
                    return <Menu.Item key={`${appRoute.key}`} onClick={() => { navigate(appRoute.key) }}>
                      {appRoute.icon}
                      <span>{appRoute.displayName}</span>
                    </Menu.Item>
                  }
                })
            }
            {
              !isAuthenticated && !isLoading && <Menu.Item onClick={() => { loginWithRedirect() }} key='login'><LoginOutlined /><span>Anmelden</span></Menu.Item>
            }
            {
              !!isAuthenticated && !isLoading && <Menu.Item onClick={async () => { await auth().signOut(); logout({ returnTo: window.location.origin }) }} key='logout' className={classNames(styles['logout'])}><LogoutOutlined /><span>Abmelden</span></Menu.Item>
            }
          </Menu>
        </Sider>
        <Layout>
          <Content style={{ margin: '0 16px' }} className={classNames(appStyles['center-container-stretch'])}>
            {
              isLoading || loading ?
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <Spin tip='Lade...' />
                </div>
                :
                <Routes>
                  {[HomeRoute, ...AppRoutes].map(appRoute => <Route key={appRoute.key} path={appRoute.key} element={appRoute.private ? <ProtectedRoute component={appRoute.view} /> : appRoute.element}></Route>)}
                  <Route path='*' element={<NotFoundView />} />

                </Routes>
            }
          </Content>
          <Footer style={{ textAlign: 'center' }}>
            Designed by Amigo &amp; Orion | &copy; Cevi Tools {(new Date()).getFullYear()}
          </Footer>
        </Layout>
      </Layout>
    </AbteilungenContext.Provider>
  );
}

export default NavigationMenu;

export const ProtectedRoute = ({
  component,
  ...args
}: React.PropsWithChildren<any>) => {
  const Component = withAuthenticationRequired(component, args);
  return <Component />;
};
