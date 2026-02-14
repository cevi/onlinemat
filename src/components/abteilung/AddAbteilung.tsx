import React, { useState } from 'react';
import { Button, Input, message } from 'antd';
import { Modal } from 'antd';
import { db } from 'config/firebase/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { abteilungenCollection, abteilungenMembersCollection } from 'config/firebase/collections';
import { useUser } from 'hooks/use-user';
import { useTranslation } from 'react-i18next';

export interface AddAbteilungProps {
}


export const AddAbteilung = (props: AddAbteilungProps) => {

    const { t } = useTranslation();
    const userState = useUser();

    const [isModalVisible, setIsModalVisible] = useState(false);

    const [abteilungsName, setAbteilungsName] = useState<string>('');

    const addAbteilungToDB = async () => {
        try {
            const response = await addDoc(collection(db, abteilungenCollection), {
                name: abteilungsName,
                creatorId: userState.appUser?.userData?.id,
            })
            if(response.id) {
                message.success(t('abteilung:add.success', { name: abteilungsName }));
            } else {
                message.error(t('common:errors.genericShort'))
            }
        } catch(ex) {
            message.error(t('common:errors.generic', { error: ex }))
        }
        
        setAbteilungsName('')
        setIsModalVisible(false)
    }

    return <>
        <Button type='primary' onClick={()=>{setIsModalVisible(!isModalVisible)}}>
            {t('abteilung:add.button')}
      </Button>
        <Modal title={t('abteilung:add.title')} open={isModalVisible} onOk={addAbteilungToDB} onCancel={()=>{ setIsModalVisible(false) }}>
            <Input
                value={abteilungsName}
                onChange={(e)=> setAbteilungsName(e.currentTarget.value)}
                placeholder={t('abteilung:add.namePlaceholder')} />
        </Modal>
    </>
}
