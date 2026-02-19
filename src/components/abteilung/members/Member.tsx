import { Button, Col, Input, message, Row } from "antd";
import { useContext, useEffect, useState } from "react";
import { AbteilungMemberUserData } from "types/abteilung.type";
import { MembersContext, MembersUserDataContext } from "../AbteilungDetails";
import { MemberTable } from "./MemberTable";
import { useTranslation } from 'react-i18next';
import { useUser } from 'hooks/use-user';
import { functions } from 'config/firebase/firebase';
import { httpsCallable } from 'firebase/functions';
import { SyncOutlined } from '@ant-design/icons';

export interface MemberProps {
    abteilungId: string
}

export const Member = (props: MemberProps) => {
    const { abteilungId } = props;
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
        <Col span={24}>
            <Input.Search
                placeholder={t('member:search.placeholder')}
                allowClear
                enterButton={t('common:buttons.search')}
                size='large'
                onSearch={(query) => setQuery(query)}
            />
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
        <Col span={24}>
            <MemberTable loading={userDataLoading || membersLoading} abteilungId={abteilungId} members={query ? memberMerged.filter(item => item.name.toLowerCase().includes(query.toLowerCase()) || item.email.toLowerCase().includes(query.toLowerCase())) : memberMerged} />
        </Col>
    </Row>
}