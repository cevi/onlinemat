import classNames from 'classnames';
import appStyles from 'styles.module.scss';
import { Button, Card, Col, Result, Row, Typography } from 'antd';
import { AppstoreOutlined, CalendarOutlined, LoginOutlined, SearchOutlined } from '@ant-design/icons';
import { useAuth0 } from '@auth0/auth0-react';
import ceviLogoImage from 'assets/onlinemat_logo.png';
import { useTranslation } from 'react-i18next';

const features = [
    { key: 'browse', icon: <AppstoreOutlined style={{fontSize: 36, color: '#1890ff'}} /> },
    { key: 'reserve', icon: <CalendarOutlined style={{fontSize: 36, color: '#52c41a'}} /> },
    { key: 'search', icon: <SearchOutlined style={{fontSize: 36, color: '#faad14'}} /> },
] as const;

export const HomeView = () => {
    const { t } = useTranslation('navigation');
    const { user, isAuthenticated, loginWithRedirect  } = useAuth0();

    const backgroundStyle = isAuthenticated ? {backgroundImage:`url(${ceviLogoImage})`,backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundSize: '20%', backgroundPositionY: '25%'} : {};

    return <div className={classNames(appStyles['flex-grower'], appStyles['center-container-stretch'])} style={backgroundStyle}>
        {isAuthenticated && <Typography.Title level={3}>{t('navigation:home.title')}</Typography.Title>}

        {
            !isAuthenticated && <div className={classNames(appStyles['flex-grower'], appStyles['center-container'])}>
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 800, padding: '0 16px', textAlign: 'center'}}>
                    <img src={ceviLogoImage} alt="Onlinemat" style={{width: 120, marginBottom: 16}} />
                    <Typography.Title>{t('navigation:home.appName')}</Typography.Title>
                    <Typography.Paragraph style={{fontSize: 16, maxWidth: 600}}>
                        {t('navigation:home.description')}
                    </Typography.Paragraph>
                    <Button type="primary" size="large" icon={<LoginOutlined />} onClick={() => loginWithRedirect()} style={{marginTop: 8}}>
                        {t('navigation:menu.login')}
                    </Button>
                    <Row gutter={[24, 24]} style={{marginTop: 32, width: '100%'}}>
                        {features.map(({key, icon}) => (
                            <Col xs={24} sm={8} key={key}>
                                <Card style={{height: '100%', textAlign: 'center'}}>
                                    <div style={{marginBottom: 12}}>{icon}</div>
                                    <Typography.Title level={5} style={{marginTop: 0}}>
                                        {t(`navigation:home.features.${key}.title`)}
                                    </Typography.Title>
                                    <Typography.Paragraph type="secondary" style={{marginBottom: 0}}>
                                        {t(`navigation:home.features.${key}.description`)}
                                    </Typography.Paragraph>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </div>
            </div>
        }
        {
            !!user && <div className={classNames(appStyles['flex-grower'], appStyles['center-container'])}>
                <Result
                    status='success'
                    title={t('navigation:home.dashboard')}
                    subTitle={t('navigation:home.welcome', { name: user.given_name })}
                >
                </Result>
            </div>
        }
    </div>
}
