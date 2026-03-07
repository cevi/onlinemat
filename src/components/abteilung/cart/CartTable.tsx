import { useMemo } from 'react';
import { Table, Button, InputNumber, List, Tag, Collapse } from 'antd';
import { Abteilung } from 'types/abteilung.type';
import { DeleteOutlined } from '@ant-design/icons';
import { changeCountFromCart, removeFromCart, removeSammlungFromCart } from 'util/CartUtil';
import { CartItem, DetailedCartItem } from 'types/cart.types';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from 'hooks/useIsMobile';

type CartDisplayRow =
    | { type: 'material'; key: string; name: string; item: DetailedCartItem }
    | { type: 'sammlung'; key: string; name: string; sammlungId: string; items: DetailedCartItem[] };

function groupCartItems(items: DetailedCartItem[]): CartDisplayRow[] {
    const sammlungGroups = new Map<string, DetailedCartItem[]>();
    const individualItems: DetailedCartItem[] = [];

    for (const item of items) {
        if (item.sammlungId) {
            const group = sammlungGroups.get(item.sammlungId) || [];
            group.push(item);
            sammlungGroups.set(item.sammlungId, group);
        } else {
            individualItems.push(item);
        }
    }

    const rows: CartDisplayRow[] = [
        ...individualItems.map(i => ({
            type: 'material' as const,
            key: `mat_${i.matId}`,
            name: i.name,
            item: i,
        })),
        ...Array.from(sammlungGroups.entries()).map(([sid, groupItems]) => ({
            type: 'sammlung' as const,
            key: `sam_${sid}`,
            name: groupItems[0]?.sammlungName || sid,
            sammlungId: sid,
            items: groupItems,
        })),
    ];

    return rows.sort((a, b) => a.name.normalize().localeCompare(b.name.normalize()));
}

export interface CartTableProps {
    abteilung: Abteilung
    cartItems: DetailedCartItem[]
    allCartItems: DetailedCartItem[]
    changeCart: (cart: CartItem[]) => void
}

export const CartTable = (props: CartTableProps) => {
    const { abteilung, cartItems, allCartItems, changeCart } = props;
    const { t } = useTranslation();
    const isMobile = useIsMobile();

    const displayRows = useMemo(() => groupCartItems(cartItems), [cartItems]);
    const allRawCartItems = useMemo(() => allCartItems.map(i => ({
        __caslSubjectType__: 'CartItem' as const,
        matId: i.matId,
        count: i.count,
        ...(i.sammlungId ? { sammlungId: i.sammlungId } : {}),
    })), [allCartItems]);

    if (isMobile) {
        return <List
            dataSource={displayRows}
            renderItem={(row) => {
                if (row.type === 'sammlung') {
                    return (
                        <List.Item
                            style={{ padding: '12px 0' }}
                            actions={[
                                <Button
                                    key="delete"
                                    type="text"
                                    danger
                                    size="small"
                                    icon={<DeleteOutlined />}
                                    onClick={() => changeCart(removeSammlungFromCart(allRawCartItems, row.sammlungId))}
                                />,
                            ]}
                        >
                            <List.Item.Meta
                                title={
                                    <span style={{ fontWeight: 500 }}>
                                        <Tag color="blue">{t('sammlung:cartItem.sammlungLabel')}</Tag>
                                        {row.name}
                                    </span>
                                }
                                description={
                                    <Collapse
                                        ghost
                                        size="small"
                                        items={[{
                                            key: 'items',
                                            label: t('sammlung:table.itemCount', { count: row.items.length }),
                                            children: (
                                                <List
                                                    size="small"
                                                    dataSource={row.items}
                                                    renderItem={(item) => (
                                                        <List.Item>
                                                            {item.name} × {item.count}
                                                        </List.Item>
                                                    )}
                                                />
                                            ),
                                        }]}
                                    />
                                }
                            />
                        </List.Item>
                    );
                }

                const record = row.item;
                return (
                    <List.Item
                        style={{ padding: '12px 0' }}
                        actions={[
                            <Button
                                key="delete"
                                type="text"
                                danger
                                size="small"
                                icon={<DeleteOutlined />}
                                onClick={() => changeCart(removeFromCart(allCartItems, record))}
                            />,
                        ]}
                    >
                        <List.Item.Meta
                            title={<span style={{ fontWeight: 500 }}>{record.name}</span>}
                            description={
                                <span style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                    <span style={{ fontSize: 12, color: '#888' }}>{t('order:cart.table.count')}:</span>
                                    <InputNumber
                                        size="small"
                                        min={1}
                                        max={record.maxCount}
                                        defaultValue={record.count}
                                        style={{ width: 60 }}
                                        onChange={(value) => {
                                            changeCart(changeCountFromCart(allCartItems, record, value))
                                        }}
                                    />
                                </span>
                            }
                        />
                    </List.Item>
                );
            }}
        />;
    }

    const columns = [
        {
            title: t('order:cart.table.name'),
            key: 'name',
            sorter: (a: CartDisplayRow, b: CartDisplayRow) => a.name.normalize().localeCompare(b.name.normalize()),
            render: (_: any, row: CartDisplayRow) => {
                if (row.type === 'sammlung') {
                    return <span><Tag color="blue">{t('sammlung:cartItem.sammlungLabel')}</Tag> {row.name}</span>;
                }
                return <p>{row.item.name}</p>;
            }
        },
        {
            title: t('order:cart.table.count'),
            key: 'count',
            render: (_: any, row: CartDisplayRow) => {
                if (row.type === 'sammlung') {
                    return <span>{t('sammlung:table.itemCount', { count: row.items.length })}</span>;
                }
                return (
                    <InputNumber
                        min={1}
                        max={row.item.maxCount}
                        defaultValue={row.item.count}
                        onChange={(value) => {
                            changeCart(changeCountFromCart(allCartItems, row.item, value))
                        }}
                    />
                );
            }
        },
        {
            title: t('order:cart.table.actions'),
            key: 'actions',
            render: (_: any, row: CartDisplayRow) => {
                if (row.type === 'sammlung') {
                    return <Button type='dashed' danger icon={<DeleteOutlined />} onClick={() => changeCart(removeSammlungFromCart(allRawCartItems, row.sammlungId))} />;
                }
                return <Button type='dashed' danger icon={<DeleteOutlined />} onClick={() => changeCart(removeFromCart(allCartItems, row.item))} />;
            }
        }
    ];

    return <Table
        rowKey='key'
        columns={columns}
        dataSource={displayRows}
        expandable={{
            expandedRowRender: (row: CartDisplayRow) => {
                if (row.type !== 'sammlung') return null;
                return (
                    <List
                        size="small"
                        dataSource={row.items}
                        renderItem={(item) => (
                            <List.Item>
                                {item.name} × {item.count}
                            </List.Item>
                        )}
                    />
                );
            },
            rowExpandable: (row: CartDisplayRow) => row.type === 'sammlung',
        }}
    />;
}
