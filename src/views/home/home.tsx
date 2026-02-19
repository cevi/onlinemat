import classNames from 'classnames';
import appStyles from 'styles.module.scss';
import { Result, Typography } from 'antd';
import { useAuth0 } from '@auth0/auth0-react';
import ceviLogoImage from 'assets/onlinemat_logo.png';
import { useTranslation } from 'react-i18next';

export const HomeView = () => {
    const { t } = useTranslation('navigation');
    const { user, isAuthenticated  } = useAuth0();

    return <div className={classNames(appStyles['flex-grower'], appStyles['center-container-stretch'])} style={{backgroundImage:`url(${ceviLogoImage})`,backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundSize: '20%', backgroundPositionY: '25%'}}>
        <Typography.Title level={3}>{t('navigation:home.title')}</Typography.Title>

        {
            !isAuthenticated && <div className={classNames(appStyles['flex-grower'], appStyles['center-container'])}>
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                    <Typography.Title>{t('navigation:home.appName')}</Typography.Title>
                    <Typography.Paragraph>
                        {t('navigation:home.description')}<br />
                    </Typography.Paragraph>
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
