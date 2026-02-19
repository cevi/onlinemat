import { useAuth0 } from '@auth0/auth0-react';
import { AutoComplete, Button, Card, Col, Collapse, DatePicker, Form, Input, message, Popconfirm, Row, Select, Spin, Tag, Timeline, Tooltip, Typography } from 'antd';
import { abteilungenCollection, abteilungenOrdersCollection } from 'config/firebase/collections';
import { db, functions } from 'config/firebase/firebase';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import dayjs, { Dayjs } from 'dayjs';
import { useContext, useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { Abteilung } from 'types/abteilung.type';
import { Order, OrderHistory } from 'types/order.types';
import { CartItem, DetailedCartItem } from 'types/cart.types';
import { Material } from 'types/material.types';
import { dateFormat, dateFormatWithTime } from 'util/constants';
import { getAvailableMatCount } from 'util/MaterialUtil';
import { OrderItems } from './OrderItems';
import { CartTable } from '../cart/CartTable';
import { CategorysContext, MaterialsContext, MembersContext, MembersUserDataContext, StandorteContext } from '../AbteilungDetails';
import { getGroupName } from 'util/AbteilungUtil';
import { groupObjToList } from 'util/GroupUtil';
import { addCommentOrder, calculateTotalWeight, completeOrder, deleteOrder, deliverOrder, getStatusColor, getStatusName, resetLostOrder, resetOrder } from 'util/OrderUtil';
import { ability } from 'config/casl/ability';
import { OrderNotFound } from './OrderNotFound';
import { useUser } from 'hooks/use-user';
import { CheckCircleOutlined, ClockCircleOutlined, CopyOutlined, DeleteOutlined, EditOutlined, ExclamationCircleOutlined, UndoOutlined } from '@ant-design/icons';
import { DamagedMaterialModal } from './DamagedMaterialModal';
import { Can } from 'config/casl/casl';
import { useTranslation } from 'react-i18next';
import { useCookies } from 'react-cookie';
import { getCartName, replaceCart, mergeCart } from 'util/CartUtil';
import { CopyToCartModal } from './CopyToCartModal';
import { useIsMobile } from 'hooks/useIsMobile';

export interface OrderProps {
    abteilung: Abteilung
    cartItems: CartItem[]
    changeCart: (cart: CartItem[]) => void
}

export type OrderViewParams = {
    abteilungSlugOrId: string;
    orderId: string
};

export const OrderView = (props: OrderProps) => {

    const { abteilung, cartItems, changeCart } = props;

    const { orderId } = useParams<OrderViewParams>();

    const { isAuthenticated } = useAuth0();

    const user = useUser();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const isMobile = useIsMobile();

    const [order, setOrder] = useState<Order | undefined>(undefined);
    const [orderLoading, setOrderLoading] = useState(false);
    const [cartItemsMerged, setCartItemsMerged] = useState<DetailedCartItem[]>([]);

    //fetch materials
    const materialsContext = useContext(MaterialsContext);

    const materials = materialsContext.materials;
    const matLoading = materialsContext.loading;

    //fetch categories & standorte
    const { categories } = useContext(CategorysContext);
    const { standorte } = useContext(StandorteContext);

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

    // Edit mode state
    const [isEditing, setIsEditing] = useState(false);
    const [editItems, setEditItems] = useState<DetailedCartItem[]>([]);
    const [editStartDate, setEditStartDate] = useState<Dayjs | null>(null);
    const [editEndDate, setEditEndDate] = useState<Dayjs | null>(null);
    const [editComment, setEditComment] = useState<string>('');
    const [editGroupId, setEditGroupId] = useState<string | undefined>(undefined);
    const [editCustomGroupName, setEditCustomGroupName] = useState<string>('');
    const [editLoading, setEditLoading] = useState(false);
    const [editCollisions, setEditCollisions] = useState<{ [matId: string]: number } | undefined>(undefined);
    const [materialSearchQuery, setMaterialSearchQuery] = useState('');

    // Copy to cart state
    const cookieName = getCartName(abteilung.id);
    const [, setCookie] = useCookies([cookieName]);
    const [copyModalOpen, setCopyModalOpen] = useState(false);

    const customGroupId = 'custom';

    const uid = user?.appUser?.firebaseUser?.uid;
    const isInOrderGroup = !!(
        uid && order?.groupId &&
        abteilung.groups[order.groupId]?.members?.includes(uid)
    );

    const canEditOrder = order && order.status === 'created' && (
        order.orderer === user?.appUser?.userData?.id
        || ability.can('update', { ...order, abteilungId: abteilung.id })
        || isInOrderGroup
    );

    const userGroups = (() => {
        const isStaff = user?.appUser?.userData?.staff || false;
        const list = groupObjToList(abteilung.groups);
        if (isStaff) return list.sort((a, b) => a.name.localeCompare(b.name));
        const uid = user?.appUser?.firebaseUser?.uid;
        if (!uid) return [];
        return list.filter(g => g.members.includes(uid)).sort((a, b) => a.name.localeCompare(b.name));
    })();

    const enterEditMode = () => {
        if (!order) return;
        setEditItems([...cartItemsMerged]);
        setEditStartDate(order.startDate);
        setEditEndDate(order.endDate);
        setEditComment(order.comment || '');
        setEditGroupId(order.groupId || customGroupId);
        setEditCustomGroupName(order.customGroupName || '');
        setEditCollisions(undefined);
        setMaterialSearchQuery('');
        setIsEditing(true);
    };

    const cancelEdit = () => {
        setIsEditing(false);
        setEditCollisions(undefined);
        setMaterialSearchQuery('');
    };

    const saveEdit = async () => {
        if (!order || !editStartDate || !editEndDate) return;
        if (editItems.length <= 0) {
            message.error(t('order:messages.editEmptyItems'));
            return;
        }
        setEditLoading(true);
        try {
            const orderItems = editItems.map(i => ({ count: i.count, matId: i.matId }));
            const result = await httpsCallable(functions, 'updateOrder')({
                abteilungId: abteilung.id,
                orderId: order.id,
                order: {
                    startDate: editStartDate.second(0).toISOString(),
                    endDate: editEndDate.second(0).toISOString(),
                    items: orderItems,
                    comment: editComment || null,
                    groupId: editGroupId === customGroupId ? null : editGroupId,
                    customGroupName: editGroupId === customGroupId ? editCustomGroupName || null : null,
                }
            });
            const data = result.data as { success?: boolean; collisions?: { [matId: string]: number } };
            if (data.collisions) {
                setEditCollisions(data.collisions);
                message.error(t('order:messages.editNotAllAvailable'));
            } else {
                message.success(t('order:messages.editSuccess'));
                setIsEditing(false);
                setEditCollisions(undefined);
            }
        } catch (ex: any) {
            const code = ex?.code;
            const errorMessage = ex?.message;
            if (code === 'functions/failed-precondition') {
                message.error(errorMessage || t('order:messages.editCannotEdit'));
                cancelEdit();
            } else if (code === 'functions/permission-denied') {
                message.error(errorMessage || t('order:messages.deleteErrorNoPermission'));
            } else {
                message.error(errorMessage || t('common:errors.generic', { error: ex }));
            }
        }
        setEditLoading(false);
    };

    const enrichCartItem = (item: CartItem, mat: Material | undefined): DetailedCartItem => {
        const maxCount = getAvailableMatCount(mat);
        return {
            ...item,
            __caslSubjectType__: 'DetailedCartItem',
            name: mat?.name || t('material:util.deleted'),
            maxCount,
            imageUrls: mat?.imageUrls || [],
            comment: mat?.comment || undefined,
            weightInKg: mat?.weightInKg,
            standortNames: mat?.standort?.map(id => standorte.find(s => s.id === id)?.name).filter((n): n is string => !!n),
            categorieNames: mat?.categorieIds?.map(id => categories.find(c => c.id === id)?.name).filter((n): n is string => !!n),
        };
    };

    const editChangeCart = (newItems: CartItem[]) => {
        const merged: DetailedCartItem[] = newItems.map(item => {
            const existing = editItems.find(e => e.matId === item.matId);
            if (existing) return { ...existing, count: item.count };
            const mat = materials.find(m => m.id === item.matId);
            return enrichCartItem(item, mat);
        }).filter(item => item.count > 0);
        setEditItems(merged);
    };

    const addMaterialToEdit = (mat: Material) => {
        const existing = editItems.find(e => e.matId === mat.id);
        const maxCount = getAvailableMatCount(mat);
        if (existing) {
            const newCount = Math.min(existing.count + 1, maxCount);
            setEditItems(editItems.map(e => e.matId === mat.id ? { ...e, count: newCount } : e));
        } else if (maxCount > 0) {
            setEditItems([...editItems, enrichCartItem({ __caslSubjectType__: 'CartItem', matId: mat.id, count: 1 }, mat)]);
        } else {
            message.warning(t('order:messages.editMaterialNotAvailable', { name: mat.name }));
        }
        setMaterialSearchQuery('');
    };

    const updateEditItemsByAvail = () => {
        let newItems = [...editItems];
        editItems.forEach(item => {
            if (editCollisions && item.matId in editCollisions) {
                const avail = editCollisions[item.matId];
                if (avail <= 0) {
                    newItems = newItems.filter(i => i.matId !== item.matId);
                } else {
                    newItems = newItems.map(i => i.matId === item.matId ? { ...i, count: avail, maxCount: avail } : i);
                }
            }
        });
        setEditItems(newItems);
        setEditCollisions(undefined);
    };

    // Copy to cart handlers
    const copyToCartAndNavigate = (items: CartItem[]) => {
        const expires = dayjs().add(24, 'hours');
        setCookie(cookieName, items, { path: '/', expires: expires.toDate() });
        changeCart(items);
        navigate(`/abteilungen/${abteilung.slug || abteilung.id}/cart`, { state: items });
    };

    const handleCopyToCart = () => {
        if (!order) return;
        if (cartItems.length === 0) {
            const newItems = replaceCart(order.items);
            message.success(t('order:copyToCart.successCopy'));
            copyToCartAndNavigate(newItems);
        } else {
            setCopyModalOpen(true);
        }
    };

    const handleReplace = () => {
        if (!order) return;
        const newItems = replaceCart(order.items);
        message.success(t('order:copyToCart.successReplace'));
        setCopyModalOpen(false);
        copyToCartAndNavigate(newItems);
    };

    const handleMerge = () => {
        if (!order) return;
        const newItems = mergeCart(cartItems, order.items);
        message.success(t('order:copyToCart.successMerge'));
        setCopyModalOpen(false);
        copyToCartAndNavigate(newItems);
    };

    // Auto-exit edit mode if order status changes while editing
    useEffect(() => {
        if (isEditing && order && order.status !== 'created') {
            message.warning(t('order:messages.editCannotEdit'));
            cancelEdit();
        }
    }, [order?.status]);

    const togglePreparedItem = async (matId: string) => {
        if (!order || !orderId) return;
        const orderRef = doc(db, abteilungenCollection, abteilung.id, abteilungenOrdersCollection, orderId);
        const isPrepared = order.preparedItems?.includes(matId);
        await updateDoc(orderRef, {
            preparedItems: isPrepared ? arrayRemove(matId) : arrayUnion(matId)
        });
    };

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
                comment: mat?.comment || undefined,
                weightInKg: mat?.weightInKg,
                standortNames: mat?.standort?.map(id => standorte.find(s => s.id === id)?.name).filter((n): n is string => !!n),
                categorieNames: mat?.categorieIds?.map(id => categories.find(c => c.id === id)?.name).filter((n): n is string => !!n),
                __caslSubjectType__: 'DetailedCartItem'
            }
            localItemsMerged.push(mergedItem);
        })
        setCartItemsMerged(localItemsMerged);
    }, [order, materials, standorte, categories])



    useEffect(() => {
        if(!membersLoading && !userDataLoading) {
            if (!order) return;
            if (!matChefComment) {
                setMatchefComment(order.matchefComment)
            }
            setDetailedHistory(mergeHistory(order?.history))
        }
    }, [membersLoading, userDataLoading, order, orderer?.displayName])

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
            case 'edited':
                return <EditOutlined style={{ fontSize: '16px' }} color={colorToSet} />
        }
    }

    const mergeHistory = (history: OrderHistory[]): OrderHistory[] => {
        
        if (!order) return [];
        const merged = [...history];
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
                    type='dashed'
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
                        type='dashed'
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

    const timelineContent = (
        <>
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
        </>
    );

    return <Row gutter={[16, 16]}>
        <Col xs={24} lg={7}>
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    {isEditing ? (
                        <h1>{t('common:buttons.edit')}</h1>
                    ) : (
                        <h1>{`${getGroupName(order?.groupId, abteilung, order?.customGroupName)} ${order?.startDate.format(dateFormat)}`}{order?.startDate.format(dateFormat) !== order?.endDate.format(dateFormat) && ` - ${order?.endDate.format(dateFormat)}`}</h1>
                    )}
                </Col>
                <Col span={24}>
                    {isEditing ? (
                        <>
                            <p><b>{t('order:view.orderer')}</b>{` ${orderer ? orderer.displayName : order?.orderer}`}</p>
                            <Form.Item label={t('order:create.date')}>
                                <DatePicker.RangePicker
                                    value={[editStartDate, editEndDate]}
                                    minuteStep={10}
                                    onCalendarChange={(values: any[]) => {
                                        if (!values || values.length < 2) return;
                                        if (values[0]) setEditStartDate(values[0]);
                                        if (values[1]) setEditEndDate(values[1]);
                                    }}
                                    format={dateFormatWithTime}
                                    showTime={{ format: 'HH:mm' }}
                                    style={isMobile ? { width: '100%' } : undefined}
                                />
                            </Form.Item>
                            <Form.Item label={t('order:create.group')}>
                                <Select
                                    showSearch
                                    value={editGroupId}
                                    onChange={(val) => setEditGroupId(val)}
                                    optionFilterProp="children"
                                >
                                    <Select.OptGroup label={t('order:create.groupLabel')}>
                                        {userGroups.filter(g => g.type === 'group').map(g => (
                                            <Select.Option key={`edit_group_${g.id}`} value={g.id}>{g.name}</Select.Option>
                                        ))}
                                    </Select.OptGroup>
                                    <Select.OptGroup label={t('order:create.eventLabel')}>
                                        {userGroups.filter(g => g.type === 'event').map(g => (
                                            <Select.Option key={`edit_event_${g.id}`} value={g.id}>{g.name}</Select.Option>
                                        ))}
                                    </Select.OptGroup>
                                    <Select.OptGroup label={t('order:create.otherLabel')}>
                                        <Select.Option key='edit_custom' value={customGroupId}>{t('order:create.otherOption')}</Select.Option>
                                    </Select.OptGroup>
                                </Select>
                            </Form.Item>
                            {editGroupId === customGroupId && (
                                <Form.Item label={t('order:create.customGroupName')}>
                                    <Input value={editCustomGroupName} onChange={(e) => setEditCustomGroupName(e.target.value)} />
                                </Form.Item>
                            )}
                            <p><b>{t('order:view.status')}</b><Tag color={getStatusColor(order)}>{getStatusName(order)}</Tag></p>
                        </>
                    ) : (
                        <>
                            <p><b>{t('order:view.orderer')}</b>{` ${orderer ? orderer.displayName : order?.orderer}`}</p>
                            <p><b>{t('order:view.from')}</b>{` ${order?.startDate.format(dateFormatWithTime)}`}</p>
                            <p><b>{t('order:view.to')}</b>{` ${order?.endDate.format(dateFormatWithTime)}`}</p>
                            <p><b>{t('order:view.status')}</b><Tag color={getStatusColor(order)}>{getStatusName(order)}</Tag></p>
                            <p><b>{t('order:view.weight')}</b><Weight/></p>
                        </>
                    )}
                </Col>
                {!isMobile && (
                    <Col span={24}>
                        {timelineContent}
                    </Col>
                )}
            </Row>
        </Col>
        <Col xs={24} lg={{ offset: 1, span: 16 }}>
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    {isEditing ? (
                        <>
                            <CartTable
                                abteilung={abteilung}
                                cartItems={editItems}
                                allCartItems={editItems}
                                changeCart={editChangeCart}
                            />
                            {editCollisions && (
                                <OrderItems items={editItems} collisions={editCollisions} updateOrderItemsByAvail={updateEditItemsByAvail} />
                            )}
                            <AutoComplete
                                style={{ width: '100%', marginTop: 8 }}
                                placeholder={t('order:edit.addMaterialPlaceholder')}
                                value={materialSearchQuery}
                                onChange={setMaterialSearchQuery}
                                options={materialSearchQuery.length > 0 ? materials
                                    .filter(m => m.name.toLowerCase().includes(materialSearchQuery.toLowerCase()) && !editItems.find(e => e.matId === m.id))
                                    .slice(0, 10)
                                    .map(m => ({ value: m.id, label: `${m.name} (${getAvailableMatCount(m)} ${t('order:edit.available')})` })) : []}
                                onSelect={(matId: string) => {
                                    const mat = materials.find(m => m.id === matId);
                                    if (mat) addMaterialToEdit(mat);
                                }}
                            />
                        </>
                    ) : (
                        <OrderItems items={cartItemsMerged} showCheckBoxes={ability.can('deliver', {
                            ...order,
                            abteilungId: abteilung.id
                        }) && order.status === 'delivered'}

                            damagedMaterials={order.damagedMaterial || undefined}
                            damagedMaterialsCheckboxes={damagedMaterial}
                            setDamagedMaterialCheckboxes={setDamagedMaterial}

                            showPrepareCheckboxes={ability.can('deliver', {
                                ...order,
                                abteilungId: abteilung.id
                            }) && order.status === 'created' && !isEditing}
                            preparedItems={order.preparedItems || []}
                            onTogglePrepared={togglePreparedItem}
                        />
                    )}
                </Col>
                <Col span={24}>
                    {isEditing ? (
                        <Form.Item label={t('order:create.comment')}>
                            <Input.TextArea
                                value={editComment}
                                onChange={(e) => setEditComment(e.currentTarget.value)}
                                rows={3}
                            />
                        </Form.Item>
                    ) : (
                        order?.comment && (
                            <Card size="small" title={t('order:view.ordererComment')} style={{ marginBottom: 16 }}>
                                <p style={{ margin: 0 }}>{order.comment}</p>
                            </Card>
                        )
                    )}

                    {!isEditing && (
                        ability.can('deliver', {
                            ...order,
                            abteilungId: abteilung.id
                        }) && order.status !== 'completed' ? (
                            <Card size="small" title={t('order:view.comment')} style={{ marginBottom: 16 }}>
                                <Input.TextArea
                                    value={matChefComment}
                                    onChange={(e) => setMatchefComment(e.currentTarget.value)}
                                    placeholder={t('order:view.commentPlaceholder')}
                                    rows={3}
                                    style={{ marginBottom: 8 }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                        {t('order:view.commentHint')}
                                    </Typography.Text>
                                    <Button type='primary' onClick={async () => {
                                        await addCommentOrder(abteilung.id, order, matChefComment, (!user || !user.appUser || !user.appUser.userData) ? 'Unbekannt' : user.appUser.userData.displayName)
                                    }}>
                                        {t('order:view.saveComment')}
                                    </Button>
                                </div>
                                {getMatchefInfo() && (
                                    <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
                                        {t('order:view.lastEditedBy', {
                                            name: getMatchefInfo()?.text.split(/ hat /)[0] || '',
                                            date: dayjs(getMatchefInfo()?.timestamp).format(dateFormatWithTime)
                                        })}
                                    </Typography.Text>
                                )}
                            </Card>
                        ) : (
                            !isEditing && order?.matchefComment && (
                                <Card size="small" title={t('order:view.comment')} style={{ marginBottom: 16 }}>
                                    <p style={{ margin: 0 }}>{order.matchefComment}</p>
                                    {getMatchefInfo() && (
                                        <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
                                            {t('order:view.lastEditedBy', {
                                                name: getMatchefInfo()?.text.split(/ hat /)[0] || '',
                                                date: dayjs(getMatchefInfo()?.timestamp).format(dateFormatWithTime)
                                            })}
                                        </Typography.Text>
                                    )}
                                </Card>
                            )
                        )
                    )}
                </Col>
                <Col span={24}>
                    <div style={{display: 'flex', justifyContent: 'right', flexWrap: 'wrap', gap: 8}}>
                        {isEditing ? (
                            <>
                                <Button onClick={cancelEdit} disabled={editLoading}>
                                    {t('common:buttons.cancel')}
                                </Button>
                                <Button type='primary' onClick={saveEdit} loading={editLoading} disabled={editItems.length <= 0}>
                                    {t('common:buttons.save')}
                                </Button>
                            </>
                        ) : (
                            <>
                                <Tooltip title={t('order:actions.copyToCartTooltip')}>
                                    <Button icon={<CopyOutlined />} onClick={handleCopyToCart}>
                                        {!isMobile && t('order:actions.copyToCart')}
                                    </Button>
                                </Tooltip>
                                {canEditOrder && (
                                    <Button icon={<EditOutlined />} onClick={enterEditMode}>
                                        {!isMobile && t('common:buttons.edit')}
                                    </Button>
                                )}
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
                                        <Button type='dashed' danger icon={<DeleteOutlined />} disabled={order.status === 'delivered'}>{!isMobile && t('order:actions.delete')}</Button>
                                    </Popconfirm>
                                </Can>
                                <Can I='deliver' this={{
                                    ...order,
                                    abteilungId: abteilung.id
                                }}
                                >
                                    <MaterialAction />
                                </Can>
                            </>
                        )}
                    </div>
                </Col>
                <DamagedMaterialModal abteilung={abteilung} order={order} damagedMaterial={damagedMaterial} showDamageModal={showDamageModal} setShowDamageModal={setShowDamageModal} />
                <CopyToCartModal
                    open={copyModalOpen}
                    onReplace={handleReplace}
                    onMerge={handleMerge}
                    onCancel={() => setCopyModalOpen(false)}
                />
            </Row>
        </Col>
        {isMobile && (
            <Col span={24}>
                <Collapse
                    size="small"
                    items={[{
                        key: 'timeline',
                        label: t('order:view.history', 'Verlauf'),
                        children: timelineContent,
                    }]}
                />
            </Col>
        )}
    </Row>


}