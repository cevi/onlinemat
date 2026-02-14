import { Avatar, Form, InputNumber, List, Radio, Tooltip } from 'antd'
import { DamagedMaterial, DamagedMaterialDetails } from 'types/material.types';
import { useTranslation } from 'react-i18next';

export interface OrderItemsProps {
    items: DamagedMaterialDetails[]
    updateDamagedMaterial: (mat: DamagedMaterialDetails) => void
}

export const OrderItemsDamaged = (props: OrderItemsProps) => {

    const { items, updateDamagedMaterial } = props;
    const { t } = useTranslation();


    return <div
        id='scrollableDiv'
        style={{
            maxHeight: 400,
            overflow: 'auto',
            padding: '0 16px',
        }}
    >
        <List
            itemLayout='horizontal'
            header={<div>{t('order:itemsDamaged.header')}</div>}
            dataSource={items}
            renderItem={item => (
                <List.Item style={{ borderColor: '#B5B2B0' }}>
                    <List.Item.Meta
                        avatar={item.imageUrls && item.imageUrls.length > 0 ? <Avatar src={item.imageUrls[0]} /> : undefined}
                        title={
                            <>
                                {`${item.count} x `}<a href='https://ant.design'>{item.name}</a>
                            </>
                        }
                    />
                    <Form.Item label={t('order:itemsDamaged.count')}>
                        <InputNumber
                            min={1}
                            max={item.count}
                            value={item.count}
                            onChange={(val) => { updateDamagedMaterial({...item, count: val || 0}) }} />
                    </Form.Item>
                    <Form.Item style={{marginLeft: '1%'}}>
                        <Radio.Group onChange={(e) => { updateDamagedMaterial({...item, type: e.target.value}) }} value={item.type}>
                            <Radio value='damaged'><Tooltip title={t('order:itemsDamaged.damagedTooltip')}>{t('order:itemsDamaged.damaged')}</Tooltip></Radio>
                            <Radio value='lost'><Tooltip title={t('order:itemsDamaged.lostTooltip')}>{t('order:itemsDamaged.lost')}</Tooltip></Radio>
                        </Radio.Group>
                    </Form.Item>


                </List.Item>
            )}
        />
    </div>
}