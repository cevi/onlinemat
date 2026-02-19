import { useContext } from 'react';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { Switch, Table, Tag, Tooltip } from 'antd';
import { UserData } from 'types/user.type';
import { AddUserToAbteilungButton } from "./AddUserToAbteilung";
import { AbteilungenContext } from "../navigation/NavigationMenu";

const roleLabels: Record<string, string> = {
    admin: "Admin",
    matchef: "Matchef",
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
            render: (_: unknown, record: UserData) => {
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
            },
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
