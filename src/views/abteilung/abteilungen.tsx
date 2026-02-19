import { useContext, useMemo, useState } from 'react';
import classNames from 'classnames';
import appStyles from 'styles.module.scss';
import { Col, Image, Input, List, Row, Spin, Tag, Typography } from 'antd';
import { RightOutlined, SearchOutlined } from '@ant-design/icons';
import styles from './abteilungen.module.scss';
import { AbteilungCard } from 'components/abteilung/AbteilungCard';
import { AddAbteilung } from 'components/abteilung/AddAbteilung';
import { Can } from 'config/casl/casl';
import { AbteilungenContext } from 'components/navigation/NavigationMenu';
import { useIsMobile } from 'hooks/useIsMobile';
import { useNavigate } from 'react-router';
import { useUser } from 'hooks/use-user';
import { ability } from 'config/casl/ability';
import { JoinAbteilungButton } from 'components/abteilung/join/JoinAbteilung';
import { useTranslation } from 'react-i18next';
import ceviLogoImage from 'assets/onlinemat_logo.png';



export const AbteilungenView = () => {

    const abteilungenContext = useContext(AbteilungenContext);

    const abteilungen = abteilungenContext.abteilungen;
    const loading = abteilungenContext.loading;

    const [search, setSearch] = useState('');
    const isMobile = useIsMobile();
    const navigate = useNavigate();
    const user = useUser();
    const { t } = useTranslation();

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
            style={{ marginBottom: 16, maxWidth: isMobile ? undefined : 400 }}
        />

        <Can I='create' a='Abteilung'>
            <div style={{ marginBottom: 16 }}>
                <AddAbteilung />
            </div>
        </Can>

        {isMobile ? (
            <List
                loading={loading}
                dataSource={filteredAbteilungen}
                renderItem={(ab) => {
                    const canRead = ability.can('read', ab);
                    const userRole = user.appUser?.userData?.['roles'] ? user.appUser?.userData?.roles[ab.id] : '';

                    return (
                        <List.Item
                            style={{ padding: '12px 0', cursor: canRead ? 'pointer' : undefined }}
                            onClick={canRead ? () => navigate(`/abteilungen/${ab.slug || ab.id}`) : undefined}
                            actions={canRead ? [
                                <RightOutlined key="go" style={{ color: '#999' }} />,
                            ] : [
                                userRole !== 'pending'
                                    ? <JoinAbteilungButton key="join" abteilungId={ab.id} abteilungName={ab.name} />
                                    : <Tag key="pending" color='geekblue'>{t('abteilung:join.pending', 'Angefragt')}</Tag>
                            ]}
                        >
                            <List.Item.Meta
                                avatar={
                                    <Image
                                        src={ab.logoUrl || ceviLogoImage}
                                        width={48}
                                        height={48}
                                        preview={false}
                                        style={{ objectFit: 'contain', borderRadius: 4 }}
                                    />
                                }
                                title={ab.name}
                            />
                        </List.Item>
                    );
                }}
            />
        ) : (
            <div className={classNames(appStyles['flex-grower'])} style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'stretch' }}>
                <Row gutter={[16, 16]} className={classNames(styles['row'])}>
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
        )}
    </div>
}
