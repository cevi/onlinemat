import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import appStyles from 'styles.module.scss';
import { PageHeader, Spin, Input, Radio, message } from 'antd';
import { useAuth0 } from '@auth0/auth0-react';
import { firestore } from 'config/firebase/firebase';
import { abteilungenCategoryCollection, abteilungenCollection, abteilungenMaterialsCollection } from 'config/firebase/collections';
import { Material } from 'types/material.types';
import { useParams } from 'react-router';
import { AddMaterialButton } from 'components/material/AddMaterial';
import { AppstoreOutlined, MenuOutlined } from '@ant-design/icons';
import { AddCategorieButton } from 'components/categorie/AddCategorie';
import { Categorie } from 'types/categorie.types';
import { Abteilung } from 'types/abteilung.type';
import { MaterialTable } from 'components/material/MaterialTable';
import { MaterialGrid } from 'components/material/MaterialGrid';

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
    const [displayMode, setDisplayMode] = useState<'table' | 'grid'>('table');

    //fetch abteilung
    useEffect(() => {
        setAbteilungLoading(true);
        return firestore().collection(abteilungenCollection).doc(abteilungId).onSnapshot(snap => {
            setAbteilungLoading(false);
            const abteilungLoaded = {
                    ...snap.data() as Abteilung,
                    id: snap.id
                } as Abteilung;
            setAbteilung(abteilungLoaded);
        }, (err) => {
            message.error(`Es ist ein Fehler aufgetreten ${err}`)
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
        }, (err) => {
            message.error(`Es ist ein Fehler aufgetreten ${err}`)
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
        }, (err) => {
            message.error(`Es ist ein Fehler aufgetreten ${err}`)
        });
    }, [isAuthenticated]);

    const addToBasket = (materialId: string) => {

    }

    return <div className={classNames(appStyles['flex-grower'])}>
        <PageHeader title={`Abteilung ${abteilung?.name}`}></PageHeader>



        <div className={classNames(appStyles['flex-grower'])}>
            <AddMaterialButton abteilungId={abteilungId}/>
            <AddCategorieButton abteilungId={abteilungId}/>
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
                            <Radio.Group value={displayMode} onChange={(e) => setDisplayMode(e.target.value as 'table' | 'grid')}>
                                <Radio.Button value='grid' >{<AppstoreOutlined />}</Radio.Button>
                                <Radio.Button value='table'>{<MenuOutlined />}</Radio.Button>
                            </Radio.Group>

                            {
                                displayMode === 'table' && <MaterialTable categorie={categorie} material={query ? material.filter(mat => mat.name.toLowerCase().includes(query.toLowerCase())) : material} addToBasket={addToBasket}/>
                            }
                             {
                                displayMode === 'grid' && <MaterialGrid categorie={categorie} material={query ? material.filter(mat => mat.name.toLowerCase().includes(query.toLowerCase())) : material} addToBasket={addToBasket}/>
                            }
                        </>
                }
        </div>
    </div>
}
