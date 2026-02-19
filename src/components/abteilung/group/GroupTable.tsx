import { Table, Button, Popconfirm, Space } from 'antd';
import { Abteilung, AbteilungMemberUserData } from 'types/abteilung.type';
import { Group } from 'types/group.types';
import { ability } from 'config/casl/ability';
import { deleteGroup, EditGroupButton } from './EditGroup';
import { DeleteOutlined } from '@ant-design/icons';
import { groupObjToList } from 'util/GroupUtil';
import { dateFormat } from 'util/constants';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';



export interface GroupImplTableProps {
    abteilung: Abteilung
    members: AbteilungMemberUserData[]
    loading: boolean
}

export const GroupTableImpl = (props: GroupImplTableProps) => {

    const { abteilung, members, loading } = props;

    const { t } = useTranslation();

    const canUpdate = ability.can('update', abteilung);

    const columns = [
        {
            title: t('group:table.name'),
            dataIndex: 'name',
            key: 'name',
            sorter: (a: Group, b: Group) => a.name.normalize().localeCompare(b.name.normalize()),
            render: (text: string, record: Group) => (
                <p key={`name_${record.id}`}>{record.name}</p>
            )
        },
        {
            title: t('group:table.type'),
            dataIndex: 'type',
            key: 'type',
            sorter: (a: Group, b: Group) => a.type.normalize().localeCompare(b.type.normalize()),
            render: (text: string, record: Group) => (
                <p key={`type_${record.id}`}>{record.type === 'group' ? t('group:table.typeGroup') : t('group:table.typeEvent')}</p>
            )
        },
        {
            title: t('group:table.createdAt'),
            dataIndex: 'createdAt',
            key: 'createdAt',
            sorter: (a: Group, b: Group) => a.createdAt.valueOf() - b.createdAt.valueOf(),
            render: (text: string, record: Group) => (
                <p key={`createdAt_${record.id}`}>{dayjs(record.createdAt).format(dateFormat)}</p>
            )
        },
        {
            title: t('group:table.members'),
            key: 'members',
            dataIndex: 'members',
            render: (text: string, record: Group) => (
                <p key={`members_${record.id}`}>{record.members.map(m => {
                    const member = members.find(mem => mem.id === m);
                    return member ? member.displayName : t('common:status.unknown')
                }).join(', ')}</p>
            )
        },
        ...(canUpdate ? [{
            title: t('group:table.actions'),
            key: 'actions',
            dataIndex: 'id',
            render: (text: string, record: Group) => (
                <Space>
                    <EditGroupButton group={record} members={members} abteilung={abteilung} />
                    <Popconfirm
                        title={t('group:delete.confirm')}
                        onConfirm={() => deleteGroup(abteilung, record, t)}
                        onCancel={() => { }}
                        okText={t('common:confirm.yes')}
                        cancelText={t('common:confirm.no')}
                    >
                        <Button type='ghost' danger icon={<DeleteOutlined />} disabled={loading}/>
                    </Popconfirm>
                </Space>
            )
        }] : []),
    ];


    return <Table rowKey='id' loading={loading} columns={columns} dataSource={groupObjToList(abteilung.groups).sort((a: Group, b: Group) => a.name.normalize().localeCompare(b.name.normalize()))} />;

}

export interface GroupTableProps {
    abteilung: Abteilung
    loading: boolean
    members: AbteilungMemberUserData[]
}

export const GroupTable = (props: GroupTableProps) => {

    const { abteilung, members, loading } = props;

    

    return <GroupTableImpl loading={loading} abteilung={abteilung} members={members} />
}