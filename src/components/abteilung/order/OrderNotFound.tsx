import { Button, Result } from 'antd';
import { useNavigate } from 'react-router';
import { Abteilung } from 'types/abteilung.type';

export interface OrderNotFoundProps {
    abteilung: Abteilung
    orderId: string | undefined
}

export const OrderNotFound = (props: OrderNotFoundProps) => {

    const { abteilung, orderId } = props;

    const navigate = useNavigate();
    const abteilungMatLink = `/abteilungen/${abteilung.slug || abteilung.id}/mat`;

    return <Result
        status='404'
        title={`Die Bestellung ${orderId} konnte nicht gefunden werden.`}
        extra={
            <Button onClick={()=> { navigate(abteilungMatLink) }}>Zurück</Button>
        }
    />
}