import {Button, Popconfirm, Table} from 'antd';
import {Standort} from "types/standort.types";
import { Can } from 'config/casl/casl';
import {EditStandortButton} from "./EditStandort";
import {DeleteOutlined} from "@ant-design/icons";
import {deleteStandort} from "../../util/StandortUtil";
import type {TableColumnsType} from "antd";
import { useTranslation } from 'react-i18next';

export interface StandortTableProps {
    abteilungId: string
    standort: Standort[]
}


export const StandortTable = (props: StandortTableProps) => {

    const { abteilungId, standort } = props;
    const { t } = useTranslation();

    const columns: TableColumnsType<Standort> = [
        {
            title: t('standort:table.name'),
            key: 'name',
            dataIndex: 'name'
        },
        {
            title: t('standort:table.street'),
            key: 'street',
            dataIndex: 'street',
            responsive: ['md']
        },
        {
            title: t('standort:table.city'),
            key: 'city',
            dataIndex: 'city',
            responsive: ['md']
        },
        {
            title: t('standort:table.coordinates'),
            key: 'coordinates',
            dataIndex: 'coordinates',
            responsive: ['md']
        },
        {
            title: t('standort:table.edit'),
            key: 'edit',
            width: '10%',
            render: (text: string, record: Standort) => (
                <div style={{display: 'flex', justifyContent: 'space-evenly'}}>
                    <Can I='update' this={{...record, abteilungId: abteilungId}}>
                        <EditStandortButton standort={record} standortId={record.id} abteilungId={abteilungId} />
                    </Can>
                    <Can I='delete' this={{...record, abteilungId: abteilungId}}>
                       <Popconfirm
                            title={t('standort:delete.confirm', { name: record.name })}
                            onConfirm={() => deleteStandort(abteilungId, record)}
                            onCancel={() => { }}
                            okText={t('common:confirm.yes')}
                            cancelText={t('common:confirm.no')}
                        >
                            <Button type='ghost' danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                    </Can>
                </div>
            )
        }
    ];

    return <Table rowKey='id' columns={columns} dataSource={standort}/>;


}