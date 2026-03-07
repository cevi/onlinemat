import {Button, List, Popconfirm, Table} from 'antd';
import {Can} from 'config/casl/casl';
import {DeleteOutlined} from "@ant-design/icons";
import {Categorie} from "../../types/categorie.types";
import {EditCategoryButton} from "./EditCategory";
import {deleteCategory} from "../../util/CategoryUtil";
import { useTranslation } from 'react-i18next';
import { useIsMobile } from 'hooks/useIsMobile';

export interface CategoryTableProps {
    abteilungId: string
    category: Categorie[]
}


export const CategoryTable = (props: CategoryTableProps) => {

    const { abteilungId, category } = props;
    const { t } = useTranslation();
    const isMobile = useIsMobile();

    if (isMobile) {
        return <List
            dataSource={category}
            renderItem={(record) => (
                <List.Item
                    style={{ padding: '12px 0' }}
                    actions={[
                        <Can key="edit" I='update' this={{...record, abteilungId}}>
                            <EditCategoryButton category={record} categoryId={record.id} abteilungId={abteilungId} />
                        </Can>,
                        <Can key="delete" I='delete' this={{...record, abteilungId}}>
                            <Popconfirm
                                title={t('category:delete.confirm', { name: record.name })}
                                onConfirm={() => deleteCategory(abteilungId, record)}
                                onCancel={() => { }}
                                okText={t('common:confirm.yes')}
                                cancelText={t('common:confirm.no')}
                            >
                                <Button type='text' danger size='small' icon={<DeleteOutlined />} />
                            </Popconfirm>
                        </Can>,
                    ]}
                >
                    <span style={{ fontWeight: 500 }}>{record.name}</span>
                </List.Item>
            )}
        />;
    }

    const columns = [
        {
            title: t('category:table.name'),
            key: 'name',
            dataIndex: 'name'
        },
        {
            title: t('category:table.edit'),
            key: 'edit',
            width: '10%',
            render: (text: string, record: Categorie) => (
                <div style={{display: 'flex', justifyContent: 'space-evenly'}}>
                    <Can I='update' this={{...record, abteilungId: abteilungId}}>
                        <EditCategoryButton category={record} categoryId={record.id} abteilungId={abteilungId} />
                    </Can>
                    <Can I='delete' this={{...record, abteilungId: abteilungId}}>
                       <Popconfirm
                            title={t('category:delete.confirm', { name: record.name })}
                            onConfirm={() => deleteCategory(abteilungId, record)}
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

    return <Table rowKey='id' columns={columns} dataSource={category}/>;


}