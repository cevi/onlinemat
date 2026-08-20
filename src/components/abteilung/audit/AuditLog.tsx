import { useContext, useMemo, useState } from 'react';
import { Alert, Button, Col, Empty, Input, List, Row, Select, Space, Table, Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router';
import dayjs from 'dayjs';
import { collection, limit as firestoreLimit, orderBy, query as firestoreQuery, where } from 'firebase/firestore';
import { db } from 'config/firebase/firebase';
import { abteilungenAuditLogCollection, abteilungenCollection } from 'config/firebase/collections';
import { ability } from 'config/casl/ability';
import { useFirestoreCollection } from 'hooks/useFirestoreCollection';
import { useIsMobile } from 'hooks/useIsMobile';
import { Abteilung } from 'types/abteilung.type';
import {
    AUDIT_ENTITY_TYPES,
    AUDIT_RETENTION_DAYS,
    AuditAction,
    AuditChange,
    AuditEntityType,
    AuditLogEntry,
    MATCHEF_VISIBLE_ENTITY_TYPES,
} from 'types/auditLog.types';
import { dateFormatWithTime } from 'util/constants';
import { auditEntryMatchesQuery, formatAuditValue, getAuditActionColor, getAuditFieldLabel } from 'util/AuditLogUtil';
import { MembersUserDataContext } from 'contexts/AbteilungContexts';

const PAGE_SIZE = 100;
const ACTIONS: AuditAction[] = ['create', 'update', 'delete'];

export interface AuditLogProps {
    abteilung: Abteilung;
}

const ChangesTable = ({ changes }: { changes: AuditChange[] }) => {
    const { t } = useTranslation();
    if (!changes || changes.length === 0) {
        return <Typography.Text type="secondary">{t('audit:changes.none')}</Typography.Text>;
    }
    return (
        <Table
            size="small"
            pagination={false}
            rowKey={(c) => c.field}
            dataSource={changes}
            columns={[
                { title: t('audit:changes.field'), dataIndex: 'field', key: 'field', width: 180, render: (field: string) => <strong>{getAuditFieldLabel(field, t)}</strong> },
                { title: t('audit:changes.before'), dataIndex: 'before', key: 'before', render: (v: unknown) => <Typography.Text delete type="secondary" style={{ wordBreak: 'break-word' }}>{formatAuditValue(v, t)}</Typography.Text> },
                { title: t('audit:changes.after'), dataIndex: 'after', key: 'after', render: (v: unknown) => <Typography.Text style={{ wordBreak: 'break-word' }}>{formatAuditValue(v, t)}</Typography.Text> },
            ]}
        />
    );
};

export const AuditLog = (props: AuditLogProps) => {
    const { abteilung } = props;
    const { t } = useTranslation();
    const { isAuthenticated } = useAuth0();
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const { userData } = useContext(MembersUserDataContext);

    // Admins and staff see everything; matchefs only the entries flagged for them (enforced by Firestore rules)
    const canReadAll = useMemo(
        () => ability.can('update', { __caslSubjectType__: 'Abteilung', id: abteilung.id } as Abteilung),
        [abteilung.id],
    );

    const [pageLimit, setPageLimit] = useState(PAGE_SIZE);
    const [search, setSearch] = useState('');
    const [entityTypeFilter, setEntityTypeFilter] = useState<AuditEntityType | undefined>();
    const [actionFilter, setActionFilter] = useState<AuditAction | undefined>();
    const [actorFilter, setActorFilter] = useState<string | undefined>();

    const auditQuery = useMemo(() => {
        const ref = collection(db, abteilungenCollection, abteilung.id, abteilungenAuditLogCollection);
        return canReadAll
            ? firestoreQuery(ref, orderBy('timestamp', 'desc'), firestoreLimit(pageLimit))
            : firestoreQuery(ref, where('visibility', '==', 'matchef'), orderBy('timestamp', 'desc'), firestoreLimit(pageLimit));
    }, [abteilung.id, canReadAll, pageLimit]);

    const { data: entries, loading } = useFirestoreCollection<AuditLogEntry>({
        ref: auditQuery,
        enabled: isAuthenticated,
        transform: (data, id) => ({ ...data, __caslSubjectType__: 'AuditLog', id, changes: data.changes || [] } as AuditLogEntry),
        deps: [isAuthenticated, auditQuery],
    });

    const resolveActorName = (entry: AuditLogEntry): string => {
        return userData[entry.actorId]?.displayName || entry.actorName || entry.actorId;
    };

    const actorOptions = useMemo(() => {
        const byId = new Map<string, string>();
        entries.forEach(e => byId.set(e.actorId, resolveActorName(e)));
        return Array.from(byId.entries())
            .map(([value, label]) => ({ value, label }))
            .sort((a, b) => a.label.localeCompare(b.label));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [entries, userData]);

    const availableEntityTypes = canReadAll ? AUDIT_ENTITY_TYPES : MATCHEF_VISIBLE_ENTITY_TYPES;

    const filtered = useMemo(() => entries.filter(entry =>
        (!entityTypeFilter || entry.entityType === entityTypeFilter)
        && (!actionFilter || entry.action === actionFilter)
        && (!actorFilter || entry.actorId === actorFilter)
        && auditEntryMatchesQuery(entry, search),
    ), [entries, entityTypeFilter, actionFilter, actorFilter, search]);

    const formatTimestamp = (entry: AuditLogEntry) => entry.timestamp ? dayjs(entry.timestamp.toDate()).format(dateFormatWithTime) : '…';

    const getEntityLink = (entry: AuditLogEntry): string | undefined => {
        const base = `/abteilungen/${abteilung.slug || abteilung.id}`;
        switch (entry.entityType) {
            case 'order':
                return entry.action === 'delete' ? undefined : `${base}/order/${entry.entityId}`;
            case 'member':
            case 'invitation':
                return `${base}/members`;
            case 'abteilung':
                return `${base}/settings`;
            case 'material':
                return entry.action === 'delete' ? undefined : `${base}/mat`;
            case 'sammlung':
                return entry.action === 'delete' ? undefined : `${base}/sammlung`;
            case 'category':
            case 'standort':
                return `${base}/matsettings`;
            default:
                return undefined;
        }
    };

    const renderEntity = (entry: AuditLogEntry) => {
        const link = getEntityLink(entry);
        const label = <span style={{ wordBreak: 'break-word' }}>{entry.entityLabel}</span>;
        if (!link) return label;
        return (
            <Tooltip title={t('audit:openEntity')}>
                <Typography.Link onClick={() => navigate(link)}>{label}</Typography.Link>
            </Tooltip>
        );
    };

    const renderChangesSummary = (entry: AuditLogEntry) => {
        const parts: React.ReactNode[] = [];
        if (entry.detail) {
            parts.push(<div key="detail">{entry.detail}</div>);
        }
        if (entry.changes.length > 0) {
            parts.push(
                <Typography.Text key="fields" type="secondary">
                    {t('audit:changes.count', { count: entry.changes.length })}: {entry.changes.map(c => getAuditFieldLabel(c.field, t)).join(', ')}
                </Typography.Text>,
            );
        }
        return parts.length > 0 ? <>{parts}</> : <Typography.Text type="secondary">–</Typography.Text>;
    };

    const loadMoreButton = entries.length >= pageLimit && (
        <Button onClick={() => setPageLimit(l => l + PAGE_SIZE)} loading={loading}>
            {t('audit:loadMore')}
        </Button>
    );

    const columns: ColumnsType<AuditLogEntry> = [
        {
            title: t('audit:columns.timestamp'),
            key: 'timestamp',
            width: 150,
            render: (_, entry) => formatTimestamp(entry),
        },
        {
            title: t('audit:columns.actor'),
            key: 'actor',
            width: 180,
            render: (_, entry) => resolveActorName(entry),
        },
        {
            title: t('audit:columns.action'),
            key: 'action',
            width: 110,
            render: (_, entry) => <Tag color={getAuditActionColor(entry.action)}>{t(`audit:actions.${entry.action}`)}</Tag>,
        },
        {
            title: t('audit:columns.entityType'),
            key: 'entityType',
            width: 130,
            render: (_, entry) => <Tag>{t(`audit:entityTypes.${entry.entityType}`)}</Tag>,
        },
        {
            title: t('audit:columns.entity'),
            key: 'entity',
            render: (_, entry) => renderEntity(entry),
        },
        {
            title: t('audit:columns.changes'),
            key: 'changes',
            render: (_, entry) => renderChangesSummary(entry),
        },
    ];

    const filters = (
        <Row gutter={[8, 8]}>
            <Col xs={24} md={8}>
                <Input.Search
                    placeholder={t('audit:filters.search')}
                    allowClear
                    onSearch={setSearch}
                    onChange={(e) => { if (!e.target.value) setSearch(''); }}
                />
            </Col>
            <Col xs={12} md={5}>
                <Select
                    allowClear
                    style={{ width: '100%' }}
                    placeholder={t('audit:filters.entityType')}
                    value={entityTypeFilter}
                    onChange={(v) => setEntityTypeFilter(v)}
                    options={availableEntityTypes.map(type => ({ value: type, label: t(`audit:entityTypes.${type}`) }))}
                />
            </Col>
            <Col xs={12} md={4}>
                <Select
                    allowClear
                    style={{ width: '100%' }}
                    placeholder={t('audit:filters.action')}
                    value={actionFilter}
                    onChange={(v) => setActionFilter(v)}
                    options={ACTIONS.map(action => ({ value: action, label: t(`audit:actions.${action}`) }))}
                />
            </Col>
            <Col xs={24} md={7}>
                <Select
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    style={{ width: '100%' }}
                    placeholder={t('audit:filters.actor')}
                    value={actorFilter}
                    onChange={(v) => setActorFilter(v)}
                    options={actorOptions}
                />
            </Col>
        </Row>
    );

    return (
        <Row gutter={[16, 16]}>
            <Col span={24}>
                <Typography.Title level={4} style={{ marginBottom: 4 }}>{t('audit:title')}</Typography.Title>
                <Typography.Text type="secondary">{t('audit:description', { days: AUDIT_RETENTION_DAYS })}</Typography.Text>
            </Col>
            {!canReadAll && (
                <Col span={24}>
                    <Alert type="info" showIcon message={t('audit:matchefHint')} />
                </Col>
            )}
            <Col span={24}>{filters}</Col>
            <Col span={24}>
                {isMobile ? (
                    <List
                        loading={loading}
                        dataSource={filtered}
                        locale={{ emptyText: <Empty description={t('audit:empty')} /> }}
                        renderItem={(entry) => (
                            <List.Item style={{ display: 'block', padding: '12px 0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                                    <Typography.Text type="secondary">{formatTimestamp(entry)}</Typography.Text>
                                    <Space size={4}>
                                        <Tag color={getAuditActionColor(entry.action)}>{t(`audit:actions.${entry.action}`)}</Tag>
                                        <Tag>{t(`audit:entityTypes.${entry.entityType}`)}</Tag>
                                    </Space>
                                </div>
                                <div><strong>{resolveActorName(entry)}</strong> · {renderEntity(entry)}</div>
                                <div style={{ marginTop: 4 }}>{renderChangesSummary(entry)}</div>
                                {entry.changes.length > 0 && (
                                    <div style={{ marginTop: 8 }}>
                                        <ChangesTable changes={entry.changes} />
                                    </div>
                                )}
                            </List.Item>
                        )}
                    />
                ) : (
                    <Table<AuditLogEntry>
                        rowKey="id"
                        loading={loading}
                        dataSource={filtered}
                        columns={columns}
                        pagination={{ pageSize: 25, showSizeChanger: true, pageSizeOptions: [25, 50, 100] }}
                        locale={{ emptyText: <Empty description={t('audit:empty')} /> }}
                        expandable={{
                            rowExpandable: (entry) => entry.changes.length > 0,
                            expandedRowRender: (entry) => <ChangesTable changes={entry.changes} />,
                        }}
                    />
                )}
            </Col>
            <Col span={24} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <Typography.Text type="secondary">{t('audit:showingEntries', { count: entries.length })}</Typography.Text>
                {loadMoreButton}
            </Col>
        </Row>
    );
};
