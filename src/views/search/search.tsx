import classNames from 'classnames';
import appStyles from 'styles.module.scss';
import { Col, message, PageHeader, Result, Spin, Statistic, Typography } from 'antd';
import { useAuth0 } from '@auth0/auth0-react';
import ceviLogoImage from 'assets/onlinemat_logo.png';
import Search from 'antd/lib/input/Search';
import { useEffect, useMemo, useState } from 'react';
import { firestore, } from 'config/firebase/firebase';
import { abteilungenCollection, abteilungenMaterialsCollection } from 'config/firebase/collections';
import { Material } from 'types/material.types';
import { Abteilung } from 'types/abteilung.type';
import { useSearchParams } from 'react-router-dom';
import {useUser} from "../../hooks/use-user";

export interface SeatchMaterial extends Material {
    abteilungId: string | undefined
}

export interface SearchParams {
    q: string | undefined
}

export const SearchView = () => {
    const { user, isAuthenticated } = useAuth0();
    const [searchParams, setSearchParams] = useSearchParams();

    const initQuery = searchParams.has('q') ? searchParams.get('q') : undefined;


    const [query, setQuery] = useState<string | undefined>(initQuery !== null ? initQuery : undefined);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState<string | undefined>(initQuery !== null ? initQuery : undefined);
    const [abteilungLoading, setAbteilungLoading] = useState(false);
    const [material, setMaterial] = useState<SeatchMaterial[]>([]);

    const userState = useUser();

    const searchKey = 'keywords';

    const [abteilungen, setAbteilungen] = useState<Abteilung[]>([]);

    useEffect(() => {
        if (!isAuthenticated) return;
        setAbteilungLoading(true);
        return firestore().collection(abteilungenCollection).onSnapshot(snap => {
            setAbteilungLoading(false);
            const abteilungenLoaded = snap.docs.flatMap(doc => {
                return {
                    ...doc.data(),
                    __caslSubjectType__: 'Abteilung',
                    id: doc.id
                } as Abteilung;
            });
            setAbteilungen(abteilungenLoaded);
        }, (err) => {
            message.error(`Es ist ein Fehler aufgetreten ${err}`)
            console.error('Es ist ein Fehler aufgetreten', err)
        });
    }, [isAuthenticated]);

    useMemo(() => {
        const queryFirebase = async () => {
            try {
                setLoading(true)
                const querySnapshot = await firestore().collectionGroup(abteilungenMaterialsCollection).where('onlyLendInternal', '==', false).where(searchKey, 'array-contains', search).limit(50).get();

                setLoading(false);

                const materialLoaded = querySnapshot.docs.flatMap(doc => {
                    return {
                        ...doc.data(),
                        __caslSubjectType__: 'Material',
                        id: doc.id,
                        abteilungId: doc.ref.parent.parent?.id
                    } as SeatchMaterial;
                });
                setMaterial(materialLoaded);
            } catch (err) {
                setLoading(false);
                message.error(`Es ist ein Fehler aufgetreten ${err}`)
                console.error('Es ist ein Fehler aufgetreten', err)
            }

        }
        if (search && search !== '') {
            queryFirebase()
        } else {
            setMaterial([])
        }
    }, [search])

    useMemo(() => {
        if(query !== search) return;
        const params = new URLSearchParams()
        
        if (query) {
            params.append('q', query)
        } else {
            params.delete('q')
        }
        setSearchParams(params);
    }, [query, search])


    return <div className={classNames(appStyles['flex-grower'], appStyles['center-container-stretch'])}>
        <PageHeader title='Material Übersicht'></PageHeader>
        <Statistic title='Abteilungen' value={abteilungen.length || 0} />

        {
            abteilungLoading && <Spin />
        }

        {
            !!user && <div className={classNames(appStyles['flex-grower'], appStyles['center-container'])}>
                <h1>Onlinemat Suche</h1>
                <p>Du kannst nach Material suchen. Wenn es eine Abteilung hat, wird dir das hier angezeigt.</p>

                <Search placeholder='Materialname' value={query} onSearch={(val)=>setSearch(val)} onChange={(e)=> {
                    e.preventDefault()
                    setQuery(e.currentTarget.value.toLowerCase())
                }} disabled={loading} />
                {
                    loading && <Spin />
                }
                {
                    material.map(mat => {
                        const abteilung = abteilungen.filter(ab => ab.id === mat.abteilungId).length > 0 ? abteilungen.filter(ab => ab.id === mat.abteilungId)[0] : undefined;
                        return <p key={mat.id}>{`${mat.name} `}<a href={abteilung ? `/abteilungen/${abteilung.slug || abteilung.id}` : '/abteilungen'}>{abteilung && abteilung.name ? abteilung.name : 'Unbekannte Abteilung'}</a></p>
                    })
                }
            </div>
        }
    </div>
}
