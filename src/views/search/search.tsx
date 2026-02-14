import { useContext, useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';
import appStyles from 'styles.module.scss';
import { AutoComplete, Card, Col, Row, Spin, Tag, Typography } from 'antd';
import { useAuth0 } from '@auth0/auth0-react';
import { db } from 'config/firebase/firebase';
import { collectionGroup, query as firestoreQuery, where, limit, getDocs } from 'firebase/firestore';
import { abteilungenMaterialsCollection } from 'config/firebase/collections';
import { Material } from 'types/material.types';
import { Abteilung } from 'types/abteilung.type';
import { useSearchParams } from 'react-router-dom';
import { AbteilungenContext } from 'components/navigation/NavigationMenu';
import { SearchOutlined } from '@ant-design/icons';
import { Input } from 'antd';

interface SearchMaterial extends Material {
    abteilungId: string | undefined
}

const FEATURED_DISPLAY_COUNT = 6;

export const SearchView = () => {
    const { isAuthenticated } = useAuth0();
    const [searchParams, setSearchParams] = useSearchParams();

    const initQuery = searchParams.get('q') ?? '';

    const [query, setQuery] = useState(initQuery);
    const [results, setResults] = useState<SearchMaterial[]>([]);
    const [hasSearched, setHasSearched] = useState(false);

    const [allSearchable, setAllSearchable] = useState<SearchMaterial[]>([]);
    const [allLoading, setAllLoading] = useState(false);

    const { abteilungen } = useContext(AbteilungenContext);

    const findAbteilung = (abteilungId: string | undefined): Abteilung | undefined => {
        if (!abteilungId) return undefined;
        return abteilungen.find(ab => ab.id === abteilungId);
    };

    // Load all searchable materials on mount for autocomplete + featured
    useEffect(() => {
        if (!isAuthenticated) return;
        const loadAll = async () => {
            try {
                setAllLoading(true);
                const snap = await getDocs(
                    firestoreQuery(
                        collectionGroup(db, abteilungenMaterialsCollection),
                        where('onlyLendInternal', '==', false),
                        limit(200)
                    )
                );
                const loaded = snap.docs.map(doc => ({
                    ...doc.data(),
                    __caslSubjectType__: 'Material',
                    id: doc.id,
                    abteilungId: doc.ref.parent.parent?.id
                } as SearchMaterial));
                setAllSearchable(loaded);
                setAllLoading(false);
            } catch (err) {
                setAllLoading(false);
                console.error('Fehler beim Laden der Materialien', err);
            }
        };
        loadAll();
    }, [isAuthenticated]);

    // Featured: random selection from loaded materials
    const featured = useMemo(() => {
        if (allSearchable.length === 0) return [];
        const shuffled = [...allSearchable].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, FEATURED_DISPLAY_COUNT);
    }, [allSearchable]);

    // Autocomplete options: fuzzy filter on name as user types
    const autocompleteOptions = useMemo(() => {
        const term = query.trim().toLowerCase();
        if (!term) return [];
        return allSearchable
            .filter(mat => mat.name.toLowerCase().includes(term))
            .slice(0, 10)
            .map(mat => {
                const abteilung = findAbteilung(mat.abteilungId);
                return {
                    value: mat.name,
                    label: (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{mat.name}</span>
                            <Tag color="blue" style={{ marginLeft: 8 }}>{abteilung?.name ?? 'Unbekannt'}</Tag>
                        </div>
                    ),
                    key: mat.id,
                };
            });
    }, [query, allSearchable, abteilungen]);

    // Execute search: filter from loaded materials client-side
    const doSearch = (term: string) => {
        const normalized = term.trim().toLowerCase();
        if (!normalized) {
            setResults([]);
            setHasSearched(false);
            setSearchParams({});
            return;
        }

        setSearchParams({ q: normalized });
        setHasSearched(true);

        const filtered = allSearchable.filter(mat =>
            mat.name.toLowerCase().includes(normalized)
        );
        setResults(filtered);
    };

    // Run initial search if URL has query param
    useEffect(() => {
        if (initQuery && allSearchable.length > 0) {
            doSearch(initQuery);
        }
    }, [allSearchable]);

    const renderResultItem = (mat: SearchMaterial) => {
        const abteilung = findAbteilung(mat.abteilungId);
        const href = abteilung
            ? `/abteilungen/${abteilung.slug || abteilung.id}/mat`
            : '/abteilungen';

        return (
            <Col key={mat.id} xs={24} sm={12} md={8}>
                <a href={href} style={{ textDecoration: 'none' }}>
                    <Card hoverable size="small">
                        <Card.Meta
                            title={mat.name}
                            description={abteilung?.name ?? 'Unbekannte Abteilung'}
                        />
                    </Card>
                </a>
            </Col>
        );
    };

    return <div className={classNames(appStyles['flex-grower'], appStyles['center-container-stretch'])} style={{ alignItems: 'center' }}>
        <Typography.Title level={3}>Material Suche</Typography.Title>
        <Typography.Paragraph type="secondary">
            Suche nach Material, das von Abteilungen zum Ausleihen angeboten wird.
        </Typography.Paragraph>

        <AutoComplete
            options={autocompleteOptions}
            onSearch={setQuery}
            onSelect={(value) => { setQuery(value); doSearch(value); }}
            value={query}
            style={{ maxWidth: 600, width: '100%', marginBottom: 24 }}
        >
            <Input.Search
                placeholder='Nach Material suchen...'
                enterButton='Suchen'
                size='large'
                prefix={<SearchOutlined />}
                onSearch={doSearch}
                loading={allLoading}
                allowClear
            />
        </AutoComplete>

        {(allLoading || allLoading) && <Spin style={{ marginBottom: 16 }} />}

        {hasSearched && !allLoading && (
            <>
                <Typography.Title level={5}>
                    {results.length > 0
                        ? `${results.length} Ergebnis${results.length !== 1 ? 'se' : ''} gefunden`
                        : 'Keine Ergebnisse gefunden'}
                </Typography.Title>
                <Row gutter={[16, 16]} style={{ maxWidth: 800 }}>
                    {results.map(renderResultItem)}
                </Row>
            </>
        )}

        {!hasSearched && !allLoading && !allLoading && (
            <>
                <Typography.Title level={5} style={{ marginTop: 16 }}>Vorschläge</Typography.Title>
                <Row gutter={[16, 16]} style={{ maxWidth: 800 }}>
                    {featured.map(mat => {
                        const abteilung = findAbteilung(mat.abteilungId);
                        const href = abteilung
                            ? `/abteilungen/${abteilung.slug || abteilung.id}/mat`
                            : '/abteilungen';
                        return (
                            <Col key={mat.id} xs={24} sm={12} md={8}>
                                <a href={href} style={{ textDecoration: 'none' }}>
                                    <Card hoverable size="small">
                                        <Card.Meta
                                            title={mat.name}
                                            description={abteilung?.name ?? 'Unbekannte Abteilung'}
                                        />
                                    </Card>
                                </a>
                            </Col>
                        );
                    })}
                </Row>
            </>
        )}
    </div>
}
