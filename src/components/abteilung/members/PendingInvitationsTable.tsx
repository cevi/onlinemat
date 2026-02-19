import { useState } from 'react';
import { Table, Button, Tag, List, message } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { httpsCallable } from 'firebase/functions';
import { functions } from 'config/firebase/firebase';
import { Invitation } from 'types/invitation.types';
import { Abteilung } from 'types/abteilung.type';
import { getRoles } from './MemberTable';
import { useTranslation } from 'react-i18next';
import { Timestamp } from 'firebase/firestore';
import { useIsMobile } from 'hooks/useIsMobile';

export interface PendingInvitationsTableProps {
    abteilungId: string;
    invitations: Invitation[];
    loading: boolean;
    groups: Abteilung['groups'];
}

export const PendingInvitationsTable = (props: PendingInvitationsTableProps) => {
    const { abteilungId, invitations, loading, groups } = props;
    const { t } = useTranslation();
    const isMobile = useIsMobile();
    const roles = getRoles(t);
    const [revokingIds, setRevokingIds] = useState<Set<string>>(new Set());

    const handleRevoke = async (invitationId: string) => {
        setRevokingIds(prev => new Set(prev).add(invitationId));
        try {
            await httpsCallable(functions, 'revokeInvitation')({
                abteilungId,
                invitationId,
            });
            message.success(t('member:invite.revoked'));
        } catch {
            message.error(t('member:invite.revokeError'));
        } finally {
            setRevokingIds(prev => {
                const next = new Set(prev);
                next.delete(invitationId);
                return next;
            });
        }
    };

    const getGroupNames = (groupIds: string[]): string => {
        if (!groupIds || groupIds.length === 0 || !groups) return '-';
        return groupIds
            .map(id => groups[id]?.name)
            .filter(Boolean)
            .join(', ') || '-';
    };

    const formatDate = (date: any): string => {
        if (!date) return '-';
        // Firestore Timestamps need conversion
        const d = date instanceof Timestamp ? date.toDate() : new Date(date);
        return d.toLocaleDateString();
    };

    if (isMobile) {
        return (
            <List
                loading={loading}
                dataSource={invitations}
                renderItem={(inv) => (
                    <List.Item style={{ padding: '12px 0', display: 'block' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <span style={{ fontWeight: 500, flex: 1 }}>{inv.email}</span>
                            <Tag>{roles.find(r => r.key === inv.role)?.name || inv.role}</Tag>
                        </div>
                        {inv.groupIds?.length > 0 && (
                            <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
                                {getGroupNames(inv.groupIds)}
                            </div>
                        )}
                        <Button
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            loading={revokingIds.has(inv.id)}
                            onClick={() => handleRevoke(inv.id)}
                        >
                            {t('member:invite.revoke')}
                        </Button>
                    </List.Item>
                )}
            />
        );
    }

    const columns = [
        {
            title: t('member:invite.table.email'),
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: t('member:invite.table.role'),
            dataIndex: 'role',
            key: 'role',
            render: (role: string) => (
                <Tag>{roles.find(r => r.key === role)?.name || role}</Tag>
            ),
        },
        {
            title: t('member:invite.table.groups'),
            dataIndex: 'groupIds',
            key: 'groupIds',
            render: (groupIds: string[]) => getGroupNames(groupIds),
        },
        {
            title: t('member:invite.table.invitedAt'),
            dataIndex: 'invitedAt',
            key: 'invitedAt',
            render: (date: any) => formatDate(date),
        },
        {
            title: t('member:invite.table.actions'),
            key: 'actions',
            render: (_: any, record: Invitation) => (
                <Button
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    loading={revokingIds.has(record.id)}
                    onClick={() => handleRevoke(record.id)}
                >
                    {t('member:invite.revoke')}
                </Button>
            ),
        },
    ];

    return (
        <Table
            rowKey="id"
            loading={loading}
            columns={columns}
            dataSource={invitations}
            pagination={false}
            size="small"
        />
    );
};
