import { Avatar, List, Tooltip } from 'antd'
import Checkbox from 'antd/lib/checkbox/Checkbox';
import { DetailedCartItem } from 'types/cart.types'

export interface OrderItemsProps {
    items: DetailedCartItem[]
    collisions?: { [matId: string]: number } | undefined
    showCheckBoxes?: boolean
    damagedMaterial?: DetailedCartItem[]
    setDamagedMaterial?: (damagedMaterial: DetailedCartItem[]) => void
}

export const OrderItems = (props: OrderItemsProps) => {

    const { items, collisions, showCheckBoxes, damagedMaterial, setDamagedMaterial } = props;


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
            header={<div>Material</div>}
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
                        description={
                            <span style={{ color: 'red' }}>{collisions && item.matId in collisions ? (collisions[item.matId] === 0 ? `Leider nicht mehr verfügbar` : `Nur noch ${collisions[item.matId]} verfügbar`) : ''}</span>
                        }
                    />
                    {
                        (!!showCheckBoxes && damagedMaterial && setDamagedMaterial) && <Checkbox checked={damagedMaterial.includes(item) ? true : false} onChange={(e)=>{setDamagedMaterial(e.target.checked ? [...damagedMaterial, item] : damagedMaterial.filter(d => d.matId !== item.matId))}}><Tooltip title='Material ist beschädigt oder wurde nicht zurückgegeben.'>Kauputt</Tooltip></Checkbox>
                    }
                </List.Item>
            )}
        />
    </div>
}