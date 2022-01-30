import { useContext } from 'react';
import { Table, Button, InputNumber } from 'antd';
import { Abteilung } from 'types/abteilung.type';
import { MaterialsContext} from '../AbteilungDetails';
import { DeleteOutlined } from '@ant-design/icons';
import { changeCountFromCart, removeFromCart } from 'util/CartUtil';
import { CartItem, DetailedCartItem } from 'types/cart.types';



export interface GroupImplTableProps {
    abteilung: Abteilung
    cartItems: DetailedCartItem[]
    changeCart: (cart: CartItem[]) => void
}

export const CartTableImpl = (props: GroupImplTableProps) => {

    const { abteilung, cartItems, changeCart } = props;


    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            sorter: (a: DetailedCartItem, b: DetailedCartItem) => a.matId.normalize().localeCompare(b.matId.normalize()),
            render: (text: string, record: DetailedCartItem) => (
                <p key={`name_${record.matId}`}>{record.name}</p>
            )
        },
        {
            title: 'Anzahl',
            dataIndex: 'type',
            key: 'type',
            sorter: (a: DetailedCartItem, b: DetailedCartItem) => a.count - b.count,
            render: (text: string, record: DetailedCartItem) => (
                <InputNumber key={`count_${record.matId}`} min={1} max={record.maxCount} defaultValue={record.count} onChange={(value)=>{
                    changeCart(changeCountFromCart(cartItems, record, value))
                }} />
            )
        },
        {
            title: 'Aktionen',
            key: 'actions',
            dataIndex: 'id',
            render: (text: string, record: DetailedCartItem) => (
                <Button type='ghost' danger icon={<DeleteOutlined />} onClick={()=> changeCart(removeFromCart(cartItems, record))}/>
            )
        }
    ];


    return <Table key='cart_table' columns={columns} dataSource={cartItems.sort((a: DetailedCartItem, b: DetailedCartItem) => a.matId.normalize().localeCompare(b.matId.normalize()))} />;

}

export interface CartTableProps {
    abteilung: Abteilung
    cartItems: DetailedCartItem[]
    changeCart: (cart: CartItem[]) => void
}

export const CartTable = (props: CartTableProps) => {

    const { cartItems, abteilung, changeCart } = props;

    return <CartTableImpl abteilung={abteilung} cartItems={cartItems} changeCart={changeCart} />
}