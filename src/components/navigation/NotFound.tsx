import { Button, Result } from 'antd';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';

export const NotFoundView = () => {
    const { t } = useTranslation('navigation');

    const navigate = useNavigate();
    return <Result
        status='404'
        title={t('navigation:notFound.title')}
        // subTitle='Du must angemeldet sein, um das Dashboard benutzen zu können.'
        extra={[
            <Button
                key='homepage'
                type='primary'
                onClick={() => navigate('/')}
            >{t('navigation:notFound.backToHome')}</Button>
        ]}
    />
}
