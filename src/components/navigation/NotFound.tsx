import classNames from 'classnames';
import appStyles from 'styles.module.scss';
import { Button, PageHeader, Result, Typography } from 'antd';
import { useAuth0 } from '@auth0/auth0-react';
import ceviLogoImage from "assets/cevi_logo.png";
import { useNavigate } from 'react-router';

export const NotFoundView = () => {

    const navigate = useNavigate();
    return <Result
        status='404'
        title='Seite nicht gefunden'
        // subTitle='Du must angemeldet sein, um das Dashboard benutzen zu können.'
        extra={[
            <Button
                key='homepage'
                type='primary'
                onClick={() => navigate('/')}
            >Zurück zur Startseite</Button>
        ]}
    >
    </Result>
}
