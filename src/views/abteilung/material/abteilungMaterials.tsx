import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import appStyles from 'styles.module.scss';
import { Table, PageHeader, Spin, Button, Input } from 'antd';
import { useAuth0 } from '@auth0/auth0-react';
import { firestore } from 'config/firebase/firebase';
import { abteilungenCategoryCollection, abteilungenCollection, abteilungenMaterialsCollection } from 'config/firebase/collections';
import { Material } from 'types/material.types';
import { useParams } from 'react-router';
import { AddMaterial } from 'components/material/AddMaterial';
import { ShoppingCartOutlined } from '@ant-design/icons';
import { AddCategorie } from 'components/categorie/AddMaterial';
import { Categorie } from 'types/categorie.types';
import { Abteilung } from 'types/abteilung.type';

export type AbteilungMaterialViewParams = {
    abteilungId: string;
  };

export const AbteilungMaterialView = () => {
    const { user, isAuthenticated } = useAuth0();

    const { Search } = Input;

    const { abteilungId } = useParams<AbteilungMaterialViewParams>();
    const[abteilung, setAbteilung] = useState<Abteilung>();

    const [abteilungLoading, setAbteilungLoading] = useState(false);
    const [matLoading, setMatLoading] = useState(false);
    const [catLoading, setCatLoading] = useState(false);

    const [material, setMaterial] = useState<Material[]>([]);
    const [categorie, setCategorie] = useState<Categorie[]>([])

    const [query, setQuery] = useState<string | undefined>(undefined);

    //fetch abteilung
    useEffect(() => {
        setMatLoading(true);
        return firestore().collection(abteilungenCollection).doc(abteilungId).onSnapshot(snap => {
            setAbteilungLoading(false);
            const abteilungLoaded = {
                    ...snap.data() as Abteilung,
                    id: snap.id
                } as Abteilung;
            setAbteilung(abteilungLoaded);
        });
    }, [isAuthenticated]);

    //fetch material
    useEffect(() => {
        setMatLoading(true);
        return firestore().collection(abteilungenCollection).doc(abteilungId).collection(abteilungenMaterialsCollection).onSnapshot(snap => {
            setMatLoading(false);
            const materialLoaded = snap.docs.flatMap(doc => {
                return {
                    ...doc.data() as Material,
                    id: doc.id
                } as any;
            });
            setMaterial(materialLoaded);
        });
    }, [isAuthenticated]);

    //fetch categories
    useEffect(() => {
        setCatLoading(true);
        return firestore().collection(abteilungenCollection).doc(abteilungId).collection(abteilungenCategoryCollection).onSnapshot(snap => {
            setCatLoading(false);
            const categoriesLoaded = snap.docs.flatMap(doc => {
                return {
                    ...doc.data() as Categorie,
                    id: doc.id
                } as any;
            });
            setCategorie(categoriesLoaded);
        });
    }, [isAuthenticated]);

    const addToBasket = (materialId: string) => {

    }

    const filterCategorie = (value: any, record: Material): boolean => {
        let result: boolean = false;

        if(record.categoryIds) {
            record.categoryIds.forEach(catId => {
                if(catId.indexOf(value as string) === 0) {
                    result = true;
                }
            })
        }

        return result;
    }

    const displayCategorieNames = (catIds: string[]) => {
        let result: string[] = [];
        catIds.forEach(categoryId => {
            const cat = categorie.find(cat => cat.id == categoryId);
            if(cat) {
                result.push(cat.name);
            }
        })
        
        return result.join();
    }

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
                <p key={`${record.id}_category`}>{displayCategorieNames(record.categoryIds || [])}</p>
            ),
        },
        {
            title: 'Gewicht',
            key: 'weightInKg',
            dataIndex: 'weightInKg',
            sorter: (a: Material, b: Material) => {
                if(a.weightInKg && b.weightInKg) {
                    return a.weightInKg - b.weightInKg ;
                }
                return 0;
            },
            render: (text: string, record: Material) => (
                <p key={`${record.id}_weightInKg`}>{ record.weightInKg ? `${record.weightInKg} Kg` : 'Unbekannt' }</p>
            ),
        },
        {
            title: 'Anzahl',
            key: 'count',
            render: (text: string, record: Material) => (
                <p key={`${record.id}_count`}>{record.consumables ? 'Unbegrenzt' : record.count}</p>
            ),
            sorter: (a: Material, b: Material) => a.count - b.count
        },
        {
            title: 'Warenkorb',
            key: 'basket',
            render: (text: string, record: Material) => (
                <Button type="primary" icon={<ShoppingCartOutlined />} onClick={()=> { addToBasket(record.id) }}/>
            )
        }
      ];


    return <div className={classNames(appStyles['flex-grower'])}>
        <PageHeader title={`Abteilung ${abteilung?.name}`}></PageHeader>



        <div className={classNames(appStyles['flex-grower'])}>
            <AddMaterial abteilungId={abteilungId}/>
            <AddCategorie abteilungId={abteilungId}/>
                {
                    matLoading || catLoading || abteilungLoading ?
                        <Spin />
                        :
                        <>
                            <Search
                                placeholder="nach Material suchen"
                                allowClear
                                enterButton="Suchen"
                                size="large"
                                onSearch={(query) => setQuery(query)}
                            />
                            <Table columns={columns} dataSource={query ? material.filter(mat => mat.name.toLowerCase().includes(query.toLowerCase())) : material} />
                        </>
                }
        </div>
    </div>
}
