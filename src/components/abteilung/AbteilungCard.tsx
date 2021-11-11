import React from 'react';
import { Button, Card, Image, Tag } from 'antd';
import { Abteilung } from 'types/abteilung.type';
import { useHistory, useRouteMatch } from 'react-router';
import ceviLogoImage from "assets/cevi_logo.png";
import classNames from 'classnames';
import appStyles from 'styles.module.scss';
import moduleStyles from './Abteilung.module.scss';
import { Can } from 'config/casl/casl';
import { JoinAbteilungButton } from './join/JoinAbteilung';
import { useUser } from 'hooks/use-user';

export interface AbteilungCardProps {
    abteilung: Abteilung
}


export const AbteilungCard = (props: AbteilungCardProps) => {

    const { abteilung } = props;

    const user = useUser()

    const { push } = useHistory();
    const { url } = useRouteMatch();

    const userRole = user.appUser?.userData['roles'] ? user.appUser?.userData?.roles[abteilung.id] : ''

    return <Card
        title={abteilung.name}
        extra={abteilung.id}
        style={{ width: 300 }}
        cover={<div className={classNames(appStyles['cardLogoWrapper'])}><Image
            height={100}
            width='auto'
            src={abteilung?.logoUrl || `${ceviLogoImage}`}
            preview={false}
        /></div>}
    >
        <div className={classNames(moduleStyles['cardActions'])}>
            <Can I='read' this={abteilung}>
                <Button onClick={() => push(`${url}/${abteilung.slug || abteilung.id}`)}>Details</Button>
                <Button onClick={() => push(`${url}/${abteilung.slug || abteilung.id}/mat`)}>Material</Button>
            </Can>
            <Can not I='read' this={abteilung}>
                { 
                    userRole !== 'pending' ? <JoinAbteilungButton abteilungId={abteilung.id} abteilungName={abteilung.name} /> : <Tag color="geekblue">Angefragt</Tag>
                }
            </Can>
        </div>


    </Card>
}
