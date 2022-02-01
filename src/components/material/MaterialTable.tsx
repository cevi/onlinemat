import { DeleteOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { Button, Popconfirm, Space, Table } from 'antd';
import { Can } from 'config/casl/casl';
import { Categorie } from 'types/categorie.types';
import { Material } from 'types/material.types';
import { deleteMaterial, getAvailableMatCount, getAvailableMatString } from 'util/MaterialUtil';
import { EditMaterialButton } from './EditMaterial';



export interface MaterialTablelProps {
    abteilungId: string
    material: Material[]
    categorie: Categorie[]
    addToCart: (mat: Material) => void
}


export const MaterialTable = (props: MaterialTablelProps) => {

    const { abteilungId, material, categorie, addToCart } = props;

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            sorter: (a: Material, b: Material) => a.name.normalize().localeCompare(b.name.normalize())
        },
        {
            title: 'Bemerkung',
            dataIndex: 'comment',
            key: 'comment',
            sorter: (a: Material, b: Material) => a.comment.normalize().localeCompare(b.comment.normalize()),
            render: (text: string, record: Material) => (
                <p key={`${record.id}_comment`}>{record.comment || '-'}</p>
            ),
        },
        {
            title: 'Kategorie',
            dataIndex: 'categoryIds',
            key: 'categoryIds',
            filters: categorie.map(cat => {
                return {
                    text: cat.name,
                    value: cat.id
                }
            }),
            onFilter: (value: any, record: Material) => filterCategorie(value, record),
            render: (text: string, record: Material) => (
                <p key={`${record.id}_category`}>{displayCategorieNames(categorie, record.categorieIds || [])}</p>
            ),
        },
        {
            title: 'Gewicht',
            key: 'weightInKg',
            dataIndex: 'weightInKg',
            sorter: (a: Material, b: Material) => {
                if (a.weightInKg && b.weightInKg) {
                    return a.weightInKg - b.weightInKg;
                }
                return 0;
            },
            render: (text: string, record: Material) => (
                <p key={`${record.id}_weightInKg`}>{record.weightInKg ? `${record.weightInKg} Kg` : '-'}</p>
            ),
        },
        {
            title: 'Verfügbar',
            key: 'count',
            render: (text: string, record: Material) => (
                <p key={`${record.id}_count`}>{getAvailableMatString(record) + (!!record.consumables ? getAvailableMatCount(record) <= 0 ? '/unbegrenzt' : '' : `/${record.count}`)}</p>
            ),
            sorter: (a: Material, b: Material) => a.count - b.count
        },
        {
            title: 'Warenkorb',
            key: 'basket',
            render: (text: string, record: Material) => (
                <div style={{display: 'flex', justifyContent: 'space-evenly'}}>
                    <Button type='primary' icon={<ShoppingCartOutlined />} onClick={() => { addToCart(record) }} />
                    <Can I='update' this={record}>
                        <EditMaterialButton material={record} materialId={record.id} abteilungId={abteilungId} />
                    </Can>
                    <Can I='delete' this={record}>
                        <Popconfirm
                            title={`Möchtest du ${record.name} wirklich löschen?`}
                            onConfirm={() => deleteMaterial(abteilungId, record)}
                            onCancel={() => { }}
                            okText='Ja'
                            cancelText='Nein'
                        >
                            <Button type='ghost' danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                    </Can>
                </div>
            )
        }
    ];


    return <Table columns={columns} dataSource={material} />;


}

export const filterCategorie = (value: any, record: Material): boolean => {
    let result: boolean = false;

    if (record.categorieIds) {
        record.categorieIds.forEach(catId => {
            if (catId.indexOf(value as string) === 0) {
                result = true;
            }
        })
    }

    return result;
}

export const displayCategorieNames = (categorie: Categorie[], catIds: string[]): string => {
    if(catIds.length <= 0) return '-';
    let result: string[] = [];
    catIds.forEach(categoryId => {
        const cat = categorie.find(cat => cat.id === categoryId);
        if (cat) {
            result.push(cat.name);
        }
    })

    return result.join();
}