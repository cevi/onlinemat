import { Result, Tag } from 'antd';
import { useUser } from 'hooks/use-user';
import { Abteilung } from 'types/abteilung.type';
import { JoinAbteilungButton } from './join/JoinAbteilung';
import { useTranslation } from 'react-i18next';

export interface NoAccessToAbteilungProps {
    abteilung: Abteilung
}

export const NoAccessToAbteilung = (props: NoAccessToAbteilungProps) => {

    const { abteilung } = props;

    const { t } = useTranslation();
    const user = useUser();

    const userRole = user.appUser?.userData['roles'] ? user.appUser?.userData?.roles[abteilung.id] : ''

    return <Result
        status='warning'
        title={t('abteilung:noAccess.title')}
        extra={
            <>
                {
                    userRole !== 'pending' ? <JoinAbteilungButton abteilungId={abteilung.id} abteilungName={abteilung.name} /> : <Tag color='geekblue'>{t('common:roles.pending')}</Tag>
                }

                {
                    abteilung.email && <p>{t('abteilung:noAccess.emailHint')}<a href={`mailto:${abteilung.email}`}>{abteilung.email}</a></p>
                }
            </>
        }
    />
}