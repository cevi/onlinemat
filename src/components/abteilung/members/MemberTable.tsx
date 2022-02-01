import { useContext } from 'react';
import { Table, Select, Button, Tooltip } from 'antd';
import { Abteilung, AbteilungMemberUserData } from 'types/abteilung.type';
import { approveMemberRequest, banMember, changeRoleOfMember, denyMemberRequest, removeMember, unBanMember } from 'util/MemberUtil';
import classNames from 'classnames';
import moduleStyles from './MemberTable.module.scss'
import { AddGroupButton } from '../group/AddGroup';
import { MembersContext, MembersUserDataContext } from '../AbteilungDetails';



export interface MemberImplTableProps {
    abteilungId: string
    members: AbteilungMemberUserData[]
    loading: boolean
}

export const roles = [{ key: 'guest', name: 'Gast' }, { key: 'member', name: 'Mitglied' }, { key: 'matchef', name: 'Matchef' }, { key: 'admin', name: 'Admin' }];


export const MemberTableImpl = (props: MemberImplTableProps) => {

    const { abteilungId, loading, members } = props;

    const { Option } = Select;

    const renderActions = (record: AbteilungMemberUserData) => {

        if (record.banned && !!record.banned) {
            return <div key={`unban_div_${record.id}`} className={classNames(moduleStyles['actions'])}>
                <Button key={`unban_${record.id}`} type='primary' onClick={() => unBanMember(abteilungId, record.userId)}>Benutzer entsperren</Button>
            </div>
        }

        if (!record.approved || !!!record.approved) {

            //show approve / deny / ban
            return <div key={`member_action_div_${record.id}`} className={classNames(moduleStyles['actions'])}>
                <Button key={`approve_${record.id}`} type='primary' onClick={() => approveMemberRequest(abteilungId, record.userId)}>{`als ${roles.find(r => r.key === record.role)?.name || record.role} Annehmen`}</Button>
                <Button key={`deny_${record.id}`} type='dashed' danger onClick={() => denyMemberRequest(abteilungId, record.userId)}>Ablehnen</Button>
                <Tooltip key={`ban_tooltip_${record.id}`} title='Die Anfrage wird abgelehnt und der Benutzer kann in Zukunft keinen neuen Antrag stellen'>
                    <Button key={`ban_${record.id}`} type='primary' danger onClick={() => banMember(abteilungId, record.userId)}>Sperren</Button>
                </Tooltip>

            </div>
        }

        return <div key={`role_action_div_${record.id}`} className={classNames(moduleStyles['actions'])}>
            <Select key={`${record.userId}_roleSelection`} value={record.role} style={{ width: 120 }} onChange={(role) => changeRoleOfMember(abteilungId, record.userId, role)}>
                {
                    roles.map(role => <Option key={`${record.userId}_role_${role.key}`} value={role.key}>{role.name}</Option>)
                }
            </Select>
            <Button key={`remove_action_${record.id}`} type='dashed' danger onClick={() => removeMember(abteilungId, record.userId)}>Entfernen</Button>
        </div>

    }

    const columns = [
        {
            title: 'Name',
            dataIndex: 'displayName',
            key: 'displayName',
            sorter: (a: AbteilungMemberUserData, b: AbteilungMemberUserData) => a.displayName.normalize().localeCompare(b.displayName.normalize()),
            render: (text: string, record: AbteilungMemberUserData) => (
                <p key={`name_${record.id}`}>{record.displayName}</p>
            )
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            sorter: (a: AbteilungMemberUserData, b: AbteilungMemberUserData) => a.email.normalize().localeCompare(b.email.normalize()),
            render: (text: string, record: AbteilungMemberUserData) => (
                <p key={`name_${record.email}`}>{record.email}</p>
            )
        },
        {
            title: 'Rolle',
            key: 'role',
            dataIndex: 'role',
            sorter: (a: AbteilungMemberUserData, b: AbteilungMemberUserData) => a.role.normalize().localeCompare(b.role.normalize()),
            render: (text: string, record: AbteilungMemberUserData) => (
                renderActions(record)
            )
        }
    ];


    return <Table rowKey='userId' loading={loading} columns={columns} dataSource={members.sort((a: AbteilungMemberUserData, b: AbteilungMemberUserData) => ((a.approved || false) === (b.approved || false)) ? 0 : (a.approved || false) ? 1 : -1)} />;

}

export interface MemberTableProps {
    abteilungId: string
    members: AbteilungMemberUserData[]
    loading: boolean
}

export const MemberTable = (props: MemberTableProps) => {

    const { abteilungId, loading, members } = props;

    return <MemberTableImpl loading={loading} abteilungId={abteilungId} members={members}/>
}