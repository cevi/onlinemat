import { MailOutlined } from '@ant-design/icons';
import { useAuth0 } from '@auth0/auth0-react';
import { Button, Result } from 'antd';
import { auth } from 'config/firebase/firebase';
import { signOut } from 'firebase/auth';
import { useTranslation } from 'react-i18next';

export const VerifyEmail = () => {
    const { t } = useTranslation('navigation');

    const { isLoading, logout, loginWithRedirect } = useAuth0();

    return <Result
        icon={<MailOutlined />}
        title={t('navigation:verifyEmail.title')}
        subTitle={t('navigation:verifyEmail.subtitle')}
        extra={[
            <Button
                disabled={isLoading}
                key='reload'
                type='primary'
                onClick={async () => {
                    await signOut(auth);
                    await logout();
                    loginWithRedirect();
                }}
            >{t('navigation:verifyEmail.confirmed')}</Button>
        ]}
    />
}
