import { Button, List, Popconfirm, Table } from 'antd';
import { Sammlung } from 'types/sammlung.types';
import { Material } from 'types/material.types';
import { Can } from 'config/casl/casl';
import { EditSammlungButton } from './EditSammlung';
import { DeleteOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { deleteSammlung } from 'util/SammlungUtil';
import type { TableColumnsType } from 'antd';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from 'hooks/useIsMobile';

export interface SammlungTableProps {
    abteilungId: string;
    sammlungen: Sammlung[];
    materials: Material[];
    onAddToCart: (sammlung: Sammlung) => void;
}

export const SammlungTable = (props: SammlungTableProps) => {
    const { abteilungId, sammlungen, materials, onAddToCart } = props;
    const { t } = useTranslation();
    const isMobile = useIsMobile();

    const getMaterialNames = (sammlung: Sammlung) => {
        return sammlung.items.map(item => {
            const mat = materials.find(m => m.id === item.matId);
            return mat ? `${mat.name} (${item.count})` : t('material:util.deleted');
        }).join(', ');
    };

    if (isMobile) {
        return (
            <List
                dataSource={sammlungen}
                renderItem={(record) => (
                    <List.Item
                        style={{ padding: '12px 0' }}
                        actions={[
                            <Button
                                key="cart"
                                type="text"
                                size="small"
                                icon={<ShoppingCartOutlined />}
                                onClick={() => onAddToCart(record)}
                            />,
                            <Can key="edit" I="update" this={{ ...record, abteilungId }}>
                                <EditSammlungButton sammlung={record} abteilungId={abteilungId} />
                            </Can>,
                            <Can key="delete" I="delete" this={{ ...record, abteilungId }}>
                                <Popconfirm
                                    title={t('sammlung:delete.confirm', { name: record.name })}
                                    onConfirm={() => deleteSammlung(abteilungId, record)}
                                    okText={t('common:confirm.yes')}
                                    cancelText={t('common:confirm.no')}
                                >
                                    <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                                </Popconfirm>
                            </Can>,
                        ]}
                    >
                        <List.Item.Meta
                            title={<span style={{ fontWeight: 500 }}>{record.name}</span>}
                            description={
                                <>
                                    {record.description && <div>{record.description}</div>}
                                    <div style={{ fontSize: 12, color: '#888' }}>{getMaterialNames(record)}</div>
                                </>
                            }
                        />
                    </List.Item>
                )}
            />
        );
    }

    const columns: TableColumnsType<Sammlung> = [
        {
            title: t('sammlung:table.name'),
            key: 'name',
            dataIndex: 'name',
        },
        {
            title: t('sammlung:table.description'),
            key: 'description',
            dataIndex: 'description',
            responsive: ['md'],
        },
        {
            title: t('sammlung:table.items'),
            key: 'items',
            render: (_: unknown, record: Sammlung) => getMaterialNames(record),
            responsive: ['lg'],
        },
        {
            title: t('sammlung:table.cart'),
            key: 'cart',
            width: '8%',
            render: (_: unknown, record: Sammlung) => (
                <Button
                    type="dashed"
                    icon={<ShoppingCartOutlined />}
                    onClick={() => onAddToCart(record)}
                />
            ),
        },
        {
            title: t('sammlung:table.edit'),
            key: 'edit',
            width: '10%',
            render: (_: unknown, record: Sammlung) => (
                <div style={{ display: 'flex', justifyContent: 'space-evenly' }}>
                    <Can I="update" this={{ ...record, abteilungId }}>
                        <EditSammlungButton sammlung={record} abteilungId={abteilungId} />
                    </Can>
                    <Can I="delete" this={{ ...record, abteilungId }}>
                        <Popconfirm
                            title={t('sammlung:delete.confirm', { name: record.name })}
                            onConfirm={() => deleteSammlung(abteilungId, record)}
                            okText={t('common:confirm.yes')}
                            cancelText={t('common:confirm.no')}
                        >
                            <Button type="dashed" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                    </Can>
                </div>
            ),
        },
    ];

    return <Table rowKey="id" columns={columns} dataSource={sammlungen} />;
};
