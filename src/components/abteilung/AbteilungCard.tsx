import React from 'react';
import { Button, Card, Image } from 'antd';
import { Abteilung } from 'types/abteilung.type';
import { useHistory, useRouteMatch } from 'react-router';
import ceviLogoImage from "assets/cevi_logo.png";
import classNames from 'classnames';
import appStyles from 'styles.module.scss';
import { Can } from 'config/casl/casl';

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
                <Can I='read' this={abteilung}>
                    <Button onClick={() => push(`${url}/${abteilung.id}`)}>Details</Button>
                </Can>
                <Can I='order' this={abteilung}>
                    <Button onClick={() => push(`${url}/${abteilung.id}/mat`)}>Material</Button>
                </Can>
    </Card>
}
