import { Button, Result } from 'antd';
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
    />
}
