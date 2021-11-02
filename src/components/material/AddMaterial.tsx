import React, { useState } from 'react';
import { Button, Input, message, Switch, InputNumber } from 'antd';
import Modal from 'antd/lib/modal/Modal';
import { firestore } from 'config/firebase/firebase';
import { abteilungenCollection, abteilungenMaterialsCollection } from 'config/firebase/collections';

export interface AddMaterialProps {
    abteilungId: string
}


export const AddMaterial = (props: AddMaterialProps) => {

    const { abteilungId } = props;

    const { TextArea } = Input;

    const [isModalVisible, setIsModalVisible] = useState(false);

    const [name, setName] = useState<string>('');
    const [comment, setComment] = useState<string>('');
    const [weightInKg, setWeightInKg] = useState<number>(0);
    const [count, setCount] = useState<number>(1);
    const [consumables, setConsumables] = useState<boolean>(false);

    const addMaterial = async () => {
        try {
            const response = await firestore().collection(abteilungenCollection).doc(abteilungId).collection(abteilungenMaterialsCollection).add({
                name,
                comment,
                weightInKg,
                count,
                consumables,
            })
            if(response.id) {
                message.success(`Material ${name} erfolgreich erstellt`);
            } else {
                message.error('Es ist leider ein Fehler aufgetreten')
            }
        } catch(ex) {
            message.error(`Es ist ein Fehler aufgetreten: ${ex}`)
        }
        
        setName('')
        setComment('')
        setWeightInKg(0)
        setCount(1)
        setConsumables(false)
        setIsModalVisible(false)
    }

    return <>
        <Button type="primary" onClick={()=>{setIsModalVisible(!isModalVisible)}}>
            Abteilung hinzufügen
      </Button>
        <Modal title="Material hinzufügen" visible={isModalVisible} onOk={addMaterial} onCancel={()=>{ setIsModalVisible(false) }}>
            <Input
                value={name}
                onChange={(e)=> setName(e.currentTarget.value)}
                placeholder="Name" />
            <TextArea 
                value={comment}
                onChange={(e: any)=> setComment(e.currentTarget.value)}
                placeholder="Bemerkung"
                rows={4} />
            {!consumables && <><p>Anzahl</p><InputNumber value={count} min={1} onChange={(number)=> setCount(number)} /></> }
            <p>Gewicht in Kg</p><InputNumber value={weightInKg} onChange={(number)=> setWeightInKg(number)} />
            <p>Ist Verbrauchsmaterial</p>
            <Switch checked={consumables} onChange={()=> { 
                if(consumables) {
                    setCount(0)
                }
                setConsumables(!consumables)
                }}
            />
            
        </Modal>
    </>
}
