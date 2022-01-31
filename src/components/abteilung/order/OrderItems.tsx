import { Avatar, List } from "antd"
import { DetailedCartItem } from "types/cart.types"

export interface OrderItemsProps {
    items: DetailedCartItem[]
    collisions?: { [matId: string]: number } | undefined
}

export const OrderItems = (props: OrderItemsProps) => {

    const { items, collisions } = props;


    return <div
        id="scrollableDiv"
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
                </List.Item>
            )}
        />
    </div>
}