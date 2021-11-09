import { Table, Select, Button, Tooltip } from 'antd';
import React from 'react';
import { AbteilungMember, AbteilungMemberUserData } from 'types/abteilung.type';
import { UserData } from 'types/user.type';
import { approveMemberRequest, banMember, changeRoleOfMember, denyMemberRequest, removeMember, unBanMember } from 'util/MemberUtil';
import classNames from 'classnames';
import moduleStyles from './MemberTable.module.scss'



export interface MemberTableProps {
    abteilungId: string
    members: AbteilungMemberUserData[]
    loading: boolean
}


export const MemberTable = (props: MemberTableProps) => {

    const { abteilungId, loading, members } = props;


    const { Option } = Select;

    const renderActions = (record: AbteilungMember) => {

        if(record.banned && !!record.banned) {
            return <div className={classNames(moduleStyles['actions'])}>
                        <Button type="primary" onClick={()=> unBanMember(abteilungId, record.userId)}>Benutzer entsperren</Button>
                    </div>
        }

        if(!record.approved || !!!record.approved ) {

            //show approve / deny / ban
            return <div className={classNames(moduleStyles['actions'])}>
                <Button type="primary" onClick={()=> approveMemberRequest(abteilungId, record.userId)}>{`als ${record.role} Annehmen`}</Button>
                <Button type="dashed" danger onClick={()=> denyMemberRequest(abteilungId, record.userId)}>Ablehnen</Button>
                <Tooltip title="Die Anfrage wird abgelehnt und der Benutzer kann in Zukunft keinen neuen Antrag stellen">
                    <Button type="primary" danger onClick={()=> banMember(abteilungId, record.userId)}>Sperren</Button>
                </Tooltip>
                
            </div>
        }

        return <div className={classNames(moduleStyles['actions'])}>
            <Select key={`${record.userId}_roleSelection`} value={record.role} style={{ width: 120 }} onChange={(role) => changeRoleOfMember(abteilungId, record.userId, role)}>
                {
                    ['guest', 'member', 'matchef', 'admin'].map(role => <Option key={`${record.userId}_role_${role}`} value={role}>{role}</Option>)
                }
            </Select>
            <Button type="dashed" danger onClick={()=> removeMember(abteilungId, record.userId)}>Entfernen</Button>
        </div>
        
    }

    const columns = [
        {
            title: 'Name',
            dataIndex: 'displayName',
            key: 'displayName',
            sorter: (a: AbteilungMemberUserData, b: AbteilungMemberUserData) => a.displayName.normalize().localeCompare(b.displayName.normalize()),
            render: (text: string, record: AbteilungMemberUserData) => (
                <p>{record.displayName}</p>
            )
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            sorter: (a: AbteilungMemberUserData, b: AbteilungMemberUserData) => a.email.normalize().localeCompare(b.email.normalize()),
            render: (text: string, record: AbteilungMemberUserData) => (
                <p>{record.email}</p>
            )
        },
        {
            title: 'Rolle',
            key: 'role',
            sorter: (a: AbteilungMemberUserData, b: AbteilungMemberUserData) => a.role.normalize().localeCompare(b.role.normalize()),
            render: (text: string, record: AbteilungMemberUserData) => (
                renderActions(record)
            )
        }
      ];


      return <Table loading={loading} columns={columns} dataSource={members} />;


}