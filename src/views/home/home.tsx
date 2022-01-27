import classNames from 'classnames';
import appStyles from 'styles.module.scss';
import { PageHeader, Result, Typography } from 'antd';
import { useAuth0 } from '@auth0/auth0-react';
import ceviLogoImage from 'assets/cevi_logo.png';

export const HomeView = () => {
    const { user, isAuthenticated  } = useAuth0();

    return <div className={classNames(appStyles['flex-grower'], appStyles['center-container-stretch'])} style={{backgroundImage:`url(${ceviLogoImage})`,backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundSize: '20%', backgroundPositionY: '25%'}}>
        <PageHeader title='Home'></PageHeader>

        {
            !isAuthenticated && <div className={classNames(appStyles['flex-grower'], appStyles['center-container'])}>
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                    <Typography.Title>Onlinemat</Typography.Title>
                    <Typography.Paragraph>
                        Dies ist die Webseite vom Cevi Onlinemat<br />
                    </Typography.Paragraph>
                </div>
            </div>
        }
        {
            !!user && <div className={classNames(appStyles['flex-grower'], appStyles['center-container'])}>
                <Result
                    status='success'
                    title='Onlinemat Dashboard'
                    subTitle={`Willkommen ${user.given_name}, du kannst jetzt loslegen.`}
                >
                </Result>
            </div>
        }
    </div>
}
