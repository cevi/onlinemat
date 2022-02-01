import { Table, Button, Popconfirm } from 'antd';
import { Abteilung, AbteilungMemberUserData } from 'types/abteilung.type';
import { Group } from 'types/group.types';
import { Can } from 'config/casl/casl';
import { deleteGroup, EditGroupButton } from './EditGroup';
import { DeleteOutlined } from '@ant-design/icons';



export interface GroupImplTableProps {
    abteilung: Abteilung
    members: AbteilungMemberUserData[]
    loading: boolean
}

export const GroupTableImpl = (props: GroupImplTableProps) => {

    const { abteilung, members, loading } = props;


    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            sorter: (a: Group, b: Group) => a.name.normalize().localeCompare(b.name.normalize()),
            render: (text: string, record: Group) => (
                <p key={`name_${record.id}`}>{record.name}</p>
            )
        },
        {
            title: 'Typ',
            dataIndex: 'type',
            key: 'type',
            sorter: (a: Group, b: Group) => a.type.normalize().localeCompare(b.type.normalize()),
            render: (text: string, record: Group) => (
                <p key={`type_${record.id}`}>{record.type === 'group' ? 'Gruppe' : 'Anlass'}</p>
            )
        },
        {
            title: 'Personen',
            key: 'members',
            dataIndex: 'members',
            render: (text: string, record: Group) => (
                <p key={`members_${record.id}`}>{record.members.map(m => {
                    const member = members.find(mem => mem.id === m);
                    return member ? member.displayName : 'Unbekannt'
                }).join(', ')}</p>
            )
        },
        {
            title: 'Aktionen',
            key: 'actions',
            dataIndex: 'id',
            render: (text: string, record: Group) => (
                <>
                    <Can I='update' this={abteilung}>
                        <EditGroupButton group={record} members={members} abteilung={abteilung} />
                        <Popconfirm
                            title='Möchtest du diese Gruppe wirklich löschen?'
                            onConfirm={() => deleteGroup(abteilung, record)}
                            onCancel={() => { }}
                            okText='Ja'
                            cancelText='Nein'
                        >
                            <Button type='ghost' danger icon={<DeleteOutlined />} disabled={loading}/>
                        </Popconfirm>
                    </Can>
                </>
            )
        }
    ];


    return <Table rowKey='id' loading={loading} columns={columns} dataSource={abteilung.groups.sort((a: Group, b: Group) => a.name.normalize().localeCompare(b.name.normalize()))} />;

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