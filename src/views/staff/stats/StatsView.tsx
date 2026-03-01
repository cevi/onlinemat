import React, { useEffect, useState } from 'react';
import { Button, Card, Col, Empty, message, Row, Spin, Statistic, Table, Tag, Typography } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { doc, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useTranslation } from 'react-i18next';
import { useAuth0 } from '@auth0/auth0-react';
import dayjs from 'dayjs';
import classNames from 'classnames';

import { db, functions } from 'config/firebase/firebase';
import { statsCollection } from 'config/firebase/collections';
import { StatsData, AbteilungStat, ActiveUserStat, ReleaseNoteStat } from 'types/stats.types';
import { useIsMobile } from 'hooks/useIsMobile';
import appStyles from 'styles.module.scss';

export const StatsView: React.FC = () => {
    const { t } = useTranslation();
    const { isAuthenticated } = useAuth0();
    const isMobile = useIsMobile();

    const [stats, setStats] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) return;
        setLoading(true);
        return onSnapshot(
            doc(db, statsCollection, 'latest'),
            (snap) => {
                setLoading(false);
                if (snap.exists()) {
                    setStats(snap.data() as StatsData);
                } else {
                    setStats(null);
                }
            },
            (err) => {
                setLoading(false);
                if ((err as any).code === 'permission-denied') return;
                message.error(`Error loading stats: ${err}`);
            }
        );
    }, [isAuthenticated]);

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await httpsCallable(functions, 'refreshStats')({});
            message.success(t('stats:refreshSuccess'));
        } catch {
            message.error(t('stats:refreshError'));
        } finally {
            setRefreshing(false);
        }
    };

    if (loading) {
        return (
            <div className={classNames(appStyles['flex-grower'])}>
                <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
                    <Spin size="large" />
                </div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className={classNames(appStyles['flex-grower'])}>
                <Typography.Title level={isMobile ? 4 : 3}>{t('stats:title')}</Typography.Title>
                <Empty description={t('stats:noData')}>
                    <Button type="primary" onClick={handleRefresh} loading={refreshing} icon={<ReloadOutlined />}>
                        {t('stats:refresh')}
                    </Button>
                </Empty>
            </div>
        );
    }

    const generatedAtStr = stats.generatedAt?.toDate
        ? dayjs(stats.generatedAt.toDate()).format('DD.MM.YYYY HH:mm')
        : '';

    const abteilungenColumns = [
        {
            title: t('stats:abteilungenTable.name'),
            dataIndex: 'name',
            key: 'name',
            sorter: (a: AbteilungStat, b: AbteilungStat) => a.name.localeCompare(b.name),
        },
        {
            title: t('stats:abteilungenTable.members'),
            dataIndex: 'memberCount',
            key: 'memberCount',
            sorter: (a: AbteilungStat, b: AbteilungStat) => a.memberCount - b.memberCount,
        },
        {
            title: t('stats:abteilungenTable.orders'),
            dataIndex: 'orderCount',
            key: 'orderCount',
            sorter: (a: AbteilungStat, b: AbteilungStat) => a.orderCount - b.orderCount,
            defaultSortOrder: 'descend' as const,
        },
        {
            title: t('stats:abteilungenTable.roleBreakdown'),
            key: 'roles',
            responsive: ['md' as const],
            render: (_: unknown, record: AbteilungStat) => (
                <>
                    {Object.entries(record.membersByRole)
                        .filter(([, v]) => v > 0)
                        .map(([role, count]) => (
                            <Tag key={role}>{role}: {count}</Tag>
                        ))}
                </>
            ),
        },
        {
            title: t('stats:abteilungenTable.lastOrder'),
            key: 'lastOrder',
            render: (_: unknown, record: AbteilungStat) =>
                record.lastOrderDate?.toDate
                    ? dayjs(record.lastOrderDate.toDate()).format('DD.MM.YYYY')
                    : '-',
            sorter: (a: AbteilungStat, b: AbteilungStat) => {
                const aTime = a.lastOrderDate?.toMillis?.() || 0;
                const bTime = b.lastOrderDate?.toMillis?.() || 0;
                return aTime - bTime;
            },
        },
    ];

    const releaseNotesColumns = [
        {
            title: t('stats:releaseNotesTable.noteTitle'),
            dataIndex: 'title',
            key: 'title',
        },
        {
            title: t('stats:releaseNotesTable.createdAt'),
            key: 'createdAt',
            render: (_: unknown, record: ReleaseNoteStat) =>
                record.createdAt?.toDate
                    ? dayjs(record.createdAt.toDate()).format('DD.MM.YYYY')
                    : '-',
            sorter: (a: ReleaseNoteStat, b: ReleaseNoteStat) => {
                const aTime = a.createdAt?.toMillis?.() || 0;
                const bTime = b.createdAt?.toMillis?.() || 0;
                return aTime - bTime;
            },
            defaultSortOrder: 'descend' as const,
        },
        {
            title: t('stats:releaseNotesTable.readCount'),
            key: 'readCount',
            render: (_: unknown, record: ReleaseNoteStat) =>
                `${record.readCount} / ${stats.totalUsers}`,
            sorter: (a: ReleaseNoteStat, b: ReleaseNoteStat) => a.readCount - b.readCount,
        },
    ];

    const usersColumns = [
        {
            title: t('stats:usersTable.name'),
            dataIndex: 'displayName',
            key: 'displayName',
        },
        {
            title: t('stats:usersTable.email'),
            dataIndex: 'email',
            key: 'email',
            responsive: ['md' as const],
        },
        {
            title: t('stats:usersTable.orders'),
            dataIndex: 'orderCount',
            key: 'orderCount',
            sorter: (a: ActiveUserStat, b: ActiveUserStat) => a.orderCount - b.orderCount,
            defaultSortOrder: 'descend' as const,
        },
        {
            title: t('stats:usersTable.lastLogin'),
            key: 'lastLogin',
            responsive: ['md' as const],
            render: (_: unknown, record: ActiveUserStat) =>
                record.lastLogin?.toDate
                    ? dayjs(record.lastLogin.toDate()).format('DD.MM.YYYY HH:mm')
                    : '-',
        },
        {
            title: t('stats:usersTable.abteilungen'),
            dataIndex: 'abteilungCount',
            key: 'abteilungCount',
        },
    ];

    return (
        <div className={classNames(appStyles['flex-grower'])} style={{marginTop: '10px', marginBottom: '10px'   }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                <Typography.Title level={isMobile ? 4 : 3} style={{ margin: 0 }}>{t('stats:title')}</Typography.Title>
                <Button icon={<ReloadOutlined />} loading={refreshing} onClick={handleRefresh}>
                    {t('stats:refresh')}
                </Button>
            </div>
            <Typography.Text type="secondary">{t('stats:generatedAt', { date: generatedAtStr })}</Typography.Text>

            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                <Col xs={24} sm={8}>
                    <Card><Statistic title={t('stats:cards.totalUsers')} value={stats.totalUsers} /></Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card><Statistic title={t('stats:cards.totalAbteilungen')} value={stats.totalAbteilungen} /></Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card><Statistic title={t('stats:cards.totalOrders')} value={stats.totalOrders} /></Card>
                </Col>
            </Row>

            <Card title={t('stats:chart.ordersOverTime')} style={{ marginTop: 16 }}>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={stats.ordersOverTime}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Line type="monotone" dataKey="count" name={t('stats:chart.orders')} stroke="#1890ff" />
                    </LineChart>
                </ResponsiveContainer>
            </Card>

            {stats.usersPerDay && stats.usersPerDay.length > 0 && (
                <Card title={t('stats:chart.usersPerDay')} style={{ marginTop: 16 }}>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={stats.usersPerDay}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(d: string) => {
                                    const parts = d.split('-');
                                    return parts.length === 3 ? `${parts[2]}.${parts[1]}.` : d;
                                }}
                                interval={isMobile ? 6 : 2}
                            />
                            <YAxis allowDecimals={false} />
                            <Tooltip
                                labelFormatter={(label) => {
                                    const str = String(label);
                                    const parts = str.split('-');
                                    return parts.length === 3 ? `${parts[2]}.${parts[1]}.${parts[0]}` : str;
                                }}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="newUsers" name={t('stats:chart.newUsers')} stroke="#52c41a" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="activeUsers" name={t('stats:chart.activeUsersLine')} stroke="#1890ff" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </Card>
            )}

            <Card title={t('stats:abteilungenTable.title')} style={{ marginTop: 16 }}>
                <Table
                    dataSource={stats.abteilungen}
                    columns={abteilungenColumns}
                    rowKey="id"
                    pagination={false}
                    scroll={{ x: true }}
                    size={isMobile ? 'small' : 'middle'}
                />
            </Card>

            <Card title={t('stats:usersTable.title')} style={{ marginTop: 16 }}>
                <Table
                    dataSource={stats.activeUsers}
                    columns={usersColumns}
                    rowKey="id"
                    pagination={{ pageSize: 20 }}
                    scroll={{ x: true }}
                    size={isMobile ? 'small' : 'middle'}
                />
            </Card>

            <Card title={t('stats:releaseNotesTable.title')} style={{ marginTop: 16 }}>
                <Table
                    dataSource={stats.releaseNoteStats}
                    columns={releaseNotesColumns}
                    rowKey="id"
                    pagination={false}
                    scroll={{ x: true }}
                    size={isMobile ? 'small' : 'middle'}
                />
            </Card>
        </div>
    );
};
