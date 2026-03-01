import { useMemo, useState } from 'react'
import { Avatar, Button, Checkbox, List, Tag, Tooltip, Typography } from 'antd'
import { DownOutlined, RightOutlined } from '@ant-design/icons'
import { DetailedCartItem } from 'types/cart.types'
import { DamagedMaterial } from 'types/material.types';
import { useTranslation } from 'react-i18next';

type OrderDisplayRow =
    | { type: 'material'; key: string; name: string; item: DetailedCartItem }
    | { type: 'sammlung'; key: string; name: string; sammlungId: string; items: DetailedCartItem[] };

function groupOrderItems(items: DetailedCartItem[]): OrderDisplayRow[] {
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

    const rows: OrderDisplayRow[] = [
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

export interface OrderItemsProps {
    items: DetailedCartItem[]
    collisions?: { [matId: string]: number } | undefined
    showCheckBoxes?: boolean
    damagedMaterialsCheckboxes?: DetailedCartItem[]
    damagedMaterials?: DamagedMaterial[]
    setDamagedMaterialCheckboxes?: (damagedMaterial: DetailedCartItem[]) => void
    updateOrderItemsByAvail?: () => void
    showPrepareCheckboxes?: boolean
    preparedItems?: string[]
    onTogglePrepared?: (matId: string) => void
    showControlledCheckboxes?: boolean
    controlledItems?: string[]
    onToggleControlled?: (matId: string) => void
}

export const OrderItems = (props: OrderItemsProps) => {

    const { items, collisions, showCheckBoxes, damagedMaterialsCheckboxes, damagedMaterials, setDamagedMaterialCheckboxes, updateOrderItemsByAvail, showPrepareCheckboxes, preparedItems, onTogglePrepared, showControlledCheckboxes, controlledItems, onToggleControlled } = props;
    const { t } = useTranslation();

    const [expandedItems, setExpandedItems] = useState<string[]>([]);
    const [expandedSammlungen, setExpandedSammlungen] = useState<string[]>([]);

    const displayRows = useMemo(() => groupOrderItems(items), [items]);

    const toggleExpanded = (matId: string) => {
        setExpandedItems(prev => prev.includes(matId) ? prev.filter(id => id !== matId) : [...prev, matId]);
    };

    const toggleSammlungExpanded = (sammlungId: string) => {
        setExpandedSammlungen(prev => prev.includes(sammlungId) ? prev.filter(id => id !== sammlungId) : [...prev, sammlungId]);
    };

    const hasDetails = (item: DetailedCartItem) => {
        return !!(item.comment || item.weightInKg || (item.standortNames && item.standortNames.length > 0) || (item.categorieNames && item.categorieNames.length > 0));
    };

    const renderMaterialItem = (item: DetailedCartItem, indent?: boolean) => {
        const damaged = damagedMaterials && damagedMaterials.find(mat => mat.id === item.matId);
        const isExpanded = expandedItems.includes(item.matId);
        const isPrepared = preparedItems?.includes(item.matId);
        const isControlled = controlledItems?.includes(item.matId);

        return <List.Item style={{ borderColor: '#B5B2B0', ...(indent ? { paddingLeft: 24 } : {}) }}>
            {showPrepareCheckboxes && onTogglePrepared && (
                <Checkbox
                    checked={isPrepared}
                    onChange={() => onTogglePrepared(item.matId)}
                    style={{ marginRight: 12 }}
                >
                    <Tooltip title={t('order:items.prepared')}>{t('order:items.prepared')}</Tooltip>
                </Checkbox>
            )}
            <List.Item.Meta
                avatar={item.imageUrls && item.imageUrls.length > 0 ? <Avatar src={item.imageUrls[0]} /> : undefined}
                title={
                    <span style={(showPrepareCheckboxes && isPrepared) || (showControlledCheckboxes && isControlled) ? { textDecoration: 'line-through', opacity: 0.6 } : undefined}>
                        {`${item.count} x ${item.name}`}
                    </span>
                }
                description={
                    <>
                        <span style={{ color: 'red' }}>
                            {collisions && item.matId in collisions ? (collisions[item.matId] === 0 ? t('order:items.notAvailable') : t('order:items.onlyAvailable', { count: collisions[item.matId] })) : ''}
                            { damaged && t(damaged.type === 'damaged' ? 'order:items.damaged' : 'order:items.lost', { count: damaged.count }) }
                        </span>
                        {hasDetails(item) && (
                            <>
                                <Typography.Link
                                    onClick={() => toggleExpanded(item.matId)}
                                    style={{ display: 'block', marginTop: 4, fontSize: 12 }}
                                >
                                    {isExpanded ? <DownOutlined /> : <RightOutlined />} {t('order:items.showDetails')}
                                </Typography.Link>
                                {isExpanded && (
                                    <div style={{ marginTop: 4, fontSize: 12 }}>
                                        {item.standortNames && item.standortNames.length > 0 && (
                                            <Typography.Text type="secondary" style={{ display: 'block' }}>
                                                {t('order:items.standort', { names: item.standortNames.join(', ') })}
                                            </Typography.Text>
                                        )}
                                        {item.categorieNames && item.categorieNames.length > 0 && (
                                            <Typography.Text type="secondary" style={{ display: 'block' }}>
                                                {t('order:items.categories', { names: item.categorieNames.join(', ') })}
                                            </Typography.Text>
                                        )}
                                        {item.comment && (
                                            <Typography.Text type="secondary" style={{ display: 'block' }}>
                                                {t('order:items.commentLabel', { comment: item.comment })}
                                            </Typography.Text>
                                        )}
                                        {item.weightInKg != null && (
                                            <Typography.Text type="secondary" style={{ display: 'block' }}>
                                                {t('order:items.weightLabel', { weight: item.weightInKg })}
                                            </Typography.Text>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </>
                }
            />
            {
                (!!showCheckBoxes && damagedMaterialsCheckboxes && setDamagedMaterialCheckboxes) && <Checkbox checked={damagedMaterialsCheckboxes.includes(item) ? true : false} onChange={(e)=>{setDamagedMaterialCheckboxes(e.target.checked ? [...damagedMaterialsCheckboxes, item] : damagedMaterialsCheckboxes.filter(d => d.matId !== item.matId))}}><Tooltip title={t('order:items.damagedCheckboxTooltip')}>{t('order:items.damagedCheckbox')}</Tooltip></Checkbox>
            }
            {showControlledCheckboxes && (
                <Checkbox
                    checked={isControlled}
                    disabled={!onToggleControlled}
                    onChange={() => onToggleControlled && onToggleControlled(item.matId)}
                    style={{ marginLeft: 12 }}
                >
                    <Tooltip title={t('order:items.controlledTooltip')}>{t('order:items.controlled')}</Tooltip>
                </Checkbox>
            )}
        </List.Item>;
    };

    return <><div
        id='scrollableDiv'
        style={{
            maxHeight: 400,
            overflow: 'auto',
            padding: '0 16px',
        }}
    >
        <List
            itemLayout='horizontal'
            header={<div>{t('order:items.header')}</div>}
            dataSource={displayRows}
            renderItem={row => {
                if (row.type === 'material') {
                    return renderMaterialItem(row.item);
                }

                // Sammlung row
                const isSammlungExpanded = expandedSammlungen.includes(row.sammlungId);
                return <>
                    <List.Item style={{ borderColor: '#B5B2B0' }}>
                        <List.Item.Meta
                            title={
                                <span style={{ fontWeight: 500 }}>
                                    <Typography.Link onClick={() => toggleSammlungExpanded(row.sammlungId)} style={{ marginRight: 8 }}>
                                        {isSammlungExpanded ? <DownOutlined /> : <RightOutlined />}
                                    </Typography.Link>
                                    <Tag color="blue">{t('sammlung:cartItem.sammlungLabel')}</Tag>
                                    {row.name}
                                    <Typography.Text type="secondary" style={{ marginLeft: 8, fontWeight: 400 }}>
                                        ({t('sammlung:table.itemCount', { count: row.items.length })})
                                    </Typography.Text>
                                </span>
                            }
                        />
                    </List.Item>
                    {isSammlungExpanded && row.items.map(item => (
                        <div key={`${row.sammlungId}_${item.matId}`}>{renderMaterialItem(item, true)}</div>
                    ))}
                </>;
            }}
        />
    </div>
    {
        collisions && updateOrderItemsByAvail &&   <Button
                            type='primary'
                            style={{ display: 'block', marginLeft: 'auto', marginRight: 0 }}
                            onClick={() => updateOrderItemsByAvail()}
                        >
                            {t('order:items.adjust')}
                        </Button>
    }
    </>
}
