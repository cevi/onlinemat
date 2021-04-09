import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import appStyles from 'styles.module.scss';
import { Col, PageHeader, Row, Spin } from 'antd';
import { useAuth0 } from '@auth0/auth0-react';
import styles from './abteilungen.module.scss';
import { firestore } from 'config/firebase/firebase';
import { abteilungenCollection } from 'config/firebase/collections';
import { Abteilung } from 'types/abteilung.type';
import { AbteilungCard } from 'components/abteilung/AbteilungCard';
import { AddAbteilung } from 'components/abteilung/AddAbteilung';

export const AbteilungenView = () => {
    const { user, isAuthenticated } = useAuth0();

    const [loading, setLoading] = useState(false);

    const [abteilungen, setAbteilungen] = useState<Abteilung[]>([]);

    useEffect(() => {
        setLoading(true);
        return firestore().collection(abteilungenCollection).onSnapshot(snap => {
            setLoading(false);
            const abteilungenLoaded = snap.docs.flatMap(doc => {
                return {
                    ...doc.data() as Abteilung,
                    id: doc.id
                } as any;
            });
            setAbteilungen(abteilungenLoaded);
        });
    }, [isAuthenticated]);


    return <div className={classNames(appStyles['flex-grower'])}>
        <PageHeader title='Abteilungen'></PageHeader>



        <div className={classNames(appStyles['flex-grower'])} style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'stretch' }}>
            <Row gutter={[16, 16]} className={classNames(styles['row'])}>
                <Col key='add' xs={24} md={12} lg={8} xxl={6}>
                    <AddAbteilung/>
                </Col>
                {
                    loading ?
                        <Spin />
                        :
                        abteilungen.sort((a, b) => a.name.normalize().localeCompare(b.name.normalize())).map(ab => {
                            return <Col key={ab.id} xs={24} md={12} lg={8} xxl={6}>
                                <AbteilungCard abteilung={ab} />
                            </Col>
                        })
                }
            </Row>
        </div>
    </div>
}
