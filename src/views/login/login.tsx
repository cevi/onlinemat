import React from 'react';
import { Button } from 'antd';
import { useAuth0 } from '@auth0/auth0-react';
import classNames from 'classnames';
import appStyles from 'styles.module.scss';

export const LoginView = () => {
    const { loginWithRedirect, isLoading } = useAuth0();

    return  <div className={classNames(appStyles['flex-grower'], appStyles['center-container'])}>
                <Button type='primary' size='large' htmlType='submit' style={{ width: '30%' }} loading={isLoading} onClick={() => loginWithRedirect()}>Anmelden</Button>
            </div>
}
