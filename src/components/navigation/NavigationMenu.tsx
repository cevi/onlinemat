import React, {createContext, useEffect, useMemo, useState} from 'react';
import styles from './NavigationMenu.module.scss';
import appStyles from 'styles.module.scss';
import classNames from 'classnames';
import {Badge, Layout, Menu, Spin, Tag, Typography} from 'antd';
import type {MenuProps} from 'antd';
import {AppRoute, AppRoutes, HomeRoute} from 'routes';
import {Route, Routes, useLocation, useNavigate} from 'react-router';
import {auth, db} from 'config/firebase/firebase';
import {signOut} from 'firebase/auth';
import {collection, query, where, orderBy} from 'firebase/firestore';
import {LoginOutlined, LogoutOutlined} from '@ant-design/icons';
import {useAuth0, withAuthenticationRequired} from '@auth0/auth0-react';
import {useUser} from 'hooks/use-user';
import {NotFoundView} from './NotFound';
import {Abteilung} from 'types/abteilung.type';
import {abteilungenCollection, releaseNotesCollection} from 'config/firebase/collections';
import {setGroupDates} from 'util/GroupUtil';
import {useFirestoreCollection} from 'hooks/useFirestoreCollection';
import {VerifyEmail} from './VerifyEmail';
import { useParams } from "react-router-dom";
import generatedGitInfo from 'generatedGitInfo.json';
import { StatusPage } from 'components/status/Status';
import { useTranslation } from 'react-i18next';
import { LanguagePicker } from 'config/i18n/LanguagePicker';
import { ReleaseNote } from 'types/releaseNote.types';
import { ReleaseNotePopup } from 'components/releaseNotes/ReleaseNotePopup';
import dayjs from 'dayjs';

const {Header, Content, Footer, Sider} = Layout;

export const AbteilungenContext = createContext<{ abteilungen: Abteilung[], loading: boolean }>({
    loading: false,
    abteilungen: []
});

