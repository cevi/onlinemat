import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import appStyles from 'styles.module.scss';
import { PageHeader, Spin, Card, message } from 'antd';
import { useAuth0 } from '@auth0/auth0-react';
import Meta from 'antd/lib/card/Meta';
import Avatar from 'antd/lib/avatar/avatar';
import { Auth0User } from 'types/auth0.types';
import moment from 'moment';
import { useUser } from 'hooks/use-user';
import { UserData } from 'types/user.type';

export const ProfileView = () => {
    const { user, isAuthenticated, isLoading } = useAuth0();
    const userState = useUser();



    return <div className={classNames(appStyles['flex-grower'], appStyles['center-container-stretch'])}>
        <PageHeader title='Profile'></PageHeader>
        {
            userState.loading && <Spin size="large" />
        }
        {
            (!!user && isAuthenticated) && <div className={classNames(appStyles['flex-grower'], appStyles['center-container'])}>
                <Card loading={isLoading || userState.loading}>
                    <Meta
                        avatar={
                            <Avatar src={user.picture ? user.picture : 'https://static.asianetnews.com/img/default-user-avatar.png'} />
                        }
                        title={userState.appUser?.userData.displayName}
                        description={(user as Auth0User).email}
                    />
                    <p>Name: {userState.appUser?.userData.name}</p>
                    <p>Given Name: {userState.appUser?.userData.given_name}</p>
                    <p>Familiy Name: {userState.appUser?.userData.family_name}</p>
                    <p>Nickname: {userState.appUser?.userData.nickname}</p>
                    <p>Email: {userState.appUser?.userData.email}</p>
                    <p>Email is Verified: {userState.appUser?.userData.email_verified ? 'Ja' : 'Nein'}</p>
                    <p>Firebase Token: {(user as Auth0User)['https://mat.cevi.tools/firebase_token'] ? 'Ja' : 'Nein'}</p>
                    <p>Locale: {(user as Auth0User).locale}</p>
                    <p>Picture: {(user as Auth0User).picture ? 'Ja' : 'Nein'}</p>
                    <p>Sub: {(user as Auth0User).sub}</p>
                    <p>Updated at: {moment((user as Auth0User).updated_at).format('L LT')}</p>
                    <p>Firebase User ID: {(userState.appUser && userState.appUser.firebaseUser.uid) || '-'}</p>
                    <p>Staff: {userState.appUser?.userData?.staff ? 'Ja' : 'Nein'}</p>
                </Card>
            </div>
        }
    </div>
}
