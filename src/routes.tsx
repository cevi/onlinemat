import React from 'react';
import { HomeOutlined, LoginOutlined, UserOutlined, TeamOutlined, GlobalOutlined } from '@ant-design/icons'
import { HomeView } from 'views/home/home';
import { LoginView } from 'views/login/login';
import { ProfileView } from 'views/profile/profile';
import { UsersView } from 'views/staff/users/UsersView';
import { AbteilungenView } from 'views/abteilung/abteilungen';
import { withAuthenticationRequired } from '@auth0/auth0-react';
import { AbteilungMaterialView } from 'views/abteilung/material/abteilungMaterials';
import { AbteilungDetail } from 'components/abteilung/AbteilungDetails';


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
}

export const HomeRoute: AppRoute = {
    key: '/',
    displayName: 'Home',
    icon: <HomeOutlined />,
    showInMenue: true,
    exact: true,
    view: HomeView
}

export const AppRoutes: AppRoute[] = [
    {
        key: '/login',
        displayName: 'Login',
        icon: <LoginOutlined />,
        public: true,
        showInMenue: false,
        exact: true,
        view: LoginView
    },
    {
        key: '/abteilungen',
        displayName: 'Abteilungen',
        icon: <GlobalOutlined />,
        public: false,
        private: true,
        showInMenue: true,
        exact: true,
        view: withAuthenticationRequired(AbteilungenView)
    },
    {
        key: '/abteilungen/:abteilungSlugOrId',
        displayName: 'Abteilungen Details',
        showInMenue: false,
        exact: true,
        view: withAuthenticationRequired(AbteilungDetail)
    },
    {
        key: '/abteilungen/:abteilungSlugOrId/mat',
        displayName: 'Abteilungen Material',
        showInMenue: false,
        exact: true,
        view: withAuthenticationRequired(AbteilungMaterialView)
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
        view: withAuthenticationRequired(UsersView)
    },
    {
        key: '/profile',
        displayName: 'Profile',
        icon: <UserOutlined />,
        public: false,
        private: true,
        showInMenue: true,
        exact: true,
        view: withAuthenticationRequired(ProfileView)
    }
]
