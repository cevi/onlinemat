import React, { useState } from 'react';
import styles from './NavigationMenu.module.scss';
import appStyles from 'styles.module.scss';
import classNames from 'classnames';
import { Menu, Layout, Typography, Spin, Result, Button } from 'antd';
import { AppRoutes, HomeRoute } from 'routes';
import { useLocation, useHistory, Route, Switch } from 'react-router';
import { auth } from 'config/firebase/firebase';
import { AppRoute } from 'routes';
import { LoginOutlined, LogoutOutlined } from '@ant-design/icons';
import { useAuth0 } from '@auth0/auth0-react';

const { Header, Content, Footer, Sider } = Layout;

const NavigationMenu: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { pathname } = useLocation();
  const { push } = useHistory();

  const { isAuthenticated, isLoading, logout, loginWithRedirect  } = useAuth0();

  //TODO: fix
  const isAdmin = true;


  const filteredRoutes = AppRoutes.filter((appRoute: AppRoute) => {
    // When the user is not signed in, return the public access
    if(!isAuthenticated) return appRoute.public;
    // if the route is not available on login, do not make it available
    if(!appRoute.private) return false;
    // if the route requires admin, only make it available if the user is admin
    if(appRoute.adminOnly) return isAdmin;

    return appRoute.private;
  });

  // key is the base url, we exclude / from the initial search because it would match everything
  const matchedRoute = filteredRoutes.find((appRoute: AppRoute) => pathname.startsWith(appRoute.key));
  const matchedKey = matchedRoute ? matchedRoute.key : '/';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        theme='dark'
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        breakpoint='lg'
        >
        <Header className={classNames(styles['app-logo-container'])} onClick={() => push('/')}>
          <Typography.Title ellipsis className={classNames(styles['app-logo'])}>{ collapsed ? <span>OM</span> : 'Onlinemat'}</Typography.Title>
        </Header>
        <Menu
          mode='inline'
          theme='dark'
          selectedKeys={[matchedKey]}
          selectable={false}
          >
            {
              isLoading ?
                <Menu.Item><div style={{justifyContent: 'center', display: 'flex'}}><Spin/></div></Menu.Item>
                :
                [HomeRoute, ...filteredRoutes].map(appRoute => {
                  if(appRoute.showInMenue) {
                    return <Menu.Item key={`${appRoute.key}`} onClick={() => { push(appRoute.key) }}>
                  {appRoute.icon}
                  <span>{appRoute.displayName}</span>
                </Menu.Item>
                  }
                })
            }
            {
              !isAuthenticated && <Menu.Item onClick={() => { loginWithRedirect()}} key='login'><LoginOutlined /><span>Anmelden</span></Menu.Item>
            }
            {
              !!isAuthenticated && <Menu.Item onClick={async () => { await auth().signOut(); logout({returnTo: window.location.origin})}} key='logout' className={classNames(styles['logout'])}><LogoutOutlined /><span>Abmelden</span></Menu.Item>
            }
        </Menu>
      </Sider>
      <Layout>
          <Content style={{ margin: '0 16px' }} className={classNames(appStyles['center-container-stretch'])}>
            { 
              isLoading ?
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <Spin tip='Lade...'/>
                </div>
                :
                <Switch>
                  {[HomeRoute, ...filteredRoutes].map(appRoute => <Route key={appRoute.key} path={appRoute.key} exact={appRoute.key === '/'} component={appRoute.view}></Route>)}
                  <Route>
                    <Result
                      status='404'
                      title='Seite nicht gefunden'
                      // subTitle='Du must angemeldet sein, um das Dashboard benutzen zu können.'
                      extra={[
                          <Button
                              key='homepage'
                              type='primary'
                              onClick={() => push('/')}
                          >Zurück zur Startseite</Button>
                      ]}
                    >
                    </Result>
                  </Route>
                </Switch>
            }
          </Content>
          <Footer style={{ textAlign: 'center' }}>
                Designed by Amigo &amp; Orion | &copy; Cevi Tools {(new Date()).getFullYear()}
            </Footer>
        </Layout>
    </Layout>
  );
}

export default NavigationMenu;
