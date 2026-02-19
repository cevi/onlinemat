import { useContext, useMemo, useState } from 'react';
import classNames from 'classnames';
import appStyles from 'styles.module.scss';
import { Col, Input, Row, Spin, Typography } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import styles from './abteilungen.module.scss';
import { AbteilungCard } from 'components/abteilung/AbteilungCard';
import { AddAbteilung } from 'components/abteilung/AddAbteilung';
import { Can } from 'config/casl/casl';
import { AbteilungenContext } from 'components/navigation/NavigationMenu';



export const AbteilungenView = () => {

    const abteilungenContext = useContext(AbteilungenContext);

    const abteilungen = abteilungenContext.abteilungen;
    const loading = abteilungenContext.loading;

    const [search, setSearch] = useState('');

    const filteredAbteilungen = useMemo(() => {
        const sorted = [...abteilungen].sort((a, b) => a.name.normalize().localeCompare(b.name.normalize()));
        if (!search.trim()) return sorted;
        const term = search.trim().toLowerCase();
        return sorted.filter(ab => ab.name.toLowerCase().includes(term));
    }, [abteilungen, search]);


    return <div className={classNames(appStyles['flex-grower'])}>

        <Typography.Title level={3}>Abteilungen</Typography.Title>

        <Input
            placeholder='Abteilung suchen...'
            prefix={<SearchOutlined />}
            allowClear
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ marginBottom: 16, maxWidth: 400 }}
        />

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
                        filteredAbteilungen.map(ab => {
                            return <Col key={ab.id} xs={24} md={12} lg={8} xxl={6}>
                                <AbteilungCard abteilung={ab} />
                            </Col>
                        })
                }
            </Row>
        </div>
    </div>
}
