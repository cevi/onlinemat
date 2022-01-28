import { useContext } from 'react';
import { Table, Select, Button, Tooltip, Popconfirm } from 'antd';
import { Abteilung, AbteilungMemberUserData } from 'types/abteilung.type';
import { approveMemberRequest, banMember, changeRoleOfMember, denyMemberRequest, removeMember, unBanMember } from 'util/MemberUtil';
import { AddGroupButton } from '../group/AddGroup';
import { MaterialsContext, MembersContext, MembersUserDataContext } from '../AbteilungDetails';
import { Group } from 'types/group.types';
import { Can } from 'config/casl/casl';
import { DeleteOutlined } from '@ant-design/icons';
import { cookieToCart, getCartName } from 'util/CartUtil';
import { useCookies } from 'react-cookie';
import { CartItem, DetailedCartItem } from 'types/cart.types';



export interface GroupImplTableProps {
    abteilung: Abteilung
    cartItems: DetailedCartItem[]
    loading: boolean
}

export const CartTableImpl = (props: GroupImplTableProps) => {

    const { abteilung, cartItems, loading } = props;


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
                <p key={`count_${record.matId}`}>{record.count}</p>
            )
        },
        {
            title: 'Aktionen',
            key: 'actions',
            dataIndex: 'id',
            render: (text: string, record: DetailedCartItem) => (
                <>
                    <p>asd</p>
                </>
            )
        }
    ];


    return <Table key='cart_table' loading={loading} columns={columns} dataSource={cartItems.sort((a: DetailedCartItem, b: DetailedCartItem) => a.matId.normalize().localeCompare(b.matId.normalize()))} />;

}

export interface CartTableProps {
    abteilung: Abteilung
    cartItems: CartItem[]
}

export const CartTable = (props: CartTableProps) => {

    const { cartItems, abteilung } = props;

    //fetch materials
    const materialsContext = useContext(MaterialsContext);

    const materials = materialsContext.materials;
    const matLoading = materialsContext.loading;

    const cartItemsMerged: DetailedCartItem[] = [];

    cartItems.forEach(item => {
        const name = materials.find(m => m.id === item.matId)?.name || 'Unbekannt'
        const mergedItem: DetailedCartItem = {...item, name, __caslSubjectType__: 'DetailedCartItem'}
        cartItemsMerged.push(mergedItem)
    })

    return <CartTableImpl loading={matLoading} abteilung={abteilung} cartItems={cartItemsMerged} />
}