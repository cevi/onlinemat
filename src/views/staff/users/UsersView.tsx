import { Col, Input, message, PageHeader, Row, Statistic } from 'antd';
import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import appStyles from 'styles.module.scss';
import { UserTable } from 'components/users/UserTable';
import { firestore } from 'config/firebase/firebase';
import { usersCollection } from 'config/firebase/collections';
import { UserData } from 'types/user.type';
import { useAuth0 } from '@auth0/auth0-react';


export interface AbteilungDetailProps {
}

export type AbteilungDetailViewParams = {
    abteilungId: string;
};


export const UsersView = () => {

    const { isAuthenticated } = useAuth0();

    const { Search } = Input;

    const [usersLoading, setUsersLoading] = useState(false);

    const [users, setUsers] = useState<UserData[]>([]);
    const [query, setQuery] = useState<string | undefined>(undefined);

    //fetch users
    useEffect(() => {

        if(!isAuthenticated) return;
        setUsersLoading(true);
        return firestore().collection(usersCollection).onSnapshot(snap => {
            setUsersLoading(false);
            const usersLoaded = snap.docs.flatMap(doc => {
                return {
                    ...doc.data(),
                    __caslSubjectType__: 'UserData',
                    id: doc.id
                } as UserData;
            });
            setUsers(usersLoaded);
        }, (err) => {
            message.error(`Es ist ein Fehler aufgetreten ${err}`)
            console.error('Es ist ein Fehler aufgetreten', err)
        });
    }, [isAuthenticated]);

    return <div className={classNames(appStyles['flex-grower'])}>
        <PageHeader title={`Benutzer`}></PageHeader>

        <div className={classNames(appStyles['flex-grower'])}>
            <Row>
                <Col span={12}>
                    <Statistic title='Benutzer' value={users.length} />
                </Col>
            </Row>

            <Search
                placeholder='nach Benutzern suchen'
                allowClear
                enterButton='Suchen'
                size='large'
                onSearch={(query: string) => setQuery(query)}
            />
            <UserTable loading={usersLoading} users={query ? users.filter(user => user.displayName.toLowerCase().includes(query.toLowerCase()) || user.email.toLowerCase().includes(query.toLowerCase())) : users} makeStaff={promoteDemoteStaff} />
        </div>
    </div>

}

export const promoteDemoteStaff = async (userId: string) => {
    const userDoc = await firestore().collection(usersCollection).doc(userId).get();
    const userData = userDoc.data() as UserData;

    const isStaff = userData.staff ? userData.staff : false

    try {
        await firestore().collection(usersCollection).doc(userId).update({
            staff: !isStaff
        })
    } catch (ex) {
        message.error(`Es ist ein Fehler aufgetreten ${ex}`)
    }
}