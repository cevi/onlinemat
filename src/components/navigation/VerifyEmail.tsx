import { MailOutlined } from '@ant-design/icons';
import { useAuth0 } from '@auth0/auth0-react';
import { Button, Result } from 'antd';
import { auth } from 'config/firebase/firebase';

export const VerifyEmail = () => {

    const { isLoading, logout, loginWithRedirect } = useAuth0();

    return <Result
        icon={<MailOutlined />}
        title='Bitte bestätige deine Email'
        subTitle='Du must deine Email bestätigen um das Onlinemat benutzen zu können. Bitte überprüfe auch deinen Spam-Ordner.'
        extra={[
            <Button
                disabled={isLoading}
                key='reload'
                type='primary'
                onClick={async () => {
                    await auth().signOut(); 
                    await logout();
                    loginWithRedirect();
                }}
            >Ich habe meine Email bestätigt</Button>
        ]}
    />
}
