import { useState } from 'react'
import { Avatar, Button, Checkbox, List, Tooltip, Typography } from 'antd'
import { DownOutlined, RightOutlined } from '@ant-design/icons'
import { DetailedCartItem } from 'types/cart.types'
import { DamagedMaterial } from 'types/material.types';
import { useTranslation } from 'react-i18next';

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
}

export const OrderItems = (props: OrderItemsProps) => {

    const { items, collisions, showCheckBoxes, damagedMaterialsCheckboxes, damagedMaterials, setDamagedMaterialCheckboxes, updateOrderItemsByAvail, showPrepareCheckboxes, preparedItems, onTogglePrepared } = props;
    const { t } = useTranslation();

    const [expandedItems, setExpandedItems] = useState<string[]>([]);

    const toggleExpanded = (matId: string) => {
        setExpandedItems(prev => prev.includes(matId) ? prev.filter(id => id !== matId) : [...prev, matId]);
    };

    const hasDetails = (item: DetailedCartItem) => {
        return !!(item.comment || item.weightInKg || (item.standortNames && item.standortNames.length > 0) || (item.categorieNames && item.categorieNames.length > 0));
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
            dataSource={items}
            renderItem={item => {
                const damaged = damagedMaterials && damagedMaterials.find(mat => mat.id === item.matId)
                const isExpanded = expandedItems.includes(item.matId);
                const isPrepared = preparedItems?.includes(item.matId);
                return <List.Item style={{ borderColor: '#B5B2B0' }}>
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
                            <span style={isPrepared ? { textDecoration: 'line-through', opacity: 0.6 } : undefined}>
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
                </List.Item>
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
