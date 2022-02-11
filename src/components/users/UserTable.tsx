import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { Table, Switch } from 'antd';
import React from 'react';
import { Categorie } from 'types/categorie.types';
import { Material } from 'types/material.types';
import { UserData } from 'types/user.type';



export interface UserTableProps {
    users: UserData[]
    loading: boolean
    makeStaff: (userId: string) => void
}


export const UserTable = (props: UserTableProps) => {

    const { users, loading, makeStaff } = props;

    const columns = [
        {
            title: 'Name',
            dataIndex: 'displayName',
            key: 'displayName',
            sorter: (a: UserData, b: UserData) => (a.customDisplayName || a.displayName).normalize().localeCompare((b.customDisplayName || b.displayName).normalize()),
            render: (text: string, record: UserData) => (
                <p>{record.customDisplayName || record.displayName}</p>
            )
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            sorter: (a: UserData, b: UserData) => a.email.normalize().localeCompare(b.email.normalize()),
        },
        {
            title: 'Staff',
            key: 'staff',
            render: (text: string, record: UserData) => (
                <Switch
                    key={`switch_${record.id}`}
                    checked={record.staff || false}
                    checkedChildren={<CheckOutlined />}
                    unCheckedChildren={<CloseOutlined />}
                    onChange={()=> { makeStaff(record.id) }}
                />
            ),
            sorter: (a: UserData, b: UserData) => ((a.staff || false) === (b.staff || false)) ? 0 : (a.staff || false) ? -1 : 1,
        }
      ];


      return <Table rowKey='id' columns={columns} dataSource={users} loading={loading} />;


}