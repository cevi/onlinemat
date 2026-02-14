import { Table, Button, Popconfirm, Tag } from 'antd';
import { Abteilung, AbteilungMemberUserData } from 'types/abteilung.type';
import { Can } from 'config/casl/casl';
import { DeleteOutlined } from '@ant-design/icons';
import { Order } from 'types/order.types';
import { dateFormatWithTime } from 'util/constants';
import { getStatusColor, getStatusName } from 'util/OrderUtil';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';



export interface OrderImplTableProps {
    abteilung: Abteilung
    orders: Order[]
    loading: boolean
    members: AbteilungMemberUserData[]
}

export const OrderTableImpl = (props: OrderImplTableProps) => {

    const { abteilung, orders, loading, members } = props;

    const navigate = useNavigate();
    const { t } = useTranslation();


    const columns = [
        {
            title: t('order:table.status'),
            dataIndex: 'status',
            key: 'status',
            sorter: (a: Order, b: Order) => a.status.normalize().localeCompare(b.status.normalize()),
            render: (text: string, record: Order) => {
                return <p key={`status_${record.id}`}><Tag color={getStatusColor(record)}>{getStatusName(record)}</Tag></p>
            }
        },
        {
            title: t('order:table.group'),
            dataIndex: 'groupId',
            key: 'groupId',
            sorter: (a: Order, b: Order) => ((a.groupId || a.customGroupName) || '').normalize().localeCompare(((a.groupId || a.customGroupName) || '').normalize()),
            render: (text: string, record: Order) => {
                let name = t('common:status.unknown');
                if(record.groupId) {
                    const group = abteilung.groups[record.groupId];
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
            title: t('order:table.orderer'),
            dataIndex: 'orderer',
            key: 'orderer',
            sorter: (a: Order, b: Order) => a.orderer.normalize().localeCompare(b.orderer.normalize()),
            render: (text: string, record: Order) => {
                const member = members.find(mem => mem.id === record.orderer);
                return <p key={`orderer_${record.id}`}>{member ? member.displayName : t('common:status.unknown')}</p>
            }
        },
        {
            title: t('order:table.startDate'),
            dataIndex: 'startDate',
            key: 'startDate',
            sorter: (a: Order, b: Order) => a.startDate.valueOf() - b.startDate.valueOf(),
            render: (text: string, record: Order) => (
                <p key={`startDate_${record.id}`}>{record.startDate.format(dateFormatWithTime)}</p>
            )
        },
        {
            title: t('order:table.endDate'),
            dataIndex: 'endDate',
            key: 'endDate',
            sorter: (a: Order, b: Order) => a.endDate.valueOf() - b.endDate.valueOf(),
            render: (text: string, record: Order) => (
                <p key={`endDate_${record.id}`}>{record.endDate.format(dateFormatWithTime)}</p>
            )
        },
        {
            title: t('order:table.action'),
            dataIndex: 'id',
            key: 'id',
            render: (text: string, record: Order) => (
                <Button onClick={() => { navigate(`/abteilungen/${abteilung.slug || abteilung.id}/order/${record.id}`)}}>{t('order:actions.open')}</Button>
            )
        }
    ];


    return <Table rowKey='id' loading={loading} columns={columns} dataSource={orders.sort((a: Order, b: Order) => a.startDate.valueOf() - b.startDate.valueOf())} />;

}

export interface OrderTableProps {
    abteilung: Abteilung
    loading: boolean
    orders: Order[]
    members: AbteilungMemberUserData[]
}

export const OrderTable = (props: OrderTableProps) => {

    const { abteilung, orders, loading, members } = props;



    return <OrderTableImpl loading={loading} abteilung={abteilung} orders={orders} members={members}/>
}