import { useContext } from 'react';
import { Table, Select, Button, Tooltip, List, Tag } from 'antd';
import { Abteilung, AbteilungMemberUserData } from 'types/abteilung.type';
import { approveMemberRequest, banMember, changeRoleOfMember, denyMemberRequest, removeMember, unBanMember } from 'util/MemberUtil';
import classNames from 'classnames';
import moduleStyles from './MemberTable.module.scss'
import { AddGroupButton } from '../group/AddGroup';
import { MembersContext, MembersUserDataContext } from '../AbteilungDetails';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { useIsMobile } from 'hooks/useIsMobile';



export interface MemberImplTableProps {
    abteilungId: string
    members: AbteilungMemberUserData[]
    loading: boolean
}

export const getRoles = (t: TFunction) => [
    { key: 'guest', name: t('member:roles.guest') },
    { key: 'member', name: t('member:roles.member') },
    { key: 'matchef', name: t('member:roles.matchef') },
    { key: 'admin', name: t('member:roles.admin') },
];


export const MemberTableImpl = (props: MemberImplTableProps) => {

    const { abteilungId, loading, members } = props;

    const { t } = useTranslation();
    const roles = getRoles(t);
    const { Option } = Select;
    const isMobile = useIsMobile();

    const renderActions = (record: AbteilungMemberUserData) => {

        if (record.banned && !!record.banned) {
            return <div key={`unban_div_${record.id}`} className={classNames(moduleStyles['actions'])}>
                <Button key={`unban_${record.id}`} type='primary' onClick={() => unBanMember(abteilungId, record.userId)}>{t('member:actions.unban')}</Button>
            </div>
        }

        if (!record.approved || !!!record.approved) {

            //show approve / deny / ban
            return <div key={`member_action_div_${record.id}`} className={classNames(moduleStyles['actions'])}>
                <Button key={`approve_${record.id}`} type='primary' size={isMobile ? 'small' : 'middle'} onClick={() => approveMemberRequest(abteilungId, record.userId)}>{t('member:actions.approve', { role: roles.find(r => r.key === record.role)?.name || record.role })}</Button>
                <Button key={`deny_${record.id}`} type='dashed' danger size={isMobile ? 'small' : 'middle'} onClick={() => denyMemberRequest(abteilungId, record.userId)}>{t('member:actions.deny')}</Button>
                <Tooltip key={`ban_tooltip_${record.id}`} title={t('member:actions.banTooltip')}>
                    <Button key={`ban_${record.id}`} type='primary' danger size={isMobile ? 'small' : 'middle'} onClick={() => banMember(abteilungId, record.userId)}>{t('member:actions.ban')}</Button>
                </Tooltip>

            </div>
        }

        return <div key={`role_action_div_${record.id}`} className={classNames(moduleStyles['actions'])}>
            <Select key={`${record.userId}_roleSelection`} value={record.role} style={{ width: 120 }} size={isMobile ? 'small' : 'middle'} onChange={(role) => changeRoleOfMember(abteilungId, record.userId, role)}>
                {
                    roles.map(role => <Option key={`${record.userId}_role_${role.key}`} value={role.key}>{role.name}</Option>)
                }
            </Select>
            <Button key={`remove_action_${record.id}`} type='dashed' danger size={isMobile ? 'small' : 'middle'} onClick={() => removeMember(abteilungId, record.userId)}>{t('member:actions.remove')}</Button>
        </div>

    }

    const sortedMembers = members.sort((a: AbteilungMemberUserData, b: AbteilungMemberUserData) => ((a.approved || false) === (b.approved || false)) ? 0 : (a.approved || false) ? 1 : -1);

    const getRoleTagColor = (record: AbteilungMemberUserData): string => {
        if (record.banned) return 'red';
        if (!record.approved) return 'orange';
        switch (record.role) {
            case 'admin': return 'purple';
            case 'matchef': return 'blue';
            case 'member': return 'green';
            case 'guest': return 'default';
            default: return 'default';
        }
    };

    const getRoleLabel = (record: AbteilungMemberUserData): string => {
        if (record.banned) return t('member:roles.banned');
        if (!record.approved) return t('member:roles.pending');
        return roles.find(r => r.key === record.role)?.name || record.role;
    };

    if (isMobile) {
        return <List
            loading={loading}
            dataSource={sortedMembers}
            renderItem={(record) => (
                <List.Item style={{ padding: '12px 0', display: 'block' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontWeight: 500, flex: 1 }}>{record.displayName}</span>
                        <Tag color={getRoleTagColor(record)}>{getRoleLabel(record)}</Tag>
                    </div>
                    <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>{record.email}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {renderActions(record)}
                    </div>
                </List.Item>
            )}
        />;
    }

    const columns = [
        {
            title: t('member:table.name'),
            dataIndex: 'displayName',
            key: 'displayName',
            sorter: (a: AbteilungMemberUserData, b: AbteilungMemberUserData) => a.displayName.normalize().localeCompare(b.displayName.normalize()),
            render: (text: string, record: AbteilungMemberUserData) => (
                <p key={`name_${record.id}`}>{record.displayName}</p>
            )
        },
        {
            title: t('member:table.email'),
            dataIndex: 'email',
            key: 'email',
            sorter: (a: AbteilungMemberUserData, b: AbteilungMemberUserData) => a.email.normalize().localeCompare(b.email.normalize()),
            render: (text: string, record: AbteilungMemberUserData) => (
                <p key={`name_${record.email}`}>{record.email}</p>
            )
        },
        {
            title: t('member:table.role'),
            key: 'role',
            dataIndex: 'role',
            sorter: (a: AbteilungMemberUserData, b: AbteilungMemberUserData) => a.role.normalize().localeCompare(b.role.normalize()),
            render: (text: string, record: AbteilungMemberUserData) => (
                renderActions(record)
            )
        }
    ];


    return <Table rowKey='userId' loading={loading} columns={columns} dataSource={sortedMembers} />;

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