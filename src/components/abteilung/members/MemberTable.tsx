import { Table } from 'antd';
import React from 'react';
import { AbteilungMember } from 'types/abteilung.type';
import { UserData } from 'types/user.type';



export interface MemberTableProps {
    members: AbteilungMember[]
    usersData: {[uid: string]: UserData }
}


export const MemberTable = (props: MemberTableProps) => {

    const { members, usersData } = props;

    const columns = [
        {
            title: 'Name',
            dataIndex: 'displayName',
            key: 'displayName',
            sorter: (a: AbteilungMember, b: AbteilungMember) => usersData[a.userId].displayName.normalize().localeCompare(usersData[b.userId].displayName.normalize()),
            render: (text: string, record: AbteilungMember) => (
                <p>{usersData[record.userId]?.displayName}</p>
            )
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            sorter: (a: AbteilungMember, b: AbteilungMember) => usersData[a.userId].email.normalize().localeCompare(usersData[b.userId].email.normalize()),
            render: (text: string, record: AbteilungMember) => (
                <p>{usersData[record.userId]?.email}</p>
            )
        },
        {
            title: 'Rolle',
            key: 'role',
            sorter: (a: AbteilungMember, b: AbteilungMember) => a.role.normalize().localeCompare(b.role.normalize()),
            render: (text: string, record: AbteilungMember) => (
                <p>{record.role}</p>
            )
        }
      ];


      return <Table columns={columns} dataSource={members} />;


}

export const changeRoleOfMember = (userId: string, role: AbteilungMember['role'] ) => {

}
export const denyMemberRequest = (userId: string) => {
    
}
export const approveMemberRequest =  (userId: string) => {
    
}
export const removeMember = (userId: string) => {
    
}