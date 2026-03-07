import {DeleteOutlined, ShoppingCartOutlined} from '@ant-design/icons';
import { Button, List as AntList, Modal, Popconfirm, Table, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { Can } from 'config/casl/casl';
import { Categorie } from 'types/categorie.types';
import { Material } from 'types/material.types';
import { Sammlung } from 'types/sammlung.types';
import { DisplayItem } from 'types/displayItem.types';
import { deleteMaterial, getAvailableMatCount, getAvailableMatString } from 'util/MaterialUtil';
import { EditMaterialButton } from './EditMaterial';
import {Standort} from "types/standort.types";
import React, {useContext, useMemo, useState} from "react";
import {ViewMaterial} from "./ViewMaterial";
import {useUser} from "../../hooks/use-user";
import {MaterialsContext} from 'contexts/AbteilungContexts';



export interface MaterialTablelProps {
    abteilungId: string
    material: Material[]
    sammlungen: Sammlung[]
    categorie: Categorie[]
    standort: Standort[]
    addToCart: (mat: Material) => void
    addSammlungToCart: (s: Sammlung) => void
}


export const MaterialTable = (props: MaterialTablelProps) => {

    const { abteilungId, material, sammlungen, categorie, standort, addToCart, addSammlungToCart } = props;
    const { t } = useTranslation();

    const userState = useUser();
    const { materials: allMaterials } = useContext(MaterialsContext);

    const filteredMaterials = (userState.appUser?.userData?.roles|| {})[abteilungId]?.includes('guest') ?
        material.filter(material => !material.onlyLendInternal) : material;

    const displayItems: DisplayItem[] = useMemo(() => {
        const items: DisplayItem[] = [
            ...filteredMaterials.map(m => ({ type: 'material' as const, data: m })),
            ...sammlungen.map(s => ({ type: 'sammlung' as const, data: s })),
        ];
        return items.sort((a, b) => a.data.name.normalize().localeCompare(b.data.name.normalize()));
    }, [filteredMaterials, sammlungen]);

    const columns = [
        {
            title: t('material:table.name'),
            key: 'name',
            sorter: (a: DisplayItem, b: DisplayItem) => a.data.name.normalize().localeCompare(b.data.name.normalize()),
            render: (_: any, record: DisplayItem) => {
                if (record.type === 'sammlung') {
                    return <span><Tag color="blue">Sammlung</Tag> {record.data.name}</span>;
                }
                return <a onClick={()=> {
                    setActiveRecord(record.data);
                    setIsModalVisible(!isModalVisible);
                }}>
                    {record.data.name}
                </a>
            }
        },
        {
            title: t('material:table.comment'),
            key: 'comment',
            sorter: (a: DisplayItem, b: DisplayItem) => {
                const aVal = a.type === 'material' ? (a.data.comment || '') : (a.data.description || '');
                const bVal = b.type === 'material' ? (b.data.comment || '') : (b.data.description || '');
                return aVal.normalize().localeCompare(bVal.normalize());
            },
            render: (_: any, record: DisplayItem) => {
                if (record.type === 'sammlung') {
                    return <p key={`${record.data.id}_comment`}>{record.data.description || '-'}</p>;
                }
                return <p key={`${record.data.id}_comment`}>{record.data.comment || '-'}</p>;
            },
        },
        {
            title: t('material:table.category'),
            key: 'categoryIds',
            filters: [
                ...categorie.map(cat => ({
                    text: cat.name,
                    value: cat.id
                })),
                { text: t('material:table.uncategorized'), value: '__uncategorized__' }
            ],
            onFilter: (value: any, record: DisplayItem) => {
                if (record.type === 'sammlung') return true;
                return filterCategorie(value, record.data);
            },
            render: (_: any, record: DisplayItem) => {
                if (record.type === 'sammlung') return <p key={`${record.data.id}_category`}>-</p>;
                return <p key={`${record.data.id}_category`}>{displayCategorieNames(categorie, record.data.categorieIds || [])}</p>;
            },
        },
        {
            title: t('material:table.standort'),
            key: 'standortIds',
            filters: standort.map(ort => {
                return {
                    text: ort.name,
                    value: ort.id
                }
            }),
            onFilter: (value: any, record: DisplayItem) => {
                if (record.type === 'sammlung') return true;
                return filterStandort(value, record.data);
            },
            render: (_: any, record: DisplayItem) => {
                if (record.type === 'sammlung') return <p key={`${record.data.id}_standort`}>-</p>;
                return <p key={`${record.data.id}_standort`}>{displayStandortNames(standort, record.data.standort || [])}</p>;
            },
        },
        {
            title: t('material:table.weight'),
            key: 'weightInKg',
            sorter: (a: DisplayItem, b: DisplayItem) => {
                const aW = a.type === 'material' ? (a.data.weightInKg || 0) : 0;
                const bW = b.type === 'material' ? (b.data.weightInKg || 0) : 0;
                return aW - bW;
            },
            render: (_: any, record: DisplayItem) => {
                if (record.type === 'sammlung') return <p key={`${record.data.id}_weightInKg`}>-</p>;
                return <p key={`${record.data.id}_weightInKg`}>{record.data.weightInKg ? t('material:table.weightUnit', { weight: record.data.weightInKg }) : '-'}</p>;
            },
        },
        {
            title: t('material:table.available'),
            key: 'count',
            render: (_: any, record: DisplayItem) => {
                if (record.type === 'sammlung') {
                    return <p key={`${record.data.id}_count`}>{t('sammlung:table.itemCount', { count: record.data.items.length })}</p>;
                }
                return <p key={`${record.data.id}_count`}>{getAvailableMatString(record.data) + (!!record.data.consumables ? getAvailableMatCount(record.data) <= 0 ? '/' + t('material:table.unlimited') : '' : `/${record.data.count}`)}</p>;
            },
            sorter: (a: DisplayItem, b: DisplayItem) => {
                const aC = a.type === 'material' ? a.data.count : 0;
                const bC = b.type === 'material' ? b.data.count : 0;
                return aC - bC;
            },
        },
        {
            title: t('material:table.cart'),
            key: 'basket',
            render: (_: any, record: DisplayItem) => {
                if (record.type === 'sammlung') {
                    return (
                        <div style={{display: 'flex', justifyContent: 'space-evenly'}}>
                            <Button type='primary' icon={<ShoppingCartOutlined />} onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                addSammlungToCart(record.data);
                            }} />
                        </div>
                    );
                }
                return (
                    <div style={{display: 'flex', justifyContent: 'space-evenly'}}>
                        <Button type='primary' icon={<ShoppingCartOutlined />} onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation()
                            addToCart(record.data)
                        }} />
                        <Can I='update' this={{...record.data, abteilungId: abteilungId}}>
                            <EditMaterialButton material={record.data} materialId={record.data.id} abteilungId={abteilungId} />
                        </Can>
                        <Can I='delete' this={{...record.data, abteilungId: abteilungId}}>
                           <Popconfirm
                                title={t('material:delete.confirmSingle', { name: record.data.name })}
                                onConfirm={(event) => {event?.stopPropagation(); deleteMaterial(abteilungId, record.data)}}
                                onCancel={() => { }}
                                okText={t('common:confirm.yes')}
                                cancelText={t('common:confirm.no')}
                            >
                                <Button type='dashed' danger icon={<DeleteOutlined />} />
                            </Popconfirm>
                        </Can>
                    </div>
                );
            }
        }
    ];


    const [isModalVisible, setIsModalVisible] = useState(false);
    const [activeRecord, setActiveRecord] = useState<Material>();

    return <>
            <Table
                rowKey={(record: DisplayItem) => `${record.type}_${record.data.id}`}
                columns={columns}
                dataSource={displayItems}
                expandable={{
                    expandedRowRender: (record: DisplayItem) => {
                        if (record.type !== 'sammlung') return null;
                        return (
                            <AntList
                                size="small"
                                dataSource={record.data.items}
                                renderItem={(item) => {
                                    const mat = allMaterials.find(m => m.id === item.matId);
                                    return (
                                        <AntList.Item>
                                            {mat?.name || item.matId} × {item.count}
                                        </AntList.Item>
                                    );
                                }}
                            />
                        );
                    },
                    rowExpandable: (record: DisplayItem) => record.type === 'sammlung',
                }}
            />
            <Modal
                title={activeRecord?.name}
                open={isModalVisible}
                onCancel={() => {
                    setIsModalVisible(false);
                }}
                footer={[
                    <Button key='back' onClick={() => {
                        setIsModalVisible(false);
                    }}>
                        {t('common:buttons.cancel')}
                    </Button>
                ]}
            >
                <ViewMaterial material={activeRecord} abteilungId={abteilungId}></ViewMaterial>
            </Modal>
        </>


}

export const filterCategorie = (value: any, record: Material): boolean => {
    if (value === '__uncategorized__') {
        return !record.categorieIds || record.categorieIds.length === 0;
    }

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
