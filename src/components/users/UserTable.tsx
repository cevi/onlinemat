import { useContext, useMemo, useState } from 'react';
import { CheckOutlined, CloseOutlined, SortAscendingOutlined, SortDescendingOutlined } from '@ant-design/icons';
import { Button, List, Select, Space, Switch, Table, Tag, Tooltip } from 'antd';
import dayjs from 'dayjs';
import { UserData } from 'types/user.type';
import { AddUserToAbteilungButton } from "./AddUserToAbteilung";
import { AbteilungenContext } from "../navigation/NavigationMenu";
import { useIsMobile } from 'hooks/useIsMobile';
import { useTranslation } from 'react-i18next';

const roleLabels: Record<string, string> = {
    admin: "Admin",
    matchef: "Matverantwortung",
    member: "Mitglied",
    guest: "Gast",
    pending: "Angefragt",
};

const roleColors: Record<string, string> = {
    admin: "red",
    matchef: "orange",
    member: "green",
    guest: "blue",
    pending: "geekblue",
};

export interface UserTableProps {
    users: UserData[]
    loading: boolean
    makeStaff: (userId: string) => void
}


export const UserTable = (props: UserTableProps) => {

    const { users, loading, makeStaff } = props;
    const { abteilungen } = useContext(AbteilungenContext);
    const isMobile = useIsMobile();
    const { t } = useTranslation();

    const [sortField, setSortField] = useState<string>('displayName');
    const [sortAsc, setSortAsc] = useState(true);

    const sortedUsers = useMemo(() => {
        const sorted = [...users].sort((a, b) => {
            switch (sortField) {
                case 'displayName':
                    return a.displayName.normalize().localeCompare(b.displayName.normalize());
                case 'email':
                    return a.email.normalize().localeCompare(b.email.normalize());
                case 'abteilungen':
                    return Object.keys(a.roles || {}).length - Object.keys(b.roles || {}).length;
                case 'staff':
                    return ((a.staff || false) === (b.staff || false)) ? 0 : (a.staff || false) ? -1 : 1;
                case 'lastLogin': {
                    const aTime = a.lastLogin?.toMillis?.() ?? 0;
                    const bTime = b.lastLogin?.toMillis?.() ?? 0;
                    return aTime - bTime;
                }
                default:
                    return 0;
            }
        });
        return sortAsc ? sorted : sorted.reverse();
    }, [users, sortField, sortAsc]);

    const renderRoleTags = (record: UserData) => {
        if (!record.roles || Object.keys(record.roles).length === 0) {
            return <span style={{ color: '#999' }}>–</span>;
        }
        return Object.entries(record.roles).map(([abteilungId, role]) => {
            const abt = abteilungen.find(a => a.id === abteilungId || a.slug === abteilungId);
            const name = abt?.name ?? abteilungId;
            return (
                <Tooltip key={abteilungId} title={roleLabels[role] ?? role}>
                    <Tag color={roleColors[role] ?? "default"} style={{ marginBottom: 4 }}>
                        {name}
                    </Tag>
                </Tooltip>
            );
        });
    };

    if (isMobile) {
        const sortOptions = [
            { value: 'displayName', label: t('navigation:users.table.name') },
            { value: 'email', label: t('navigation:users.table.email') },
            { value: 'abteilungen', label: t('navigation:users.table.abteilungen') },
            { value: 'staff', label: t('navigation:users.table.staff') },
            { value: 'lastLogin', label: t('navigation:users.table.lastLogin') },
        ];

        return <>
            <Space style={{ marginBottom: 12 }}>
                <Select
                    size="small"
                    value={sortField}
                    onChange={setSortField}
                    options={sortOptions}
                    style={{ width: 160 }}
                />
                <Button
                    size="small"
                    icon={sortAsc ? <SortAscendingOutlined /> : <SortDescendingOutlined />}
                    onClick={() => setSortAsc(prev => !prev)}
                />
            </Space>
            <List
            loading={loading}
            dataSource={sortedUsers}
            renderItem={(record) => (
                <List.Item style={{ padding: '12px 0', display: 'block' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: 500, flex: 1 }}>{record.displayName}</span>
                        {record.staff && <Tag color="purple">Staff</Tag>}
                    </div>
                    <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>{record.email}</div>
                    <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
                        {t('navigation:users.table.lastLogin')}: {record.lastLogin?.toDate ? dayjs(record.lastLogin.toDate()).format('DD.MM.YYYY HH:mm') : '–'}
                    </div>
                    <div style={{ marginBottom: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {renderRoleTags(record)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Switch
                            size="small"
                            checked={record.staff || false}
                            checkedChildren={<CheckOutlined />}
                            unCheckedChildren={<CloseOutlined />}
                            onChange={() => makeStaff(record.id)}
                        />
                        <span style={{ fontSize: 12, color: '#888' }}>Staff</span>
                        <div style={{ marginLeft: 'auto' }}>
                            <AddUserToAbteilungButton uid={record.id} size="small" />
                        </div>
                    </div>
                </List.Item>
            )}
        />
        </>;
    }

    const columns = [
        {
            title: 'Name',
            dataIndex: 'displayName',
            key: 'displayName',
            sorter: (a: UserData, b: UserData) => a.displayName.normalize().localeCompare(b.displayName.normalize()),
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            sorter: (a: UserData, b: UserData) => a.email.normalize().localeCompare(b.email.normalize()),
        },
        {
            title: 'Abteilungen',
            key: 'abteilungen',
            render: (_: unknown, record: UserData) => renderRoleTags(record),
            sorter: (a: UserData, b: UserData) =>
                Object.keys(a.roles || {}).length - Object.keys(b.roles || {}).length,
        },
        {
            title: 'Staff',
            key: 'staff',
            render: (_: unknown, record: UserData) => (
                <Switch
                    key={`switch_${record.id}`}
                    checked={record.staff || false}
                    checkedChildren={<CheckOutlined />}
                    unCheckedChildren={<CloseOutlined />}
                    onChange={() => {
                        makeStaff(record.id)
                    }}
                />
            ),
            sorter: (a: UserData, b: UserData) => ((a.staff || false) === (b.staff || false)) ? 0 : (a.staff || false) ? -1 : 1,
        },
        {
            title: t('navigation:users.table.lastLogin'),
            key: 'lastLogin',
            responsive: ['md' as const],
            render: (_: unknown, record: UserData) =>
                record.lastLogin?.toDate
                    ? dayjs(record.lastLogin.toDate()).format('DD.MM.YYYY HH:mm')
                    : '–',
            sorter: (a: UserData, b: UserData) => {
                const aTime = a.lastLogin?.toMillis?.() ?? 0;
                const bTime = b.lastLogin?.toMillis?.() ?? 0;
                return aTime - bTime;
            },
        },
        {
            title: 'Aktionen',
            key: 'actions',
            dataIndex: 'id',
            render: (_: unknown, record: UserData) => (
                <AddUserToAbteilungButton uid={record.id} />
            )
        },
    ];


    return <Table rowKey='id' columns={columns} dataSource={users} loading={loading} />;

}
