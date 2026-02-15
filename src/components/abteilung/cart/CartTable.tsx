import { useContext } from 'react';
import { Table, Button, InputNumber } from 'antd';
import { Abteilung } from 'types/abteilung.type';
import { MaterialsContext} from '../AbteilungDetails';
import { DeleteOutlined } from '@ant-design/icons';
import { changeCountFromCart, removeFromCart } from 'util/CartUtil';
import { CartItem, DetailedCartItem } from 'types/cart.types';
import { useTranslation } from 'react-i18next';



export interface GroupImplTableProps {
    abteilung: Abteilung
    cartItems: DetailedCartItem[]
    allCartItems: DetailedCartItem[]
    changeCart: (cart: CartItem[]) => void
}

export const CartTableImpl = (props: GroupImplTableProps) => {

    const { abteilung, cartItems, allCartItems, changeCart } = props;
    const { t } = useTranslation();


    const columns = [
        {
            title: t('order:cart.table.name'),
            dataIndex: 'name',
            key: 'name',
            sorter: (a: DetailedCartItem, b: DetailedCartItem) => a.matId.normalize().localeCompare(b.matId.normalize()),
            render: (text: string, record: DetailedCartItem) => (
                <p key={`name_${record.matId}`}>{record.name}</p>
            )
        },
        {
            title: t('order:cart.table.count'),
            dataIndex: 'type',
            key: 'type',
            sorter: (a: DetailedCartItem, b: DetailedCartItem) => a.count - b.count,
            render: (text: string, record: DetailedCartItem) => (
                <InputNumber key={`count_${record.matId}`} min={1} max={record.maxCount} defaultValue={record.count} onChange={(value)=>{
                    changeCart(changeCountFromCart(allCartItems, record, value))
                }} />
            )
        },
        {
            title: t('order:cart.table.actions'),
            key: 'actions',
            dataIndex: 'matId',
            render: (text: string, record: DetailedCartItem) => (
                <Button type='ghost' danger icon={<DeleteOutlined />} onClick={()=> changeCart(removeFromCart(allCartItems, record))}/>
            )
        }
    ];


    return <Table rowKey='matId' columns={columns} dataSource={cartItems.sort((a: DetailedCartItem, b: DetailedCartItem) => a.matId.normalize().localeCompare(b.matId.normalize()))} />;

}

export interface CartTableProps {
    abteilung: Abteilung
    cartItems: DetailedCartItem[]
    allCartItems: DetailedCartItem[]
    changeCart: (cart: CartItem[]) => void
}

export const CartTable = (props: CartTableProps) => {

    const { cartItems, allCartItems, abteilung, changeCart } = props;

    return <CartTableImpl abteilung={abteilung} cartItems={cartItems} allCartItems={allCartItems} changeCart={changeCart} />
}