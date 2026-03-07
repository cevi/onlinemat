import { Button, Result } from 'antd';
import { useNavigate } from 'react-router';
import { Abteilung } from 'types/abteilung.type';
import { useTranslation } from 'react-i18next';

export interface OrderNotFoundProps {
    abteilung: Abteilung
    orderId: string | undefined
}

export const OrderNotFound = (props: OrderNotFoundProps) => {

    const { abteilung, orderId } = props;

    const navigate = useNavigate();
    const { t } = useTranslation();
    const abteilungMatLink = `/abteilungen/${abteilung.slug || abteilung.id}/mat`;

    return <Result
        status='404'
        title={t('order:view.notFound', { orderId })}
        extra={
            <Button onClick={()=> { navigate(abteilungMatLink) }}>{t('common:buttons.back')}</Button>
        }
    />
}