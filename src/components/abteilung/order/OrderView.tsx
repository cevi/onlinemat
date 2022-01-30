import { useAuth0 } from '@auth0/auth0-react';
import { Col, message, Row, Timeline } from 'antd';
import { abteilungenCollection, abteilungenOrdersCollection } from 'config/firebase/collections';
import { firestore } from 'config/firebase/firebase';
import moment from 'moment';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { Abteilung } from 'types/abteilung.type';
import { Order } from 'types/order.types';
import { dateFormatWithTime } from 'util/MaterialUtil';

export interface OrderProps {
    abteilung: Abteilung
}

export type OrderViewParams = {
    abteilungSlugOrId: string;
    orderId: string
};

export const OrderView = (props: OrderProps) => {

    const { abteilung } = props;

    const { abteilungSlugOrId, orderId } = useParams<OrderViewParams>();

    const { isAuthenticated } = useAuth0();

    const [order, setOrder] = useState<Order | undefined>(undefined);
    const [orderLoading, setOrderLoading] = useState(false);

    //fetch order
    useEffect(() => {
        if (!isAuthenticated || !abteilung) return;
        setOrderLoading(true);
        let ordersRef = firestore().collection(abteilungenCollection).doc(abteilung.id).collection(abteilungenOrdersCollection).doc(orderId);

        return ordersRef.onSnapshot(snap => {
            setOrderLoading(false);
            const orderLoaded = {
                    ...snap.data() as Order,
                    __caslSubjectType__: 'Order',
                    id: snap.id,
                    startDate: moment((snap.data() as any).startDate.toDate()),
                    endDate: moment((snap.data() as any).endDate.toDate()),
                    creationTime: moment((snap.data() as any).creationTime.toDate())
                } as Order;
            setOrder(orderLoaded);
        }, (err) => {
            message.error(`Es ist ein Fehler aufgetreten ${err}`)
        });
    }, [isAuthenticated]);

    return <Row gutter={[16, 16]}>
        <Col span={12}>
            <Timeline mode='left'>
                <Timeline.Item label={order?.creationTime.format(dateFormatWithTime)}>Bestellung erstellt</Timeline.Item>
                <Timeline.Item>Solve initial network problems 2015-09-01</Timeline.Item>
                <Timeline.Item>Technical testing 2015-09-01</Timeline.Item>
                <Timeline.Item>Network problems being solved 2015-09-01</Timeline.Item>
            </Timeline>
        </Col>
        <Col span={12}>
            <p>{orderId}</p>
        </Col>
    </Row>


}