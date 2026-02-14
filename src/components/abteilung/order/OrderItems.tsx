import { Avatar, Button, Checkbox, List, Tooltip } from 'antd'
import { DetailedCartItem } from 'types/cart.types'
import { DamagedMaterial } from 'types/material.types';

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
            header={<div>Material</div>}
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
                                    {collisions && item.matId in collisions ? (collisions[item.matId] === 0 ? `Leider nicht mehr verfügbar` : `Nur noch ${collisions[item.matId]} verfügbar`) : ''}
                                    { damaged && `${damaged.count} x wurde ${damaged.type === 'damaged' ? 'beschädigt' : 'verloren'}` }
                                </span>
                        }
                    />
                    {
                        (!!showCheckBoxes && damagedMaterialsCheckboxes && setDamagedMaterialCheckboxes) && <Checkbox checked={damagedMaterialsCheckboxes.includes(item) ? true : false} onChange={(e)=>{setDamagedMaterialCheckboxes(e.target.checked ? [...damagedMaterialsCheckboxes, item] : damagedMaterialsCheckboxes.filter(d => d.matId !== item.matId))}}><Tooltip title='Material ist beschädigt oder wurde nicht zurückgegeben.'>Kaputt</Tooltip></Checkbox>
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
                            Anpassen
                        </Button>
    }
    </>
}