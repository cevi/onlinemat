import { useState } from 'react';
import { Table, Button, Tag, Tooltip, Space, List, Spin, message } from 'antd';
import { Abteilung, AbteilungMemberUserData } from 'types/abteilung.type';
import { CopyOutlined, CalendarOutlined, RightOutlined } from '@ant-design/icons';
import { Order } from 'types/order.types';
import { CartItem } from 'types/cart.types';
import { dateFormatWithTime } from 'util/constants';
import { getStatusColor, getStatusName } from 'util/OrderUtil';
import { getCartName, replaceCart, mergeCart } from 'util/CartUtil';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useCookies } from 'react-cookie';
import dayjs from 'dayjs';
import { CopyToCartModal } from './CopyToCartModal';
import { useIsMobile } from 'hooks/useIsMobile';



export interface OrderImplTableProps {
    abteilung: Abteilung
    orders: Order[]
    loading: boolean
    members: AbteilungMemberUserData[]
    cartItems: CartItem[]
    changeCart: (cart: CartItem[]) => void
}

export const OrderTableImpl = (props: OrderImplTableProps) => {

    const { abteilung, orders, loading, members, cartItems, changeCart } = props;

    const navigate = useNavigate();
    const { t } = useTranslation();

    const cookieName = getCartName(abteilung.id);
    const [, setCookie] = useCookies([cookieName]);

    const [copyModalOpen, setCopyModalOpen] = useState(false);
    const [orderToCopy, setOrderToCopy] = useState<Order | null>(null);

    const copyToCartAndNavigate = (items: CartItem[]) => {
        const expires = dayjs().add(24, 'hours');
        setCookie(cookieName, items, { path: '/', expires: expires.toDate() });
        changeCart(items);
        navigate(`/abteilungen/${abteilung.slug || abteilung.id}/cart`, { state: items });
    };

    const handleCopyToCart = (order: Order) => {
        if (cartItems.length === 0) {
            const newItems = replaceCart(order.items);
            message.success(t('order:copyToCart.successCopy'));
            copyToCartAndNavigate(newItems);
        } else {
            setOrderToCopy(order);
            setCopyModalOpen(true);
        }
    };

    const handleReplace = () => {
        if (!orderToCopy) return;
        const newItems = replaceCart(orderToCopy.items);
        message.success(t('order:copyToCart.successReplace'));
        setCopyModalOpen(false);
        setOrderToCopy(null);
        copyToCartAndNavigate(newItems);
    };

    const handleMerge = () => {
        if (!orderToCopy) return;
        const newItems = mergeCart(cartItems, orderToCopy.items);
        message.success(t('order:copyToCart.successMerge'));
        setCopyModalOpen(false);
        setOrderToCopy(null);
        copyToCartAndNavigate(newItems);
    };

    const handleCancelCopy = () => {
        setCopyModalOpen(false);
        setOrderToCopy(null);
    };


    const isMobile = useIsMobile();

    const getGroupName = (record: Order): string => {
        if (record.groupId) {
            const group = abteilung.groups[record.groupId];
            if (group) return group.name;
        } else if (record.customGroupName) {
            return record.customGroupName;
        }
        return t('common:status.unknown');
    };

    const getOrdererName = (record: Order): string => {
        const member = members.find(mem => mem.id === record.orderer);
        if (!member) return t('common:status.unknown');
        return member.email ? `${member.displayName} (${member.email})` : member.displayName;
    };

    const sortedOrders = orders.sort((a: Order, b: Order) => a.startDate.valueOf() - b.startDate.valueOf());

    const columns = [
        {
            title: t('order:table.status'),
            dataIndex: 'status',
            key: 'status',
            sorter: (a: Order, b: Order) => a.status.normalize().localeCompare(b.status.normalize()),
            render: (text: string, record: Order) => {
                return <p key={`status_${record.id}`}><Tag color={getStatusColor(record)}>{getStatusName(record)}</Tag></p>
            }
        },
        {
            title: t('order:table.group'),
            dataIndex: 'groupId',
            key: 'groupId',
            sorter: (a: Order, b: Order) => ((a.groupId || a.customGroupName) || '').normalize().localeCompare(((a.groupId || a.customGroupName) || '').normalize()),
            render: (text: string, record: Order) => {
                return <p key={`group_${record.id}`}>{getGroupName(record)}</p>
            }
        },
        {
            title: t('order:table.orderer'),
            dataIndex: 'orderer',
            key: 'orderer',
            sorter: (a: Order, b: Order) => a.orderer.normalize().localeCompare(b.orderer.normalize()),
            render: (text: string, record: Order) => {
                return <p key={`orderer_${record.id}`}>{getOrdererName(record)}</p>
            }
        },
        {
            title: t('order:table.startDate'),
            dataIndex: 'startDate',
            key: 'startDate',
            sorter: (a: Order, b: Order) => a.startDate.valueOf() - b.startDate.valueOf(),
            render: (text: string, record: Order) => (
                <p key={`startDate_${record.id}`}>{record.startDate.format(dateFormatWithTime)}</p>
            )
        },
        {
            title: t('order:table.endDate'),
            dataIndex: 'endDate',
            key: 'endDate',
            sorter: (a: Order, b: Order) => a.endDate.valueOf() - b.endDate.valueOf(),
            render: (text: string, record: Order) => (
                <p key={`endDate_${record.id}`}>{record.endDate.format(dateFormatWithTime)}</p>
            )
        },
        {
            title: t('order:table.action'),
            dataIndex: 'id',
            key: 'id',
            render: (text: string, record: Order) => (
                <Space>
                    <Tooltip title={t('order:actions.copyToCartTooltip')}>
                        <Button icon={<CopyOutlined />} onClick={() => handleCopyToCart(record)} />
                    </Tooltip>
                    <Button onClick={() => { navigate(`/abteilungen/${abteilung.slug || abteilung.id}/order/${record.id}`)}}>{t('order:actions.open')}</Button>
                </Space>
            )
        }
    ];


    if (isMobile) {
        return <>
            <List
                loading={loading}
                dataSource={sortedOrders}
                renderItem={(record) => (
                    <List.Item
                        style={{ padding: '12px 0', cursor: 'pointer' }}
                        onClick={() => navigate(`/abteilungen/${abteilung.slug || abteilung.id}/order/${record.id}`)}
                        actions={[
                            <Button
                                key="copy"
                                size="small"
                                icon={<CopyOutlined />}
                                onClick={(e) => { e.stopPropagation(); handleCopyToCart(record); }}
                            />,
                            <RightOutlined key="go" style={{ color: '#999' }} />,
                        ]}
                    >
                        <List.Item.Meta
                            title={
                                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Tag color={getStatusColor(record)} style={{ margin: 0 }}>{getStatusName(record)}</Tag>
                                    <span style={{ fontWeight: 500 }}>{getGroupName(record)}</span>
                                </span>
                            }
                            description={
                                <span style={{ fontSize: 12, color: '#888' }}>
                                    {getOrdererName(record)}
                                    <span style={{ margin: '0 6px' }}>·</span>
                                    <CalendarOutlined style={{ marginRight: 4 }} />
                                    {record.startDate.format('DD.MM.YY')} – {record.endDate.format('DD.MM.YY')}
                                </span>
                            }
                        />
                    </List.Item>
                )}
            />
            <CopyToCartModal
                open={copyModalOpen}
                onReplace={handleReplace}
                onMerge={handleMerge}
                onCancel={handleCancelCopy}
            />
        </>;
    }

    return <>
        <Table rowKey='id' loading={loading} columns={columns} dataSource={sortedOrders} />
        <CopyToCartModal
            open={copyModalOpen}
            onReplace={handleReplace}
            onMerge={handleMerge}
            onCancel={handleCancelCopy}
        />
    </>;

}

export interface OrderTableProps {
    abteilung: Abteilung
    loading: boolean
    orders: Order[]
    members: AbteilungMemberUserData[]
    cartItems: CartItem[]
    changeCart: (cart: CartItem[]) => void
}

export const OrderTable = (props: OrderTableProps) => {

    const { abteilung, orders, loading, members, cartItems, changeCart } = props;



    return <OrderTableImpl loading={loading} abteilung={abteilung} orders={orders} members={members} cartItems={cartItems} changeCart={changeCart} />
}
