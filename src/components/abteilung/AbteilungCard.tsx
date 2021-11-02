import React from 'react';
import { Button, Card, message, Popconfirm } from 'antd';
import { Abteilung } from 'types/abteilung.type';
import { DeleteOutlined } from '@ant-design/icons';
import { firestore } from 'config/firebase/firebase';
import { abteilungenCollection } from 'config/firebase/collections';
import { useHistory, useRouteMatch } from 'react-router';

export interface AbteilungCardProps {
    abteilung: Abteilung
}


export const AbteilungCard = (props: AbteilungCardProps) => {

    const { abteilung } = props;

    const { push } = useHistory();
    const { url } = useRouteMatch();


    const delteAbteilung = async () => {
        try {
            await firestore().collection(abteilungenCollection).doc(abteilung.id).delete();
            message.info(`${abteilung.name} erfolgreich gelöscht`)
        } catch(ex) {
            message.error(`Es ist ein Fehler aufgetreten: ${ex}`)
        }
    } 

    return <Card title={abteilung.name} extra={abteilung.id} style={{ width: 300 }}>
        <Popconfirm
            title='Möchtest du diese Abteilung wirklich löschen?'
            onConfirm={delteAbteilung}
            onCancel={() => { }}
            okText='Ja'
            cancelText='Nein'
        >
            <Button type='ghost' danger icon={<DeleteOutlined />}>
                Löschen
            </Button>
            <Button onClick={() => push(`${url}/${abteilung.id}`)}>Öffnen</Button>
        </Popconfirm>
    </Card>
}
