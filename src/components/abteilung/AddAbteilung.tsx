import React, { useState } from 'react';
import { Button, Input, message } from 'antd';
import Modal from 'antd/lib/modal/Modal';
import { firestore } from 'config/firebase/firebase';
import { abteilungenCollection } from 'config/firebase/collections';

export interface AddAbteilungProps {
}


export const AddAbteilung = (props: AddAbteilungProps) => {

    const [isModalVisible, setIsModalVisible] = useState(false);

    const [abteilungsName, setAbteilungsName] = useState<string>('');

    const addAbteilungToDB = async () => {
        const response = await firestore().collection(abteilungenCollection).add({
            name: abteilungsName
        })
        if(response.id) {
            message.success(`Abteilung ${abteilungsName} erfolgreich erstellt`);
        } else {
            message.error('Es ist leider ein Fehler aufgetreten')
        }
        setAbteilungsName('')
        setIsModalVisible(false)
    }

    return <>
        <Button type="primary" onClick={()=>{setIsModalVisible(!isModalVisible)}}>
            Abteilung hinzufügen
      </Button>
        <Modal title="Abteilung erstellen" visible={isModalVisible} onOk={addAbteilungToDB} onCancel={()=>{ setIsModalVisible(false) }}>
            <Input
                value={abteilungsName}
                onChange={(e)=> setAbteilungsName(e.currentTarget.value)}
                placeholder="Name" />
        </Modal>
    </>
}
