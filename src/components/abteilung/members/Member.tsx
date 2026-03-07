import { Button, Col, Input, message, Row, Typography } from "antd";
import { useContext, useEffect, useState } from "react";
import { Abteilung, AbteilungMemberUserData } from "types/abteilung.type";
import { MembersContext, MembersUserDataContext, InvitationsContext } from "../AbteilungDetails";
import { MemberTable } from "./MemberTable";
import { InviteMembersButton } from "./InviteMembers";
import { PendingInvitationsTable } from "./PendingInvitationsTable";
import { useTranslation } from 'react-i18next';
import { useUser } from 'hooks/use-user';
import { functions } from 'config/firebase/firebase';
import { httpsCallable } from 'firebase/functions';
import { SyncOutlined } from '@ant-design/icons';

export interface MemberProps {
    abteilung: Abteilung
}

export const Member = (props: MemberProps) => {
    const { abteilung } = props;
    const abteilungId = abteilung.id;
    const { t } = useTranslation();
    const user = useUser();

    //fetch members
    const membersContext = useContext(MembersContext);

    const members = membersContext.members;
    const membersLoading = membersContext.loading;

    //fetch userData
    const membersUserDataContext = useContext(MembersUserDataContext);

    const userData = membersUserDataContext.userData;
    const userDataLoading = membersUserDataContext.loading;

    //fetch invitations
    const { invitations, loading: invitationsLoading } = useContext(InvitationsContext);

    const [memberMerged, setMemberMerged] = useState<AbteilungMemberUserData[]>([]);

    const [query, setQuery] = useState<string | undefined>(undefined);
    const [syncLoading, setSyncLoading] = useState(false);

    const isStaff = user.appUser?.userData?.staff === true;

    useEffect(()=> {
        setMemberMerged(members.map(member => ({ ...member, ...(userData[member.userId] || { displayName: 'Loading...' }) })))
    }, [userData, members, membersLoading, userDataLoading])

    const syncDisplayNames = async () => {
        try {
            setSyncLoading(true);
            const result = await httpsCallable<object, { updated: number; skipped: number; errors: string[] }>(functions, 'syncDisplayNames')({ abteilungId });
            const { updated, skipped, errors } = result.data;
            if (errors && errors.length > 0) {
                message.warning(`${t('member:syncDisplayNames.warning')}: ${errors.join(', ')}`);
            } else {
                message.success(t('member:syncDisplayNames.success', { updated, skipped }));
            }
        } catch (ex: any) {
            if (ex?.code === 'functions/permission-denied') {
                message.error(t('member:syncDisplayNames.permissionError'));
            } else {
                message.error(t('member:syncDisplayNames.error'));
            }
        } finally {
            setSyncLoading(false);
        }
    };

    return <Row gutter={[16, 16]}>
        <Col span={24} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Input.Search
                placeholder={t('member:search.placeholder')}
                allowClear
                enterButton={t('common:buttons.search')}
                size='large'
                onSearch={(query) => setQuery(query)}
                style={{ flex: 1, minWidth: 200 }}
            />
            <InviteMembersButton abteilung={abteilung} />
        </Col>
        {isStaff && (
            <Col span={24}>
                <Button
                    icon={<SyncOutlined />}
                    loading={syncLoading}
                    onClick={syncDisplayNames}
                >
                    {t('member:syncDisplayNames.button')}
                </Button>
            </Col>
        )}
        {invitations.length > 0 && (
            <Col span={24}>
                <Typography.Title level={5}>{t('member:invite.pendingTitle')}</Typography.Title>
                <PendingInvitationsTable
                    abteilungId={abteilungId}
                    invitations={invitations}
                    loading={invitationsLoading}
                    groups={abteilung.groups}
                />
            </Col>
        )}
        <Col span={24}>
            <MemberTable loading={userDataLoading || membersLoading} abteilungId={abteilungId} members={query ? memberMerged.filter(item => item.name.toLowerCase().includes(query.toLowerCase()) || item.email.toLowerCase().includes(query.toLowerCase())) : memberMerged} />
        </Col>
    </Row>
}
