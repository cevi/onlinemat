import React from 'react';
import { HomeOutlined, LoginOutlined, UserOutlined, TeamOutlined } from '@ant-design/icons'
import { HomeView } from 'views/home/home';
import { LoginView } from 'views/login/login';
import { ProfileView } from 'views/profile/profile';
import { AbteilungenView } from 'views/abteilungen/abteilungen';


export interface AppRoute {
    key: string
    displayName: string
    icon: JSX.Element
    // is this route available when the user is *not* logged in
    public?: boolean
    // is this route available when the user *is* logged in
    private?: boolean
    // if this route is available when signed in, does it require the user to be admin?
    adminOnly?: boolean
    // include this route in the sidebar
    showInMenue: boolean
    view: React.FC
}

export const HomeRoute: AppRoute = {
    key: '/',
    displayName: 'Home',
    icon: <HomeOutlined />,
    showInMenue: true,
    view: HomeView
}

export const AppRoutes: AppRoute[] = [
    {
        key: '/login',
        displayName: 'Login',
        icon: <LoginOutlined />,
        public: true,
        showInMenue: false,
        view: LoginView
    },
    {
        key: '/abteilungen',
        displayName: 'Abteilungen',
        icon: <TeamOutlined />,
        public: false,
        private: true,
        adminOnly: true,
        showInMenue: true,
        view: AbteilungenView
    },
    {
        key: '/profile',
        displayName: 'Profile',
        icon: <UserOutlined />,
        public: false,
        private: true,
        showInMenue: true,
        view: ProfileView
    }
]
