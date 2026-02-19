import { Button, Col, Input, message, Row, Statistic, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import appStyles from 'styles.module.scss';
import { UserTable } from 'components/users/UserTable';
import { db, functions } from 'config/firebase/firebase';
import { collection, doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { usersCollection } from 'config/firebase/collections';
import { UserData } from 'types/user.type';
import { useAuth0 } from '@auth0/auth0-react';
import { SyncOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from 'hooks/useIsMobile';


export interface AbteilungDetailProps {
}

export type AbteilungDetailViewParams = {
    abteilungId: string;
};


export const UsersView = () => {

    const { isAuthenticated } = useAuth0();
    const { t } = useTranslation();
    const isMobile = useIsMobile();

    const { Search } = Input;

    const [usersLoading, setUsersLoading] = useState(false);
    const [syncLoading, setSyncLoading] = useState(false);

    const [users, setUsers] = useState<UserData[]>([]);
    const [query, setQuery] = useState<string | undefined>(undefined);

    const syncAllDisplayNames = async () => {
        try {
            setSyncLoading(true);
            const result = await httpsCallable<object, { updated: number; skipped: number; errors: string[] }>(functions, 'syncDisplayNames')({});
            const { updated, skipped, errors } = result.data;
            if (errors && errors.length > 0) {
                message.warning(`${t('navigation:users.syncDisplayNames.warning')}: ${errors.join(', ')}`);
            } else {
                message.success(t('navigation:users.syncDisplayNames.success', { updated, skipped }));
            }
        } catch (ex: any) {
            if (ex?.code === 'functions/permission-denied') {
                message.error(t('navigation:users.syncDisplayNames.permissionError'));
            } else {
                message.error(t('navigation:users.syncDisplayNames.error'));
            }
        } finally {
            setSyncLoading(false);
        }
    };

    //fetch users
    useEffect(() => {

        if(!isAuthenticated) return;
        setUsersLoading(true);
        return onSnapshot(collection(db, usersCollection), (snap) => {
            setUsersLoading(false);
            const usersLoaded = snap.docs.flatMap(d => {
                return {
                    ...d.data(),
                    __caslSubjectType__: 'UserData',
                    id: d.id
                } as UserData;
            });
            setUsers(usersLoaded);
        }, (err) => {
            if ((err as any).code === 'permission-denied') return;
            message.error(`Es ist ein Fehler aufgetreten ${err}`)
            console.error('Es ist ein Fehler aufgetreten', err)
        });
    }, [isAuthenticated]);

    return <div className={classNames(appStyles['flex-grower'])}>
        <Typography.Title level={isMobile ? 4 : 3}>Benutzer</Typography.Title>

        <div className={classNames(appStyles['flex-grower'])}>
            <Row gutter={[16, 12]} align='middle' style={{ marginBottom: 12 }}>
                <Col>
                    <Statistic title='Benutzer' value={users.length} />
                </Col>
                <Col>
                    <Statistic title='Staff' value={users.filter(u => u.staff).length} />
                </Col>
                <Col>
                    <Button
                        icon={<SyncOutlined />}
                        loading={syncLoading}
                        size={isMobile ? 'small' : 'middle'}
                        onClick={syncAllDisplayNames}
                    >
                        {t('navigation:users.syncDisplayNames.button')}
                    </Button>
                </Col>
            </Row>

            <Search
                placeholder='nach Benutzern suchen'
                allowClear
                enterButton='Suchen'
                size={isMobile ? 'middle' : 'large'}
                style={{ marginBottom: 12 }}
                onSearch={(query: string) => setQuery(query)}
            />
            <UserTable loading={usersLoading} users={query ? users.filter(user => user.displayName.toLowerCase().includes(query.toLowerCase()) || user.email.toLowerCase().includes(query.toLowerCase())) : users} makeStaff={promoteDemoteStaff} />
        </div>
    </div>

}

export const promoteDemoteStaff = async (userId: string) => {
    const userDocSnap = await getDoc(doc(db, usersCollection, userId));
    const userData = userDocSnap.data() as UserData;

    const isStaff = userData.staff ? userData.staff : false

    try {
        await updateDoc(doc(db, usersCollection, userId), {
            staff: !isStaff
        })
    } catch (ex) {
        message.error(`Es ist ein Fehler aufgetreten ${ex}`)
    }
}