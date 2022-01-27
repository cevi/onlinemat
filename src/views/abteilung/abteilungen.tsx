import { useContext } from 'react';
import classNames from 'classnames';
import appStyles from 'styles.module.scss';
import { Col, PageHeader, Row, Spin } from 'antd';
import styles from './abteilungen.module.scss';
import { AbteilungCard } from 'components/abteilung/AbteilungCard';
import { AddAbteilung } from 'components/abteilung/AddAbteilung';
import { Can } from 'config/casl/casl';
import { AbteilungenContext } from 'components/navigation/NavigationMenu';



export const AbteilungenView = () => {

    const abteilungenContext = useContext(AbteilungenContext);

    const abteilungen = abteilungenContext.abteilungen;
    const loading = abteilungenContext.loading;


    return <div className={classNames(appStyles['flex-grower'])}>

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
    </div>
}
