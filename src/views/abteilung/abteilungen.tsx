import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import appStyles from 'styles.module.scss';
import { Col, message, PageHeader, Row, Spin } from 'antd';
import { useAuth0 } from '@auth0/auth0-react';
import styles from './abteilungen.module.scss';
import { firestore } from 'config/firebase/firebase';
import { abteilungenCollection } from 'config/firebase/collections';
import { Abteilung } from 'types/abteilung.type';
import { AbteilungCard } from 'components/abteilung/AbteilungCard';
import { AddAbteilung } from 'components/abteilung/AddAbteilung';
import { Switch, Route, useRouteMatch } from 'react-router';
import { AbteilungMaterialView } from 'views/abteilung/material/abteilungMaterials';
import { AbteilungDetail } from 'components/abteilung/AbteilungDetails';
import { Can } from 'config/casl/casl';

export const AbteilungenView = () => {
    const { isAuthenticated } = useAuth0();

    const { path } = useRouteMatch();

    const [loading, setLoading] = useState(false);

    const [abteilungen, setAbteilungen] = useState<Abteilung[]>([]);

    useEffect(() => {
        setLoading(true);
        return firestore().collection(abteilungenCollection).onSnapshot(snap => {
            setLoading(false);
            const abteilungenLoaded = snap.docs.flatMap(doc => {
                return {
                    ...doc.data(),
                    __caslSubjectType__: 'Abteilung',
                    id: doc.id
                } as Abteilung;
            });
            setAbteilungen(abteilungenLoaded);
        }, (err) => {
            message.error(`Es ist ein Fehler aufgetreten ${err}`)
        });
    }, [isAuthenticated]);


    return <div className={classNames(appStyles['flex-grower'])}>

        <Switch>
            {/* <Route path={`${path}/new`} component={CreateClothingShop} /> */}
            <Route path={`${path}/:abteilungId/mat`} component={AbteilungMaterialView} />
            <Route path={`${path}/:abteilungSlugOrId`} component={AbteilungDetail} />
            <Route exact path={path}>

                <PageHeader title='Abteilungen'></PageHeader>

                <div className={classNames(appStyles['flex-grower'])} style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'stretch' }}>
                    <Row gutter={[16, 16]} className={classNames(styles['row'])}>
                        
                        <Can I='create' a='Abteilung'>
                            <Col key='addAbteilung' xs={24} md={24} lg={24} xxl={24}>
                                <AddAbteilung />
                            </Col>
                        </Can>
                        
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
            </Route>
        </Switch>
    </div>
}
