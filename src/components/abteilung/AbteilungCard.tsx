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

export interface AbteilungCardProps {
    abteilung: Abteilung
}


export const AbteilungCard = (props: AbteilungCardProps) => {

    const { abteilung } = props;

    const { push } = useHistory();
    const { url } = useRouteMatch();

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
                <Button onClick={() => push(`${url}/${abteilung.id}`)}>Details</Button>
            </Can>
            <Can I='order' this={abteilung}>
                <Button onClick={() => push(`${url}/${abteilung.id}/mat`)}>Material</Button>
            </Can>
            <Can not I='order' this={abteilung}>
                <Can I='joinRequest' this={abteilung} passThrough>
                    {(allowed: boolean) => allowed ? <JoinAbteilungButton abteilungId={abteilung.id} abteilungName={abteilung.name} /> : <Tag color="geekblue">Angefragt</Tag>}

                </Can>
            </Can>
        </div>


    </Card>
}