const NavigationMenu: React.FC = () => {
    const [collapsed, setCollapsed] = useState(false);
    const {pathname} = useLocation();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const {user, isAuthenticated, isLoading, logout, loginWithRedirect} = useAuth0();
    const userState = useUser();

    const { showAll } = useParams();

    //if user has defaultAbteilung navigate to the Abteilung (only from the home page)
    useEffect(() => {
        if (isAuthenticated && userState.appUser?.userData?.defaultAbteilung && pathname === '/') {
            navigate(`/abteilungen/${userState.appUser.userData.defaultAbteilung}`);
        }
    },[isAuthenticated, userState, pathname])

    //fetch all abteilungen
    const { data: abteilungen, loading } = useFirestoreCollection<Abteilung>({
        ref: collection(db, abteilungenCollection),
        enabled: isAuthenticated && !!userState.appUser?.firebaseUser,
        transform: (data, id) => ({
            ...data,
            groups: setGroupDates(data.groups as Abteilung['groups']),
            __caslSubjectType__: 'Abteilung',
            id,
        } as Abteilung),
        deps: [isAuthenticated, userState],
    });


    const isStaff = userState.appUser?.userData.staff || false;
    const readReleaseNoteIds = userState.appUser?.userData?.readReleaseNoteIds || [];

    // Fetch published release notes for popup + footer badge
    const releaseNotesQuery = useMemo(() => {
        return query(
            collection(db, releaseNotesCollection),
            where('published', '==', true),
            orderBy('createdAt', 'desc')
        );
    }, []);

    const { data: releaseNotes } = useFirestoreCollection<ReleaseNote>({
        ref: releaseNotesQuery,
        enabled: isAuthenticated && !!userState.appUser?.firebaseUser,
        transform: (data, id) => ({
            ...data,
            id,
            createdAt: data.createdAt?.toDate ? dayjs(data.createdAt.toDate()) : dayjs(),
            updatedAt: data.updatedAt?.toDate ? dayjs(data.updatedAt.toDate()) : dayjs(),
        } as ReleaseNote),
        deps: [isAuthenticated, userState],
    });

    const unreadCount = useMemo(() => {
        return releaseNotes.filter(n => !readReleaseNoteIds.includes(n.id)).length;
    }, [releaseNotes, readReleaseNoteIds]);

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

    const calculateSelectedKeys = () => {
        if(pathname === `/abteilungen/${userState.appUser?.userData?.defaultAbteilung}`) {
            return ['/']
        }
        return [matchedKey]
    }

    const menuItems: MenuProps['items'] = useMemo(() => {
        if (isLoading) {
            return [{
                key: 'menuLoader',
                label: <div style={{justifyContent: 'center', display: 'flex'}}><Spin/></div>,
            }];
        }

        const routeItems: MenuProps['items'] = [HomeRoute, ...filteredRoutes]
            .filter(appRoute => appRoute.showInMenue)
            .map(appRoute => ({
                key: appRoute.key,
                icon: appRoute.icon,
                label: t(appRoute.displayName),
                onClick: () => {
                    if (appRoute.key === '/' && userState.appUser?.userData?.defaultAbteilung) {
                        navigate(`abteilungen/${userState.appUser.userData.defaultAbteilung}`)
                    } else {
                        navigate(appRoute.key)
                    }
                },
            }));

        if (!isAuthenticated && !isLoading) {
            routeItems.push({
                key: 'login',
                icon: <LoginOutlined/>,
                label: t('navigation:menu.login'),
                onClick: () => loginWithRedirect(),
            });
        }

        if (isAuthenticated && !isLoading) {
            routeItems.push({
                key: 'logout',
                icon: <LogoutOutlined/>,
                label: t('navigation:menu.logout'),
                className: classNames(styles['logout']),
                onClick: async () => {
                    await signOut(auth);
                    logout({logoutParams: {returnTo: window.location.origin}});
                },
            });
        }

        return routeItems;
    }, [isLoading, isAuthenticated, filteredRoutes, userState.appUser?.userData?.defaultAbteilung, t]);

    return (
        <AbteilungenContext.Provider value={{
            abteilungen, loading
        }}>
            <Layout style={{minHeight: '100vh'}}>
                <Sider
                    theme='dark'
                    collapsible
                    collapsed={collapsed}
                    onCollapse={setCollapsed}
                    breakpoint='lg'
                >
                    <div className={classNames(styles['sider-content'])}>
                        <div className={classNames(styles['sider-menu'])}>
                            <Header className={classNames(styles['app-logo-container'])} onClick={() => navigate('/')}>
                                <Typography.Title ellipsis className={classNames(styles['app-logo'])}>{collapsed ?
                                    <span>OM</span> : 'Onlinemat'}</Typography.Title>
                            </Header>
                            <Menu
                                mode='inline'
                                theme='dark'
                                selectedKeys={calculateSelectedKeys()}
                                selectable={false}
                                items={menuItems}
                            />
                        </div>
                        <LanguagePicker collapsed={collapsed} />
                    </div>
                </Sider>
                <Layout>
                    <Content style={{margin: '0 16px'}} className={classNames(appStyles['center-container-stretch'])}>
                        {
                            isLoading || loading ?
                                <Spin tip={t('common:status.loading')}>
                                    <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 100}}/>
                                </Spin>
                                :
                                user && !user.email_verified ? <VerifyEmail/> :
                                    <Routes>
                                        {[HomeRoute, ...AppRoutes].map(appRoute => <Route key={appRoute.key}
                                                                                          path={appRoute.key}
                                                                                          element={appRoute.private ?
                                                                                              <ProtectedRoute
                                                                                                  component={appRoute.view}/> : appRoute.element}></Route>)}
                                        <Route path='status' element={<StatusPage/>}/>
                                        <Route path='*' element={<NotFoundView/>}/>

                                    </Routes>
                        }
                    </Content>
                    {isAuthenticated && userState.appUser?.userData && (
                        <ReleaseNotePopup
                            releaseNotes={releaseNotes}
                            readReleaseNoteIds={readReleaseNoteIds}
                            userId={userState.appUser.userData.id}
                        />
                    )}
                    <Footer style={{textAlign: 'center', backgroundColor: import.meta.env.VITE_DEV_ENV === 'true' ? '#FF4B91' : 'unset'}}>
                        Designed by <a href='https://cevi.tools' target='_blank'>Cevi Tools</a> | <a href='mailto:onlinemat@cevi.tools'>Contact</a>
                        {isAuthenticated && <> | <a onClick={() => navigate('/release-notes')} style={{cursor: 'pointer'}}>
                            <Badge count={unreadCount} size="small" offset={[6, -2]}><span style={{color: '#1677ff'}}>{t('releaseNote:footerLink')}</span></Badge>
                        </a></>}
                        {' '}| &copy; Cevi Tools {(new Date()).getFullYear()}
                        {import.meta.env.VITE_DEV_ENV === 'true' && <> |
                            Branch: <Tag>{generatedGitInfo.gitBranch}</Tag>
                            Git Hash: <Tag>{generatedGitInfo.gitCommitHash}</Tag>
                        </>}
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
    return <Component/>;
};
