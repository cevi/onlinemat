import { Table, Button, Popconfirm } from 'antd';
import { Abteilung, AbteilungMemberUserData } from 'types/abteilung.type';
import { Can } from 'config/casl/casl';
import { DeleteOutlined } from '@ant-design/icons';
import { Order } from 'types/order.types';



export interface OrderImplTableProps {
    abteilung: Abteilung
    orders: Order[]
    loading: boolean
}

export const OrderTableImpl = (props: OrderImplTableProps) => {

    const { abteilung, orders, loading } = props;


    const columns = [
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            sorter: (a: Order, b: Order) => a.status.normalize().localeCompare(b.status.normalize()),
            render: (text: string, record: Order) => (
                <p key={`status_${record.id}`}>{record.status}</p>
            )
        },
        {
            title: 'Gruppe',
            dataIndex: 'groupId',
            key: 'groupId',
            sorter: (a: Order, b: Order) => ((a.groupId || a.customGroupName) || '').normalize().localeCompare(((a.groupId || a.customGroupName) || '').normalize()),
            render: (text: string, record: Order) => {
                let name = 'Unbekannt';
                if(record.groupId) {
                    const group = abteilung.groups.find(g => g.id === record.groupId);
                    if(group) {
                        name = group.name;
                    }
                } else if(record.customGroupName) {
                    name = record.customGroupName
                }

                
                return <p key={`group_${record.id}`}>{name}</p>
            }
        },
        {
            title: 'Besteller',
            dataIndex: 'orderer',
            key: 'orderer',
            sorter: (a: Order, b: Order) => a.orderer.normalize().localeCompare(b.orderer.normalize()),
            render: (text: string, record: Order) => (
                <p key={`orderer_${record.id}`}>{record.orderer}</p>
            )
        }
    ];


    return <Table key='orders_table' loading={loading} columns={columns} dataSource={orders.sort((a: Order, b: Order) => a.startDate.valueOf() - b.startDate.valueOf())} />;

}

export interface OrderTableProps {
    abteilung: Abteilung
    loading: boolean
    orders: Order[]
}

export const OrderTable = (props: OrderTableProps) => {

    const { abteilung, orders, loading } = props;

    

    return <OrderTableImpl loading={loading} abteilung={abteilung} orders={orders} />
}