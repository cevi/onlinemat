import { Avatar, Form, InputNumber, List, Radio, Tooltip } from 'antd'
import { DamagedMaterial } from 'types/material.types';

export interface OrderItemsProps {
    items: DamagedMaterial[]
    updateDamagedMaterial: (mat: DamagedMaterial) => void
}

export const OrderItemsDamaged = (props: OrderItemsProps) => {

    const { items, updateDamagedMaterial } = props;


    return <div
        id='scrollableDiv'
        style={{
            height: 400,
            overflow: 'auto',
            padding: '0 16px',
        }}
    >
        <List
            itemLayout='horizontal'
            header={<div>Beschädigtes / Verlorenes Material</div>}
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
                    <Form.Item label='Anzahl'>
                        <InputNumber 
                            min={1} 
                            max={item.count} 
                            value={item.count} 
                            onChange={(val) => { updateDamagedMaterial({...item, count: val}) }} />
                    </Form.Item>
                    <Form.Item style={{marginLeft: '1%'}}>
                        <Radio.Group onChange={(e) => { updateDamagedMaterial({...item, type: e.target.value}) }} value={item.type}>
                            <Radio value='damaged'><Tooltip title='Material wird als kaputt markiert.'>Kaputt</Tooltip></Radio>
                            <Radio value='lost'><Tooltip title='Material wird als verloren markiert.'>Verloren</Tooltip></Radio>
                        </Radio.Group>
                    </Form.Item>


                </List.Item>
            )}
        />
    </div>
}