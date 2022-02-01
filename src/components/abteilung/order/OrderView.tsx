import { useAuth0 } from '@auth0/auth0-react';
import { Button, Col, Comment, Form, message, Popconfirm, Row, Spin, Tag, Timeline, Tooltip } from 'antd';
import { abteilungenCollection, abteilungenOrdersCollection } from 'config/firebase/collections';
import { firestore } from 'config/firebase/firebase';
import moment from 'moment';
import { useContext, useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { Abteilung } from 'types/abteilung.type';
import { Order, OrderHistory } from 'types/order.types';
import { dateFormat, dateFormatWithTime, getAvailableMatCount } from 'util/MaterialUtil';
import { OrderItems } from './OrderItems';
import { DetailedCartItem } from 'types/cart.types';
import { MaterialsContext, MembersContext, MembersUserDataContext } from '../AbteilungDetails';
import { getGroupName } from 'util/AbteilungUtil';
import { addCommentOrder, completeOrder, deleteOrder, deliverOrder, getStatusColor, getStatusName, resetLostOrder, resetOrder } from 'util/OrderUtil';
import TextArea from 'antd/lib/input/TextArea';
import { ability } from 'config/casl/ability';
import { OrderNotFound } from './OrderNotFound';
import { useUser } from 'hooks/use-user';
import { CheckCircleOutlined, ClockCircleOutlined, DeleteOutlined, ExclamationCircleOutlined, UndoOutlined } from '@ant-design/icons';
import { DamagedMaterialModal } from './DamagedMaterialModal';
import { Can } from 'config/casl/casl';

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
    const navigate = useNavigate();

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

    const abteilungOrdersLink = `/abteilungen/${abteilung.slug || abteilung.id}/orders`;

    const orderer = membersMerged.find(m => m.id === order?.orderer);

    const [detailedHistory, setDetailedHistory] = useState<OrderHistory[]>([]);
    const [matChefComment, setMatchefComment] = useState<string | undefined>(undefined);

    const [damagedMaterial, setDamagedMaterial] = useState<DetailedCartItem[]>([]);
    const [showDamageModal, setShowDamageModal] = useState<boolean>(false);

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
            console.error('Es ist ein Fehler aufgetreten', err)
        });
    }, [isAuthenticated]);

    useEffect(() => {
        const localItemsMerged: DetailedCartItem[] = [];
        order?.items.forEach(item => {
            const mat = materials.find(m => m.id === item.matId);
            const maxCount = getAvailableMatCount(mat);
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
            case 'completed':
            case 'completed-damaged':
                return <CheckCircleOutlined style={{ fontSize: '16px' }} color={colorToSet} />
            case 'startDate':
            case 'endDate':
                return <ClockCircleOutlined style={{ fontSize: '16px' }} color={colorToSet} />
            case 'matchefComment':
                return <ExclamationCircleOutlined style={{ fontSize: '16px' }} color={colorToSet} />
            case 'reset':
                return <UndoOutlined style={{ fontSize: '16px' }} color={colorToSet} />
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
        if (!order) return;
        const comment = order.history.sort((a: OrderHistory, b: OrderHistory) => b.timestamp.valueOf() - a.timestamp.valueOf()).find(h => h.type === 'matchefComment');
        return comment;
    }

    const MaterialAction = () => {
        if (!order) return <></>;
        if (order.status === 'created') {
            return <Tooltip placement='bottom' title='Bestätige das das Material bereit liegt.'>
                <Button
                    type='primary'
                    onClick={() => deliverOrder(abteilung.id, order, (!user || !user.appUser || !user.appUser.userData) ? 'Unbekannt' : user.appUser.userData.displayName)}
                >
                    Ausgeben
                </Button>
            </Tooltip>;
        }

        //No mat was damged / lost
        if (order.status === 'delivered' && damagedMaterial.length <= 0) {
            return <Tooltip placement='bottom' title='Bestätige das das Material vollständig zurückgegeben wurde.'>
                <Button
                    type='primary'
                    onClick={() => completeOrder(abteilung.id, order, (!user || !user.appUser || !user.appUser.userData) ? 'Unbekannt' : user.appUser.userData.displayName)}
                >
                    Abschliessen
                </Button>
            </Tooltip>;
        }

        //Some mat is damaged /lost
        if (order.status === 'delivered') {
            return <Tooltip placement='bottom' title='Bestätige das das Material teilweise beschädigt/unvollständig zurückgegeben wurde.'>
                <Button
                    type='ghost'
                    danger
                    onClick={() => setShowDamageModal(!showDamageModal)}
                >
                    Teilweise Abschliessen
                </Button>
            </Tooltip>;
        }

        if (order.status === 'completed' || order.status === 'completed-damaged') {
            return <Tooltip placement='bottom' title='Der Status der Bestellung wird auf "erstellt" zurückgesetzt.'>
                <Popconfirm
                    title='Der Status der Bestellung wird auf "erstellt" zurückgesetzt.'
                    onConfirm={async () => {
                        await resetLostOrder(abteilung.id, order, (!user || !user.appUser || !user.appUser.userData) ? 'Unbekannt' : user.appUser.userData.displayName, materials)
                        setDamagedMaterial([])
                    }}
                    onCancel={() => { }}
                    okText='Ja'
                    cancelText='Nein'
                >
                    <Button
                        type='ghost'
                        danger
                        icon={<UndoOutlined />}
                    >
                        Zurücksetzen
                    </Button>
                </Popconfirm>

            </Tooltip>;
        }


        return <></>
    }

    if (orderLoading || matLoading) return <Spin />;

    if (!order) return <OrderNotFound abteilung={abteilung} orderId={orderId} />

    return <Row gutter={[16, 16]}>
        <Col span={7}>
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <h1>{`${getGroupName(order?.groupId, abteilung, order?.customGroupName)} ${order?.startDate.format(dateFormat)}`}{order?.startDate.format(dateFormat) !== order?.endDate.format(dateFormat) && ` - ${order?.endDate.format(dateFormat)}`}</h1>
                </Col>
                <Col span={24}>
                    <p><b>Besteller:</b>{` ${orderer ? orderer.displayName : order?.orderer}`}</p>
                    <p><b>Von:</b>{` ${order?.startDate.format(dateFormatWithTime)}`}</p>
                    <p><b>Bis:</b>{` ${order?.endDate.format(dateFormatWithTime)}`}</p>
                    <p><b>{'Status '}</b><Tag color={getStatusColor(order)}>{getStatusName(order)}</Tag></p>
                </Col>
                <Col span={24}>
                    <div
                        id='scrollableDiv'
                        style={{
                            maxHeight: 500,
                            overflow: 'auto',
                            padding: '10px 16px 0 0',
                        }}
                    >
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
                    </div>
                </Col>
            </Row>
        </Col>
        <Col offset={1} span={16}>
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <OrderItems items={cartItemsMerged} showCheckBoxes={ability.can('deliver', {
                        ...order,
                        abteilungId: abteilung.id
                    }) && order.status === 'delivered'}

                        damagedMaterials={order.damagedMaterial || undefined}
                        damagedMaterialsCheckboxes={damagedMaterial}
                        setDamagedMaterialCheckboxes={setDamagedMaterial}
                    />
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
                        }) && order.status !== 'completed' ? <>
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
                    <div style={{display: 'flex', justifyContent: 'right'}}>
                        <Can I='delete' this={{
                            ...order,
                            abteilungId: abteilung.id
                        }}
                        >
                            <Popconfirm
                                title='Möchtest du die Bestellung wirklich löschen?'
                                onConfirm={async () => {
                                    await deleteOrder(abteilung, order, materials, user)
                                    navigate(abteilungOrdersLink)
                                }}
                                onCancel={() => { }}
                                okText='Ja'
                                cancelText='Nein'
                                disabled={order.status === 'delivered'}
                            >
                                <Button type='ghost' danger icon={<DeleteOutlined />} disabled={order.status === 'delivered'}>Löschen</Button>
                            </Popconfirm>
                        </Can>
                        <div style={{marginLeft: '1%', marginRight: '1%'}}></div>
                        <Can I='deliver' this={{
                            ...order,
                            abteilungId: abteilung.id
                        }}
                        >
                            <MaterialAction />
                        </Can>
                    </div>
                </Col>
                <DamagedMaterialModal abteilung={abteilung} order={order} damagedMaterial={damagedMaterial} showDamageModal={showDamageModal} setShowDamageModal={setShowDamageModal} />
            </Row>
        </Col>
    </Row>


}