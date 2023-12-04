import { Button, Popconfirm, message } from 'antd';
import {Abteilung} from 'types/abteilung.type';
import { firestore } from 'config/firebase/firebase';
import { abteilungenCollection, abteilungenMaterialsCollection} from "config/firebase/collections";
import { DeleteOutlined } from '@ant-design/icons';
import { useContext, useState } from 'react';

export interface DeleteMaterialProps {
    abteilung: Abteilung
}

export const DeleteMaterialButton = (props: DeleteMaterialProps) => {
    const { abteilung} = props;
    const [updateLoading] = useState(false);

    const delteMaterial = async () => {
        await firestore().collection(abteilungenCollection).doc(abteilung.id).collection(abteilungenMaterialsCollection).get().then((snapshot) => {
            snapshot.docs.forEach((doc) => {
                doc.ref.delete();
            });
        }).then(() => {
            message.info(`Alles Material von ${abteilung.name} wurde erfolgreich gelöscht`);
        }).catch((ex) => {
            message.error(`Es ist ein Fehler aufgetreten: ${ex}`);
        });
    }

    return <>
        <Popconfirm
            title='Möchtest du wirklich alles Material dieser Abteilung löschen?'
            onConfirm={() => delteMaterial()}
            onCancel={() => { }}
            okText='Ja'
            cancelText='Nein'
        >
        <Button type='ghost' danger icon={<DeleteOutlined />} disabled={updateLoading}>
            Material Löschen
        </Button>     
        </Popconfirm>
    </>
}