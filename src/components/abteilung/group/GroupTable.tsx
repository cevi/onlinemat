import { useContext } from 'react';
import { Table, Select, Button, Tooltip, Popconfirm } from 'antd';
import { Abteilung, AbteilungMemberUserData } from 'types/abteilung.type';
import { approveMemberRequest, banMember, changeRoleOfMember, denyMemberRequest, removeMember, unBanMember } from 'util/MemberUtil';
import { AddGroupButton } from '../group/AddGroup';
import { MembersContext, MembersUserDataContext } from '../AbteilungDetails';
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
                <p key={`name_${record.type}`}>{record.type === 'group' ? 'Gruppe' : 'Anlass'}</p>
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
                            <Button type='ghost' danger icon={<DeleteOutlined />} disabled={loading}>
                            </Button>
                        </Popconfirm>
                    </Can>
                </>
            )
        }
    ];


    return <Table key='group_table' loading={loading} columns={columns} dataSource={abteilung.groups.sort((a: Group, b: Group) => a.name.normalize().localeCompare(b.name.normalize()))} />;

}

export interface GroupTableProps {
    abteilung: Abteilung
}

export const GroupTable = (props: GroupTableProps) => {

    const { abteilung } = props;

    //fetch members
    const membersContext = useContext(MembersContext);

    const members = membersContext.members;
    const membersLoading = membersContext.loading;

    //fetch userData
    const membersUserDataContext = useContext(MembersUserDataContext);

    const userData = membersUserDataContext.userData;
    const userDataLoading = membersUserDataContext.loading;


    const membersMerged = members.map(member => ({ ...member, ...(userData[member.userId] || { displayName: 'Loading...' }) }));

    return <><AddGroupButton abteilung={abteilung} members={membersMerged} /><GroupTableImpl loading={userDataLoading || membersLoading} abteilung={abteilung} members={membersMerged} /></>
}