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
import { Can } from 'config/casl/casl';
import { AbteilungEntityCasl } from 'config/casl/ability';
import { getAbteilungIdBySlugOrId } from 'util/AbteilungUtil';

export type AbteilungMaterialViewProps = {
    abteilung: Abteilung;
};

export const AbteilungMaterialView = (props: AbteilungMaterialViewProps) => {
    const { abteilung } = props;
    const { user, isAuthenticated } = useAuth0();

    const { Search } = Input;


    const [abteilungLoading, setAbteilungLoading] = useState(false);
    const [matLoading, setMatLoading] = useState(false);
    const [catLoading, setCatLoading] = useState(false);

    const [material, setMaterial] = useState<Material[]>([]);
    const [categorie, setCategorie] = useState<Categorie[]>([])

    const [query, setQuery] = useState<string | undefined>(undefined);
    const [displayMode, setDisplayMode] = useState<'table' | 'grid'>('table');


    useEffect(() => {
        const listener = async () => {

            if(!isAuthenticated) return;

            //fetch material
            setMatLoading(true);
            firestore().collection(abteilungenCollection).doc(abteilung.id).collection(abteilungenMaterialsCollection).onSnapshot(snap => {
                setMatLoading(false);
                const materialLoaded = snap.docs.flatMap(doc => {
                    return {
                        ...doc.data(),
                        __caslSubjectType__: 'Material',
                        id: doc.id
                    } as Material;
                });
                setMaterial(materialLoaded);
            }, (err) => {
                message.error(`Es ist ein Fehler aufgetreten ${err}`)
            });

            //fetch categories
            setCatLoading(true);
            return firestore().collection(abteilungenCollection).doc(abteilung.id).collection(abteilungenCategoryCollection).onSnapshot(snap => {
                setCatLoading(false);
                const categoriesLoaded = snap.docs.flatMap(doc => {
                    return {
                        ...doc.data(),
                        __caslSubjectType__: 'Categorie',
                        id: doc.id
                    } as Categorie;
                });
                setCategorie(categoriesLoaded);
            }, (err) => {
                message.error(`Es ist ein Fehler aufgetreten ${err}`)
            });

        }

        listener()

    }, [isAuthenticated, abteilung]);

    const addToBasket = (materialId: string) => {

    }

    if(!abteilung) {
        return <Spin/>
    }

    return <div className={classNames(appStyles['flex-grower'])}>

        <div className={classNames(appStyles['flex-grower'])}>
            <Can I={'create'} this={{ __caslSubjectType__: 'Material', abteilungId: abteilung.id } as AbteilungEntityCasl}>
                <AddMaterialButton abteilungId={abteilung.id} />
            </Can>

            <Can I={'create'} this={{ __caslSubjectType__: 'Categorie', abteilungId: abteilung.id } as AbteilungEntityCasl}>
                <AddCategorieButton abteilungId={abteilung.id} />
            </Can>

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
                            displayMode === 'table' && <MaterialTable abteilungId={abteilung.id} categorie={categorie} material={query ? material.filter(mat => mat.name.toLowerCase().includes(query.toLowerCase())) : material} addToBasket={addToBasket} />
                        }
                        {
                            displayMode === 'grid' && <MaterialGrid categorie={categorie} material={query ? material.filter(mat => mat.name.toLowerCase().includes(query.toLowerCase())) : material} addToBasket={addToBasket} />
                        }
                    </>
            }
        </div>
    </div>
}
