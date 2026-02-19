import {Button, List, Popconfirm, Table} from 'antd';
import {Standort} from "types/standort.types";
import { Can } from 'config/casl/casl';
import {EditStandortButton} from "./EditStandort";
import {DeleteOutlined} from "@ant-design/icons";
import {deleteStandort} from "../../util/StandortUtil";
import type {TableColumnsType} from "antd";
import { useTranslation } from 'react-i18next';
import { useIsMobile } from 'hooks/useIsMobile';

export interface StandortTableProps {
    abteilungId: string
    standort: Standort[]
}


export const StandortTable = (props: StandortTableProps) => {

    const { abteilungId, standort } = props;
    const { t } = useTranslation();
    const isMobile = useIsMobile();

    if (isMobile) {
        return <List
            dataSource={standort}
            renderItem={(record) => (
                <List.Item
                    style={{ padding: '12px 0' }}
                    actions={[
                        <Can key="edit" I='update' this={{...record, abteilungId}}>
                            <EditStandortButton standort={record} standortId={record.id} abteilungId={abteilungId} />
                        </Can>,
                        <Can key="delete" I='delete' this={{...record, abteilungId}}>
                            <Popconfirm
                                title={t('standort:delete.confirm', { name: record.name })}
                                onConfirm={() => deleteStandort(abteilungId, record)}
                                onCancel={() => { }}
                                okText={t('common:confirm.yes')}
                                cancelText={t('common:confirm.no')}
                            >
                                <Button type='text' danger size='small' icon={<DeleteOutlined />} />
                            </Popconfirm>
                        </Can>,
                    ]}
                >
                    <List.Item.Meta
                        title={<span style={{ fontWeight: 500 }}>{record.name}</span>}
                        description={
                            [record.street, record.city].filter(Boolean).join(', ') || undefined
                        }
                    />
                </List.Item>
            )}
        />;
    }

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
                            <Button type='dashed' danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                    </Can>
                </div>
            )
        }
    ];

    return <Table rowKey='id' columns={columns} dataSource={standort}/>;


}