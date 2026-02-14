import { Avatar, Button, Checkbox, List, Tooltip } from 'antd'
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
}

export const OrderItems = (props: OrderItemsProps) => {

    const { items, collisions, showCheckBoxes, damagedMaterialsCheckboxes, damagedMaterials, setDamagedMaterialCheckboxes, updateOrderItemsByAvail } = props;
    const { t } = useTranslation();

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
                return <List.Item style={{ borderColor: '#B5B2B0' }}>
                    <List.Item.Meta
                        avatar={item.imageUrls && item.imageUrls.length > 0 ? <Avatar src={item.imageUrls[0]} /> : undefined}
                        title={
                            <>
                                {`${item.count} x `}<a href='https://ant.design'>{item.name}</a>
                            </>
                        }
                        description={
                                <span style={{ color: 'red' }}>
                                    {collisions && item.matId in collisions ? (collisions[item.matId] === 0 ? t('order:items.notAvailable') : t('order:items.onlyAvailable', { count: collisions[item.matId] })) : ''}
                                    { damaged && t(damaged.type === 'damaged' ? 'order:items.damaged' : 'order:items.lost', { count: damaged.count }) }
                                </span>
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