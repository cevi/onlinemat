import React, { useState } from 'react';
import { Button, Input, message } from 'antd';
import Modal from 'antd/lib/modal/Modal';
import { firestore } from 'config/firebase/firebase';
import { abteilungenCollection, abteilungenMembersCollection } from 'config/firebase/collections';
import { useUser } from 'hooks/use-user';

export interface AddAbteilungProps {
}


export const AddAbteilung = (props: AddAbteilungProps) => {

    const userState = useUser();

    const [isModalVisible, setIsModalVisible] = useState(false);

    const [abteilungsName, setAbteilungsName] = useState<string>('');

    const addAbteilungToDB = async () => {
        try {
            const response = await firestore().collection(abteilungenCollection).add({
                name: abteilungsName,
                creatorId: userState.appUser?.userData?.id,
            })
            if(response.id) {
                message.success(`Abteilung ${abteilungsName} erfolgreich erstellt`);
            } else {
                message.error('Es ist leider ein Fehler aufgetreten')
            }
        } catch(ex) {
            message.error(`Es ist ein Fehler aufgetreten: ${ex}`)
        }
        
        setAbteilungsName('')
        setIsModalVisible(false)
    }

    return <>
        <Button type='primary' onClick={()=>{setIsModalVisible(!isModalVisible)}}>
            Abteilung hinzufügen
      </Button>
        <Modal title='Abteilung erstellen' visible={isModalVisible} onOk={addAbteilungToDB} onCancel={()=>{ setIsModalVisible(false) }}>
            <Input
                value={abteilungsName}
                onChange={(e)=> setAbteilungsName(e.currentTarget.value)}
                placeholder='Name' />
        </Modal>
    </>
}
