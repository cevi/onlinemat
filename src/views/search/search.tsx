import classNames from 'classnames';
import appStyles from 'styles.module.scss';
import { Col, message, PageHeader, Radio, Result, Row, Spin, Statistic, Typography } from 'antd';
import { useAuth0 } from '@auth0/auth0-react';
import ceviLogoImage from 'assets/onlinemat_logo.png';
import Search from 'antd/lib/input/Search';
import { useEffect, useMemo, useState } from 'react';
import { firestore, } from 'config/firebase/firebase';
import { abteilungenCollection, abteilungenMaterialsCollection } from 'config/firebase/collections';
import { Material } from 'types/material.types';
import { Abteilung } from 'types/abteilung.type';
import { useSearchParams } from 'react-router-dom';
import { AppstoreOutlined, MenuOutlined } from '@ant-design/icons';
import { MaterialCard } from 'components/material/MaterialGrid';

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
    const [displayMode, setDisplayMode] = useState<'table' | 'grid'>('table');

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
                const querySnapshot = await firestore().collectionGroup(abteilungenMaterialsCollection).where(searchKey, 'array-contains', search).limit(50).get();

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
        if (query !== search) return;
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
        {
            abteilungLoading && <Spin />
        }
        {!abteilungLoading && <Row gutter={[24, 24]}>
            <Col span={24}>
                <Statistic title='Abteilungen' value={abteilungen.length || 0} />
            </Col>
            <Col span={24}>
                <div className={classNames(appStyles['flex-grower'], appStyles['center-container'])}>
                    <h1>Onlinemat Suche</h1>
                    <p>Du kanst nach Material suchen. Wenn es eine Abteilung hat, wird dir das hier angezeigt.</p>
                </div>
            </Col>
            <Col span={22}>
                <Search placeholder='Materialname' value={query} onSearch={(val) => setSearch(val)} onChange={(e) => {
                    e.preventDefault()
                    setQuery(e.currentTarget.value.toLowerCase())
                }} disabled={loading} />
            </Col>
            <Col span={2}>
                <Radio.Group value={displayMode} onChange={(e) => setDisplayMode(e.target.value as 'table' | 'grid')}>
                    <Radio.Button value='table'>{<MenuOutlined />}</Radio.Button>
                    <Radio.Button value='grid' >{<AppstoreOutlined />}</Radio.Button>
                </Radio.Group>
            </Col>
            <Col span={24}>
                <Row gutter={[24, 24]}>
                    {
                        material.map(mat => {
                            const abteilung = abteilungen.filter(ab => ab.id === mat.abteilungId).length > 0 ? abteilungen.filter(ab => ab.id === mat.abteilungId)[0] : undefined;
                            return <MaterialCard material={mat} abteilung={abteilung} isPublic={true} />
                        })
                    }
                </Row>

            </Col>
        </Row>
        }

    </div>
}
