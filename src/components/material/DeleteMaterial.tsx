import { Button, Popconfirm, message } from 'antd';
import { useTranslation } from 'react-i18next';
import {Abteilung} from 'types/abteilung.type';
import { db } from 'config/firebase/firebase';
import { collection, getDocs, deleteDoc } from 'firebase/firestore';
import { abteilungenCollection, abteilungenMaterialsCollection} from "config/firebase/collections";
import { DeleteOutlined } from '@ant-design/icons';
import { useContext, useState } from 'react';

export interface DeleteMaterialProps {
    abteilung: Abteilung
}

export const DeleteMaterialButton = (props: DeleteMaterialProps) => {
    const { abteilung} = props;
    const { t } = useTranslation();
    const [updateLoading] = useState(false);

    const delteMaterial = async () => {
        await getDocs(collection(db, abteilungenCollection, abteilung.id, abteilungenMaterialsCollection)).then((snapshot) => {
            snapshot.docs.forEach((d) => {
                deleteDoc(d.ref);
            });
        }).then(() => {
            message.info(t('material:delete.successAll', { name: abteilung.name }));
        }).catch((ex) => {
            message.error(t('common:errors.generic', { error: String(ex) }));
        });
    }

    return <>
        <Popconfirm
            title={t('material:delete.confirmAll')}
            onConfirm={() => delteMaterial()}
            onCancel={() => { }}
            okText={t('common:confirm.yes')}
            cancelText={t('common:confirm.no')}
        >
        <Button type='dashed' danger icon={<DeleteOutlined />} disabled={updateLoading}>
            {t('material:delete.button')}
        </Button>     
        </Popconfirm>
    </>
}