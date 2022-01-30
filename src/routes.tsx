import React from 'react';
import { HomeOutlined, LoginOutlined, UserOutlined, TeamOutlined, GlobalOutlined, SearchOutlined } from '@ant-design/icons'
import { HomeView } from 'views/home/home';
import { LoginView } from 'views/login/login';
import { ProfileView } from 'views/profile/profile';
import { UsersView } from 'views/staff/users/UsersView';
import { AbteilungenView } from 'views/abteilung/abteilungen';
import { AbteilungMaterialView } from 'views/abteilung/material/abteilungMaterials';
import { AbteilungDetail } from 'components/abteilung/AbteilungDetails';
import { SearchView } from 'views/search/search';


export interface AppRoute {
    key: string
    displayName: string
    icon?: JSX.Element
    // is this route available when the user is *not* logged in
    public?: boolean
    // is this route available when the user *is* logged in
    private?: boolean
    // if this route is available when signed in, does it require the user to be admin?
    staffOnly?: boolean
    // include this route in the sidebar
    showInMenue: boolean
    exact?: boolean
    view: React.FC
    element: JSX.Element
}

export const HomeRoute: AppRoute = {
    key: '/',
    displayName: 'Home',
    icon: <HomeOutlined />,
    showInMenue: true,
    exact: true,
    view: HomeView,
    element: <HomeView/>
}

export const AppRoutes: AppRoute[] = [
    {
        key: '/login',
        displayName: 'Login',
        icon: <LoginOutlined />,
        public: true,
        showInMenue: false,
        exact: true,
        view: LoginView,
        element: <LoginView/>
    },
    {
        key: '/suche',
        displayName: 'Suchen',
        icon: <SearchOutlined />,
        public: false,
        private: true,
        showInMenue: true,
        exact: true,
        view: SearchView,
        element: <SearchView/>
    },
    {
        key: '/abteilungen',
        displayName: 'Abteilungen',
        icon: <GlobalOutlined />,
        public: false,
        private: true,
        showInMenue: true,
        exact: true,
        view: AbteilungenView,
        element: <AbteilungenView/>
    },
    {
        key: '/abteilungen/:abteilungSlugOrId',
        displayName: 'Abteilungen Details',
        showInMenue: false,
        private: true,
        exact: true,
        view: AbteilungDetail,
        element: <AbteilungDetail/>
    },
    {
        key: '/abteilungen/:abteilungSlugOrId/:tab',
        displayName: 'Abteilungen Details',
        showInMenue: false,
        private: true,
        exact: true,
        view: AbteilungDetail,
        element: <AbteilungDetail/>
    },
    {
        key: '/abteilungen/:abteilungSlugOrId/order/:orderId',
        displayName: 'Abteilungen Details',
        showInMenue: false,
        private: true,
        exact: true,
        view: AbteilungDetail,
        element: <AbteilungDetail/>
    },
    {
        key: '/users',
        displayName: 'Benutzer',
        icon: <TeamOutlined />,
        public: false,
        private: true,
        staffOnly: true,
        showInMenue: true,
        exact: true,
        view: UsersView,
        element: <UsersView/>
    },
    {
        key: '/profile',
        displayName: 'Profile',
        icon: <UserOutlined />,
        public: false,
        private: true,
        showInMenue: true,
        exact: true,
        view: ProfileView,
        element: <ProfileView/>
    }
]
