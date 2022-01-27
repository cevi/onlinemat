import { useContext } from 'react';
import { Table, Select, Button, Tooltip } from 'antd';
import { Abteilung, AbteilungMemberUserData } from 'types/abteilung.type';
import { approveMemberRequest, banMember, changeRoleOfMember, denyMemberRequest, removeMember, unBanMember } from 'util/MemberUtil';
import { AddGroupButton } from '../group/AddGroup';
import { MembersContext, MembersUserDataContext } from '../AbteilungDetails';
import { Group } from 'types/group.types';



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


    const membersMerged = members.map(member => ({...member, ...(userData[member.userId] || { displayName: 'Loading...' })}));

    return <><AddGroupButton abteilung={abteilung} members={membersMerged}/><GroupTableImpl loading={userDataLoading || membersLoading} abteilung={abteilung} members={membersMerged}/></>
}