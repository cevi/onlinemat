import React, { useState } from 'react';
import { Button, Input, message } from 'antd';
import Modal from 'antd/lib/modal/Modal';
import { firestore } from 'config/firebase/firebase';
import { abteilungenCategoryCollection, abteilungenCollection } from 'config/firebase/collections';

export interface AddCategorieProps {
    abteilungId: string
}


export const AddCategorie = (props: AddCategorieProps) => {

    const { abteilungId } = props;


    const [isModalVisible, setIsModalVisible] = useState(false);

    const [name, setName] = useState<string>('');

    const addCategorie = async () => {
        try {
            const response = await firestore().collection(abteilungenCollection).doc(abteilungId).collection(abteilungenCategoryCollection).add({
                name,
            })
            if(response.id) {
                message.success(`Kategorie ${name} erfolgreich erstellt`);
            } else {
                message.error('Es ist leider ein Fehler aufgetreten')
            }
        } catch(ex) {
            message.error(`Es ist ein Fehler aufgetreten: ${ex}`)
        }
        
        setName('')
    }

    return <>
        <Button type="primary" onClick={()=>{setIsModalVisible(!isModalVisible)}}>
            Kategorie hinzufügen
      </Button>
        <Modal title="Kategorie hinzufügen" visible={isModalVisible} onOk={addCategorie} onCancel={()=>{ setIsModalVisible(false) }}>
            <Input
                value={name}
                onChange={(e: any)=> setName(e.currentTarget.value)}
                placeholder="Name" />
            
        </Modal>
    </>
}
