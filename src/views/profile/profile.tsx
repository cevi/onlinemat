import React from 'react';
import classNames from 'classnames';
import appStyles from 'styles.module.scss';
import { PageHeader, Spin, Card } from 'antd';
import { useAuth0 } from '@auth0/auth0-react';
import Meta from 'antd/lib/card/Meta';
import Avatar from 'antd/lib/avatar/avatar';
import { Auth0User } from 'types/auth0.types';
import moment from 'moment';
import { useUser } from 'hooks/use-user';

export const ProfileView = () => {
    const { user, isAuthenticated, isLoading  } = useAuth0();
    const firebaseUser = useUser();
    


    return <div className={classNames(appStyles['flex-grower'], appStyles['center-container-stretch'])}>
        <PageHeader title='Profile'></PageHeader>
        {
            isLoading && <Spin size="large" />
        }
        {
            (!!user && isAuthenticated) && <div className={classNames(appStyles['flex-grower'], appStyles['center-container'])}>
                <Card loading={isLoading}>
                    <Meta
                        avatar={
                            <Avatar src={user.picture ? user.picture : 'https://static.asianetnews.com/img/default-user-avatar.png'} />
                        }
                        title={(user as Auth0User).name}
                        description={(user as Auth0User).email}
                    />
                    <p>Name: {(user as Auth0User).name}</p>
                    <p>Given Name: {(user as Auth0User).given_name}</p>
                    <p>Nickname: {(user as Auth0User).nickname}</p>
                    <p>Email: {(user as Auth0User).email}</p>
                    <p>Email is Verified: {(user as Auth0User).email_verified ? 'Ja' : 'Nein'}</p>
                    <p>Firebase Token: {(user as Auth0User)['https://mat.cevi.tools/firebase_token'] ? 'Ja' : 'Nein'}</p>
                    <p>Locale: {(user as Auth0User).locale}</p>
                    <p>Picture: {(user as Auth0User).picture ? 'Ja' : 'Nein'}</p>
                    <p>Sub: {(user as Auth0User).sub}</p>
                    <p>Updated at: {moment((user as Auth0User).updated_at).format('L LT')}</p>
                    <p>Firebase User ID: {(firebaseUser.appUser && firebaseUser.appUser.firebaseUser.uid) || '-'}</p>
                </Card>
            </div>
        }
    </div>
}
