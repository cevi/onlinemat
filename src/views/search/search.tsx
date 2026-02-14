import { useContext, useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';
import appStyles from 'styles.module.scss';
import { AutoComplete, Card, Col, Row, Spin, Table, Tag, Typography } from 'antd';
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
import { useTranslation } from 'react-i18next';

interface SearchMaterial extends Material {
    abteilungId: string | undefined
}

const FEATURED_DISPLAY_COUNT = 6;

export const SearchView = () => {
    const { t } = useTranslation('search');
    const { isAuthenticated } = useAuth0();
    const [searchParams, setSearchParams] = useSearchParams();

    const initQuery = searchParams.get('q') ?? '';

    const [query, setQuery] = useState(initQuery);
    const [results, setResults] = useState<SearchMaterial[]>([]);
    const [abteilungResults, setAbteilungResults] = useState<Abteilung[]>([]);
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
                console.error(t('search:error'), err);
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

    // Autocomplete options: deduplicated by material name, max 10 unique names
    // Hide options once a search has been executed to prevent feedback loop
    const autocompleteOptions = useMemo(() => {
        if (hasSearched) return [];
        const term = query.trim().toLowerCase();
        if (!term) return [];
        const filtered = allSearchable.filter(mat => mat.name.toLowerCase().includes(term));

        // Group by material name (case-insensitive)
        const grouped = new Map<string, { name: string; abteilungIds: Set<string> }>();
        for (const mat of filtered) {
            const key = mat.name.toLowerCase();
            if (!grouped.has(key)) {
                grouped.set(key, { name: mat.name, abteilungIds: new Set() });
            }
            if (mat.abteilungId) {
                grouped.get(key)!.abteilungIds.add(mat.abteilungId);
            }
        }

        return Array.from(grouped.values()).slice(0, 10).map((group, index) => {
            const count = group.abteilungIds.size;
            const tag = count === 1
                ? (() => {
                    const ab = findAbteilung(Array.from(group.abteilungIds)[0]);
                    return ab?.name ?? t('common:status.unknown');
                })()
                : t('search:suggestions.multipleAbteilungen', { count });

            return {
                value: group.name,
                label: (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{group.name}</span>
                        <Tag color="blue" style={{ marginLeft: 8 }}>{tag}</Tag>
                    </div>
                ),
                key: `suggestion_${index}`,
            };
        });
    }, [query, allSearchable, abteilungen, hasSearched]);

    // Handle typing in autocomplete — resets search mode so suggestions reappear
    const handleSearchInput = (value: string) => {
        setQuery(value);
        if (hasSearched) setHasSearched(false);
    };

    // Execute search: filter materials + abteilungen client-side
    const doSearch = (term: string) => {
        const normalized = term.trim().toLowerCase();
        if (!normalized) {
            setResults([]);
            setAbteilungResults([]);
            setHasSearched(false);
            setSearchParams({});
            return;
        }

        if (searchParams.get('q') !== normalized) {
            setSearchParams({ q: normalized });
        }
        setHasSearched(true);

        const filtered = allSearchable.filter(mat =>
            mat.name.toLowerCase().includes(normalized)
        );
        setResults(filtered);

        const matchedAbteilungen = abteilungen.filter(ab =>
            ab.name.toLowerCase().includes(normalized)
        );
        setAbteilungResults(matchedAbteilungen);
    };

    // Run initial search if URL has query param
    useEffect(() => {
        if (initQuery && allSearchable.length > 0) {
            doSearch(initQuery);
        }
    }, [allSearchable]);

    const abteilungColumns = [
        {
            title: t('search:abteilungen.name'),
            dataIndex: 'name',
            key: 'name',
            render: (name: string, ab: Abteilung) => (
                <a href={`/abteilungen/${ab.slug || ab.id}/mat`}>{name}</a>
            ),
        },
    ];

    const materialColumns = [
        {
            title: t('search:results.materialName'),
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: t('search:results.abteilung'),
            dataIndex: 'abteilungId',
            key: 'abteilung',
            render: (abteilungId: string | undefined) => {
                const ab = findAbteilung(abteilungId);
                if (!ab) return t('search:unknownAbteilung');
                return <a href={`/abteilungen/${ab.slug || ab.id}/mat`}>{ab.name}</a>;
            },
        },
    ];

    return <div className={classNames(appStyles['flex-grower'], appStyles['center-container-stretch'])} style={{ alignItems: 'center' }}>
        <Typography.Title level={3}>{t('search:title')}</Typography.Title>
        <Typography.Paragraph type="secondary">
            {t('search:description')}
        </Typography.Paragraph>

        <AutoComplete
            options={autocompleteOptions}
            onSearch={handleSearchInput}
            onSelect={(value) => { setQuery(value); doSearch(value); }}
            value={query}
            style={{ maxWidth: 600, width: '100%', marginBottom: 24 }}
        >
            <Input.Search
                placeholder={t('search:placeholder')}
                enterButton={t('common:buttons.search')}
                size='large'
                prefix={<SearchOutlined />}
                onSearch={doSearch}
                loading={allLoading}
                allowClear
            />
        </AutoComplete>

        {allLoading && <Spin style={{ marginBottom: 16 }} />}

        {hasSearched && !allLoading && (
            <>
                {abteilungResults.length > 0 && (
                    <>
                        <Typography.Title level={5}>
                            {t('search:abteilungen.found', { count: abteilungResults.length })}
                        </Typography.Title>
                        <Table
                            dataSource={abteilungResults}
                            columns={abteilungColumns}
                            rowKey="id"
                            size="small"
                            pagination={false}
                            style={{ maxWidth: 800, width: '100%', marginBottom: 24 }}
                        />
                    </>
                )}

                <Typography.Title level={5}>
                    {results.length > 0
                        ? t('search:results.found', { count: results.length })
                        : t('search:results.none')}
                </Typography.Title>
                {results.length > 0 && (
                    <Table
                        dataSource={results}
                        columns={materialColumns}
                        rowKey="id"
                        size="small"
                        style={{ maxWidth: 800, width: '100%' }}
                    />
                )}
            </>
        )}

        {!hasSearched && !allLoading && (
            <>
                <Typography.Title level={5} style={{ marginTop: 16 }}>{t('search:featured.title')}</Typography.Title>
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
                                            description={abteilung?.name ?? t('search:unknownAbteilung')}
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
