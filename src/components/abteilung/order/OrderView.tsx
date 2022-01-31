import { useAuth0 } from '@auth0/auth0-react';
import { Button, Col, Comment, Form, message, Row, Spin, Tag, Timeline, Tooltip } from 'antd';
import { abteilungenCollection, abteilungenOrdersCollection } from 'config/firebase/collections';
import { firestore } from 'config/firebase/firebase';
import moment from 'moment';
import { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { Abteilung } from 'types/abteilung.type';
import { Order, OrderHistory } from 'types/order.types';
import { dateFormat, dateFormatWithTime } from 'util/MaterialUtil';
import { OrderItems } from './OrderItems';
import { DetailedCartItem } from 'types/cart.types';
import { MaterialsContext, MembersContext, MembersUserDataContext } from '../AbteilungDetails';
import { getGroupName } from 'util/AbteilungUtil';
import { addCommentOrder, deliverOrder, getStatusColor, getStatusName } from 'util/OrderUtil';
import TextArea from 'antd/lib/input/TextArea';
import { ability } from 'config/casl/ability';
import { OrderNotFound } from './OrderNotFound';
import { useUser } from 'hooks/use-user';
import { CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

export interface OrderProps {
    abteilung: Abteilung
}

export type OrderViewParams = {
    abteilungSlugOrId: string;
    orderId: string
};

export const OrderView = (props: OrderProps) => {

    const { abteilung } = props;

    const { orderId } = useParams<OrderViewParams>();

    const { isAuthenticated } = useAuth0();

    const user = useUser();

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

    const [detailedHistory, setDetailedHistory] = useState<OrderHistory[]>([]);
    const [matChefComment, setMatchefComment] = useState<string | undefined>(undefined);

    //fetch order
    useEffect(() => {
        if (!isAuthenticated || !abteilung) return;
        setOrderLoading(true);
        const ordersRef = firestore().collection(abteilungenCollection).doc(abteilung.id).collection(abteilungenOrdersCollection).doc(orderId);


        return ordersRef.onSnapshot(snap => {
            setOrderLoading(false);
            if (!snap.exists) return;
            const orderLoaded = {
                ...snap.data() as Order,
                __caslSubjectType__: 'Order',
                id: snap.id,
                startDate: moment((snap.data() as any).startDate.toDate()),
                endDate: moment((snap.data() as any).endDate.toDate()),
                creationTime: moment((snap.data() as any).creationTime.toDate()),
                history: ((snap.data() as Order).history || []).map(h => {
                    return {
                        ...h,
                        timestamp: (h.timestamp as any).toDate()
                    } as OrderHistory
                })
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

    useEffect(() => {
        if (!order) return;
        if (!matChefComment) {
            setMatchefComment(order.matchefComment)
        }
        setDetailedHistory(mergeHistory(order?.history))
    }, [order])

    const getDotIcon = (icon: OrderHistory['type'], color?: string | null) => {
        if (!icon) return undefined;

        const colorToSet = color === null ? undefined : color;

        switch (icon) {
            case 'creation':
                return <CheckCircleOutlined style={{ fontSize: '16px' }} color={colorToSet} />
            case 'startDate':
            case 'endDate':
                return <ClockCircleOutlined style={{ fontSize: '16px' }} color={colorToSet} />
            case 'matchefComment':
                return <ExclamationCircleOutlined style={{ fontSize: '16px' }} color={colorToSet}/>
        }
    }

    const mergeHistory = (history: OrderHistory[]): OrderHistory[] => {
        if (!order) return [];
        const merged = [...history] || [];
        //order creation
        merged.push({
            timestamp: order.creationTime.toDate(),
            color: 'green',
            text: `${`${orderer ? orderer.displayName : order?.orderer}`} hat die Bestellung erstellt.`,
            type: 'creation'
        })
        //startDate for order
        merged.push({
            timestamp: order.startDate.toDate(),
            color: order.startDate.isSameOrBefore(moment()) ? null : 'grey',
            text: `Start der Bestellung`,
            type: 'startDate'
        })
        //endDate for order
        merged.push({
            timestamp: order.endDate.toDate(),
            color: order.endDate.isSameOrBefore(moment()) ? null : 'grey',
            text: `Ende der Bestellung`,
            type: 'endDate'
        })
        return merged.sort((a: OrderHistory, b: OrderHistory) => a.timestamp.valueOf() - b.timestamp.valueOf());
    }

    const getMatchefInfo = (): OrderHistory | undefined => {
        if(!order) return;
        const comment = order.history.sort((a: OrderHistory, b: OrderHistory) => b.timestamp.valueOf() - a.timestamp.valueOf()).find(h => h.type === 'matchefComment');
        return comment;
    }

    if (orderLoading || matLoading) return <Spin />;

    if (!order) return <OrderNotFound abteilung={abteilung} orderId={orderId} />

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
                        {
                            detailedHistory.map(orderHistory => {
                                return <Timeline.Item
                                    label={moment(orderHistory.timestamp).format(dateFormatWithTime)}
                                    color={orderHistory.color || undefined}
                                    dot={getDotIcon(orderHistory.type, orderHistory.color)}
                                >
                                    {orderHistory.text}
                                </Timeline.Item>
                            })
                        }
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
                    

                    {
                        //Comment option for admin / matchef
                        ability.can('deliver', {
                            ...order,
                            abteilungId: abteilung.id
                        }) ? <>
                            <Form.Item label='Bemerkung'>
                                <TextArea
                                    value={matChefComment}
                                    onChange={(e) => setMatchefComment(e.currentTarget.value)}
                                    placeholder='Bemerkung hinzufügen'
                                />
                            </Form.Item>
                            <Form.Item>
                                <Button type='primary' onClick={async () => {
                                    await addCommentOrder(abteilung.id, order, matChefComment, (!user || !user.appUser || !user.appUser.userData) ? 'Unbekannt' : user.appUser.userData.displayName)
                                }}>
                                    Bemerkung speichern
                                </Button>
                            </Form.Item>
                            
                        </>
                        :
                            order?.matchefComment && <Comment
                               actions={undefined}
                               author={getMatchefInfo()?.text.split('hat')[0] || 'Matchef'}
                               avatar={undefined}
                               content={order?.matchefComment}
                               datetime={moment(getMatchefInfo()?.timestamp).format(dateFormatWithTime)}
                           />
                    }
                </Col>
                <Col span={24}>
                    {
                        ability.can('deliver', {
                            ...order,
                            abteilungId: abteilung.id
                        }) && order.status === 'created' && <Tooltip title='Bestätige das das Material bereit liegt.'>
                            <Button
                                type='primary'
                                style={{ display: 'block', marginLeft: 'auto', marginRight: 0 }}
                                onClick={() => deliverOrder(abteilung.id, order, (!user || !user.appUser || !user.appUser.userData) ? 'Unbekannt' : user.appUser.userData.displayName)}
                            >
                                Ausgeben
                            </Button>
                        </Tooltip>
                    }
                </Col>
            </Row>
        </Col>
    </Row>


}