import { useContext, useState } from 'react';
import { Button, List, message, Modal, Popconfirm, Space, Table, Tag } from 'antd';
import { Standort } from "types/standort.types";
import { Abteilung } from "types/abteilung.type";
import { Material } from "types/material.types";
import { Can } from 'config/casl/casl';
import { EditStandortButton } from "./EditStandort";
import { DeleteOutlined, StarOutlined, StarFilled } from "@ant-design/icons";
import { deleteStandort } from "../../util/StandortUtil";
import { assignStandortToMaterialsWithout } from "../../util/MaterialUtil";
import { db } from 'config/firebase/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { abteilungenCollection } from 'config/firebase/collections';
import type { TableColumnsType } from "antd";
import { useTranslation } from 'react-i18next';
import { useIsMobile } from 'hooks/useIsMobile';

export interface StandortTableProps {
    abteilungId: string
    standort: Standort[]
    abteilung?: Abteilung
    materials?: Material[]
}


export const StandortTable = (props: StandortTableProps) => {

    const { abteilungId, standort, abteilung, materials } = props;
    const { t } = useTranslation();
    const isMobile = useIsMobile();
    const [loadingDefault, setLoadingDefault] = useState(false);

    const isDefault = (record: Standort) => abteilung?.defaultStandortId === record.id;

    const materialsWithoutStandort = materials?.filter(m => !m.standort || m.standort.length === 0) ?? [];

    const handleSetDefault = async (record: Standort) => {
        setLoadingDefault(true);
        try {
            await updateDoc(doc(db, abteilungenCollection, abteilungId), { defaultStandortId: record.id });

            if (materialsWithoutStandort.length > 0) {
                Modal.confirm({
                    title: t('standort:default.assignConfirm', { count: materialsWithoutStandort.length }),
                    onOk: async () => {
                        const count = await assignStandortToMaterialsWithout(abteilungId, materials!, record.id);
                        message.success(t('standort:default.assignSuccess', { count }));
                    },
                });
            }
        } catch (e) {
            message.error(String(e));
        }
        setLoadingDefault(false);
    };

    const handleRemoveDefault = async () => {
        setLoadingDefault(true);
        try {
            await updateDoc(doc(db, abteilungenCollection, abteilungId), { defaultStandortId: '' });
        } catch (e) {
            message.error(String(e));
        }
        setLoadingDefault(false);
    };

    const renderDefaultAction = (record: Standort) => {
        if (!abteilung) return null;
        if (isDefault(record)) {
            return (
                <Button
                    type="text"
                    size="small"
                    icon={<StarFilled style={{ color: '#faad14' }} />}
                    loading={loadingDefault}
                    onClick={handleRemoveDefault}
                    title={t('standort:default.removeDefault')}
                />
            );
        }
        return (
            <Button
                type="text"
                size="small"
                icon={<StarOutlined />}
                loading={loadingDefault}
                onClick={() => handleSetDefault(record)}
                title={t('standort:default.setDefault')}
            />
        );
    };

    if (isMobile) {
        return <List
            dataSource={standort}
            renderItem={(record) => (
                <List.Item
                    style={{ padding: '12px 0' }}
                    actions={[
                        abteilung && <Can key="default" I='update' this={{ ...record, abteilungId }}>
                            {renderDefaultAction(record)}
                        </Can>,
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
                    ].filter(Boolean)}
                >
                    <List.Item.Meta
                        title={
                            <Space size={4}>
                                <span style={{ fontWeight: 500 }}>{record.name}</span>
                                {isDefault(record) && <Tag color="gold">{t('standort:default.isDefault')}</Tag>}
                            </Space>
                        }
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
            render: (_: unknown, record: Standort) => (
                <Space size={4}>
                    {record.name}
                    {isDefault(record) && <Tag color="gold">{t('standort:default.isDefault')}</Tag>}
                </Space>
            ),
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
                    {abteilung && <Can I='update' this={{...record, abteilungId: abteilungId}}>
                        {renderDefaultAction(record)}
                    </Can>}
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
