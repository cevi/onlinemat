import {DeleteOutlined, ShoppingCartOutlined} from '@ant-design/icons';
import { Button, Popconfirm, Table } from 'antd';
import { Can } from 'config/casl/casl';
import { Categorie } from 'types/categorie.types';
import { Material } from 'types/material.types';
import { deleteMaterial, getAvailableMatCount, getAvailableMatString } from 'util/MaterialUtil';
import { EditMaterialButton } from './EditMaterial';
import {Standort} from "types/standort.types";
import Modal from "antd/lib/modal/Modal";
import React, {useState} from "react";
import {ViewMaterial} from "./ViewMaterial";



export interface MaterialTablelProps {
    abteilungId: string
    material: Material[]
    categorie: Categorie[]
    standort: Standort[]
    addToCart: (mat: Material) => void
}


export const MaterialTable = (props: MaterialTablelProps) => {

    const { abteilungId, material, categorie, standort, addToCart } = props;

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
            title: 'Standort',
            dataIndex: 'standortIds',
            key: 'standortIds',
            filters: standort.map(ort => {
                return {
                    text: ort.name,
                    value: ort.id
                }
            }),
            onFilter: (value: any, record: Material) => filterStandort(value, record),
            render: (text: string, record: Material) => (
                <p key={`${record.id}_standort`}>{displayStandortNames(standort, record.standort || [])}</p>
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
                    <Button type='primary' icon={<ShoppingCartOutlined />} onClick={(event) => {
                        event.preventDefault();
                        addToCart(record)
                    }} />
                    <Can I='update' this={{...record, abteilungId: abteilungId}}>
                        <EditMaterialButton material={record} materialId={record.id} abteilungId={abteilungId} />
                    </Can>
                    <Can I='delete' this={{...record, abteilungId: abteilungId}}>
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


    const [isModalVisible, setIsModalVisible] = useState(false);
    const [activeRecord, setActiveRecord] = useState<Material>();

    return <>
            <Table rowKey='id' columns={columns} dataSource={material}
                    onRow={(record, rowIndex) => {
                        return {
                            onClick: event => {
                                setActiveRecord(record);
                                setIsModalVisible(!isModalVisible);
                            }, // click row
                        };
            }}/>
            <Modal
                title={activeRecord?.name}
                visible={isModalVisible}
                onCancel={() => {
                    setIsModalVisible(false);
                }}
                footer={[
                    <Button key='back' onClick={() => {
                        setIsModalVisible(false);
                    }}>
                        Abbrechen
                    </Button>
                ]}
            >
                <ViewMaterial material={activeRecord}></ViewMaterial>
            </Modal>
        </>


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
export const filterStandort = (value: any, record: Material): boolean => {
    let result: boolean = false;

    if (record.standort) {
        record.standort.forEach(ortId => {
            if (ortId.indexOf(value as string) === 0) {
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
export const displayStandortNames = (standort: Standort[], standortIds: string[]): string => {
    if(standortIds.length <= 0) return '-';
    let result: string[] = [];
    standortIds.forEach(standortId => {
        const ort = standort.find(ort => ort.id === standortId);
        if (ort) {
            result.push(ort.name);
        }
    })

    return result.join();
}