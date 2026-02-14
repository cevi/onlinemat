import {Button, Popconfirm, Table} from 'antd';
import {Can} from 'config/casl/casl';
import {DeleteOutlined} from "@ant-design/icons";
import {Categorie} from "../../types/categorie.types";
import {EditCategoryButton} from "./EditCategory";
import {deleteCategory} from "../../util/CategoryUtil";
import { useTranslation } from 'react-i18next';

export interface CategoryTableProps {
    abteilungId: string
    category: Categorie[]
}


export const CategoryTable = (props: CategoryTableProps) => {

    const { abteilungId, category } = props;
    const { t } = useTranslation();

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
                            <Button type='ghost' danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                    </Can>
                </div>
            )
        }
    ];

    return <Table rowKey='id' columns={columns} dataSource={category}/>;


}