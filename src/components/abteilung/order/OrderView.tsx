import { useAuth0 } from '@auth0/auth0-react';
import { Button, Card, Col, Form, Input, message, Popconfirm, Row, Spin, Tag, Timeline, Tooltip } from 'antd';
import { abteilungenCollection, abteilungenOrdersCollection } from 'config/firebase/collections';
import { db } from 'config/firebase/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import dayjs from 'dayjs';
import { useContext, useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { Abteilung } from 'types/abteilung.type';
import { Order, OrderHistory } from 'types/order.types';
import { dateFormat, dateFormatWithTime } from 'util/constants';
import { getAvailableMatCount } from 'util/MaterialUtil';
import { OrderItems } from './OrderItems';
import { DetailedCartItem } from 'types/cart.types';
import { MaterialsContext, MembersContext, MembersUserDataContext } from '../AbteilungDetails';
import { getGroupName } from 'util/AbteilungUtil';
import { addCommentOrder, calculateTotalWeight, completeOrder, deleteOrder, deliverOrder, getStatusColor, getStatusName, resetLostOrder, resetOrder } from 'util/OrderUtil';
import { ability } from 'config/casl/ability';
import { OrderNotFound } from './OrderNotFound';
import { useUser } from 'hooks/use-user';
import { CheckCircleOutlined, ClockCircleOutlined, DeleteOutlined, ExclamationCircleOutlined, UndoOutlined } from '@ant-design/icons';
import { DamagedMaterialModal } from './DamagedMaterialModal';
import { Can } from 'config/casl/casl';
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation();

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


    const membersMerged = members.map(member => ({ ...member, ...(userData[member.userId] || { displayName: t('common:status.loading') }) }));

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
        const ordersRef = doc(db, abteilungenCollection, abteilung.id, abteilungenOrdersCollection, orderId!);

        return onSnapshot(ordersRef, (snap) => {
            setOrderLoading(false);
            if (!snap.exists()) return;
            const orderLoaded = {
                ...snap.data() as Order,
                __caslSubjectType__: 'Order',
                id: snap.id,
                startDate: dayjs((snap.data() as any).startDate.toDate()),
                endDate: dayjs((snap.data() as any).endDate.toDate()),
                creationTime: dayjs((snap.data() as any).creationTime.toDate()),
                history: ((snap.data() as Order).history || []).map(h => {
                    return {
                        ...h,
                        timestamp: (h.timestamp as any).toDate()
                    } as OrderHistory
                })
            } as Order;
            setOrder(orderLoaded);
        }, (err) => {
            if ((err as any).code === 'permission-denied') return;
            message.error(t('common:errors.generic', { error: err }))
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
                name: mat?.name || (matLoading ? t('common:status.loading') : t('material:util.deleted')),
                maxCount,
                imageUrls: mat && mat.imageUrls || [],
                __caslSubjectType__: 'DetailedCartItem'
            }
            localItemsMerged.push(mergedItem);
        })
        setCartItemsMerged(localItemsMerged);
    }, [order, materials])



    useEffect(() => {
        if(!membersLoading && !userDataLoading) {
            if (!order) return;
            if (!matChefComment) {
                setMatchefComment(order.matchefComment)
            }
            setDetailedHistory(mergeHistory(order?.history))
        }
    }, [membersLoading, userDataLoading, order])

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
            text: t('order:history.created', { name: orderer ? orderer.displayName : order?.orderer }),
            type: 'creation'
        })
        //startDate for order
        merged.push({
            timestamp: order.startDate.toDate(),
            color: order.startDate.isSameOrBefore(dayjs()) ? null : 'grey',
            text: t('order:history.startDate'),
            type: 'startDate'
        })
        //endDate for order
        merged.push({
            timestamp: order.endDate.toDate(),
            color: order.endDate.isSameOrBefore(dayjs()) ? null : 'grey',
            text: t('order:history.endDate'),
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
            return <Tooltip placement='bottom' title={t('order:actions.deliverTooltip')}>
                <Button
                    type='primary'
                    onClick={() => deliverOrder(abteilung.id, order, (!user || !user.appUser || !user.appUser.userData) ? 'Unbekannt' : user.appUser.userData.displayName)}
                >
                    {t('order:actions.deliver')}
                </Button>
            </Tooltip>;
        }

        //No mat was damged / lost
        if (order.status === 'delivered' && damagedMaterial.length <= 0) {
            return <Tooltip placement='bottom' title={t('order:actions.completeTooltip')}>
                <Button
                    type='primary'
                    onClick={() => completeOrder(abteilung.id, order, (!user || !user.appUser || !user.appUser.userData) ? 'Unbekannt' : user.appUser.userData.displayName)}
                >
                    {t('order:actions.complete')}
                </Button>
            </Tooltip>;
        }

        //Some mat is damaged /lost
        if (order.status === 'delivered') {
            return <Tooltip placement='bottom' title={t('order:actions.completePartialTooltip')}>
                <Button
                    type='ghost'
                    danger
                    onClick={() => setShowDamageModal(!showDamageModal)}
                >
                    {t('order:actions.completePartial')}
                </Button>
            </Tooltip>;
        }

        

        if (order.status === 'completed' || order.status === 'completed-damaged') {
            return <Tooltip placement='bottom' title={t('order:actions.resetTooltip')}>
                <Popconfirm
                    title={t('order:actions.resetConfirm')}
                    onConfirm={async () => {
                        await resetLostOrder(abteilung.id, order, (!user || !user.appUser || !user.appUser.userData) ? 'Unbekannt' : user.appUser.userData.displayName, materials)
                        setDamagedMaterial([])
                    }}
                    onCancel={() => { }}
                    okText={t('common:confirm.yes')}
                    cancelText={t('common:confirm.no')}
                >
                    <Button
                        type='ghost'
                        danger
                        icon={<UndoOutlined />}
                    >
                        {t('order:actions.reset')}
                    </Button>
                </Popconfirm>

            </Tooltip>;
        }


        return <></>
    }

    const Weight = () => {
        if(!order) return <>{t('common:status.loading')}</>
        const res = calculateTotalWeight(order, materials);
        const incompleteInfo = res.incompleteCount > 0 ? t('order:view.weightInfoIncomplete', { complete: order.items.length - res.incompleteCount, total: order.items.length }) : '';
        return <Tooltip key={`weight_${order.id}`} title={t('order:view.weightTooltip')}>{t('order:view.weightInfo', { totalWeight: res.totalWeight, incompleteInfo })}</Tooltip>
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
                    <p><b>{t('order:view.orderer')}</b>{` ${orderer ? orderer.displayName : order?.orderer}`}</p>
                    <p><b>{t('order:view.from')}</b>{` ${order?.startDate.format(dateFormatWithTime)}`}</p>
                    <p><b>{t('order:view.to')}</b>{` ${order?.endDate.format(dateFormatWithTime)}`}</p>
                    <p><b>{t('order:view.status')}</b><Tag color={getStatusColor(order)}>{getStatusName(order)}</Tag></p>
                    <p><b>{t('order:view.weight')}</b><Weight/></p>
                </Col>
                <Col span={24}>
                    <style>{`.order-timeline .ant-timeline-item-head-custom { background: transparent; }`}</style>
                    <div
                        id='scrollableDiv'
                        style={{
                            maxHeight: 500,
                            overflow: 'auto',
                            padding: '10px 16px 0 0',
                        }}
                    >
                        <Timeline
                            className='order-timeline'
                            mode='left'
                            items={detailedHistory.map((orderHistory, index) => ({
                                key: `history_${index}`,
                                label: dayjs(orderHistory.timestamp).format(dateFormatWithTime),
                                color: orderHistory.color || undefined,
                                dot: getDotIcon(orderHistory.type, orderHistory.color),
                                children: orderHistory.text,
                            }))}
                        />
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
                    {order?.comment && <Card size="small" title={orderer ? orderer.displayName : order?.orderer}>
                        <p>{order?.comment}</p>
                        <small>{order?.creationTime.format(dateFormatWithTime)}</small>
                    </Card>}


                    {
                        //Comment option for admin / matchef
                        ability.can('deliver', {
                            ...order,
                            abteilungId: abteilung.id
                        }) && order.status !== 'completed' ? <>
                            <Form.Item label={t('order:view.comment')}>
                                <Input.TextArea
                                    value={matChefComment}
                                    onChange={(e) => setMatchefComment(e.currentTarget.value)}
                                    placeholder={t('order:view.commentPlaceholder')}
                                />
                            </Form.Item>
                            <Form.Item>
                                <Button type='primary' onClick={async () => {
                                    await addCommentOrder(abteilung.id, order, matChefComment, (!user || !user.appUser || !user.appUser.userData) ? 'Unbekannt' : user.appUser.userData.displayName)
                                }}>
                                    {t('order:view.saveComment')}
                                </Button>
                            </Form.Item>

                        </>
                            :
                            order?.matchefComment && <Card size="small" title={getMatchefInfo()?.text.split('hat')[0] || 'Matchef'}>
                                <p>{order?.matchefComment}</p>
                                <small>{dayjs(getMatchefInfo()?.timestamp).format(dateFormatWithTime)}</small>
                            </Card>
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
                                title={t('order:view.deleteConfirm')}
                                onConfirm={async () => {
                                    const res = await deleteOrder(abteilung, order, materials, user)
                                    if(!!res) {
                                        navigate(abteilungOrdersLink)
                                    }

                                }}
                                onCancel={() => { }}
                                okText={t('common:confirm.yes')}
                                cancelText={t('common:confirm.no')}
                                disabled={order.status === 'delivered'}
                            >
                                <Button type='ghost' danger icon={<DeleteOutlined />} disabled={order.status === 'delivered'}>{t('order:actions.delete')}</Button>
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