import { useAuth0 } from '@auth0/auth0-react';
import { Col, Comment, message, Row, Spin, Tag, Timeline } from 'antd';
import { abteilungenCollection, abteilungenOrdersCollection } from 'config/firebase/collections';
import { firestore } from 'config/firebase/firebase';
import moment from 'moment';
import { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { Abteilung } from 'types/abteilung.type';
import { Order } from 'types/order.types';
import { dateFormat, dateFormatWithTime } from 'util/MaterialUtil';
import { OrderItems } from './OrderItems';
import { DetailedCartItem } from 'types/cart.types';
import { MaterialsContext, MembersContext, MembersUserDataContext } from '../AbteilungDetails';
import { getGroupName } from 'util/AbteilungUtil';
import { getStatusColor, getStatusName } from 'util/OrderUtil';
import TextArea from 'antd/lib/input/TextArea';

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
    const [cartItemsMerged, setCartItemsMerged] = useState<DetailedCartItem[]>([]);

    //fetch materials
    const materialsContext = useContext(MaterialsContext);

    const materials = materialsContext.materials;
    const matLoading = materialsContext.loading;

    //fetch members
    const membersContext = useContext(MembersContext);

    const members = membersContext.members;
    const membersLoading = membersContext.loading;

    //fetch userData
    const membersUserDataContext = useContext(MembersUserDataContext);

    const userData = membersUserDataContext.userData;
    const userDataLoading = membersUserDataContext.loading;


    const membersMerged = members.map(member => ({ ...member, ...(userData[member.userId] || { displayName: 'Loading...' }) }));

    const orderer = membersMerged.find(m => m.id === order?.orderer);

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

    useEffect(() => {
        const localItemsMerged: DetailedCartItem[] = [];
        order?.items.forEach(item => {
            const mat = materials.find(m => m.id === item.matId);
            const maxCount = mat ? (!!mat.consumables ? 1 : mat.count) : 1
            const mergedItem: DetailedCartItem = {
                ...item,
                name: mat && mat.name || 'Loading...',
                maxCount,
                imageUrls: mat && mat.imageUrls || [],
                __caslSubjectType__: 'DetailedCartItem'
            }
            localItemsMerged.push(mergedItem);
        })
        setCartItemsMerged(localItemsMerged);
    }, [order, materials])

    if (orderLoading || matLoading) return <Spin />;

    return <Row gutter={[16, 16]}>
        <Col span={6}>
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <h1>{`${getGroupName(order?.groupId, abteilung, order?.customGroupName)} ${order?.startDate.format(dateFormat)}`}{order?.startDate.format(dateFormat) !== order?.endDate.format(dateFormat) && ` - ${order?.endDate.format(dateFormat)}`}</h1>
                </Col>
                <Col span={24}>
                    <p><b>Besteller:</b>{` ${orderer ? orderer.displayName : order?.orderer}`}</p>
                    <p><b>Von:</b>{` ${order?.startDate.format(dateFormatWithTime)}`}</p>
                    <p><b>Bis:</b>{` ${order?.endDate.format(dateFormatWithTime)}`}</p>
                    <p><b>{'Status '}</b><Tag color={getStatusColor(order?.status)}>{getStatusName(order?.status)}</Tag></p>
                </Col>
                <Col span={24}>
                    <Timeline mode='left' >
                        <Timeline.Item label={order?.creationTime.format(dateFormatWithTime)}>Bestellung erstellt</Timeline.Item>
                        <Timeline.Item>Solve initial network problems 2015-09-01</Timeline.Item>
                        <Timeline.Item>Technical testing 2015-09-01</Timeline.Item>
                        <Timeline.Item>Network problems being solved 2015-09-01</Timeline.Item>
                    </Timeline>
                </Col>
            </Row>
        </Col>
        <Col offset={2} span={16}>
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <OrderItems items={cartItemsMerged} />
                </Col>
                <Col span={24}>
                    {order?.comment && <Comment
                        actions={undefined}
                        author={orderer ? orderer.displayName : order?.orderer}
                        avatar={undefined}
                        content={order?.comment}
                        datetime={order?.creationTime.format(dateFormatWithTime)}
                    />}
                </Col>
            </Row>
        </Col>
    </Row>


}