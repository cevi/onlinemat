import React, { useState, useEffect } from 'react';
import { Button, Input, message, Switch, InputNumber, Select, Spin } from 'antd';
import Modal from 'antd/lib/modal/Modal';
import { firestore } from 'config/firebase/firebase';
import { abteilungenCategoryCollection, abteilungenCollection, abteilungenMaterialsCollection } from 'config/firebase/collections';
import { Categorie } from 'types/categorie.types';
import { useAuth0 } from '@auth0/auth0-react';

export interface AddMaterialProps {
    abteilungId: string
}


export const AddMaterial = (props: AddMaterialProps) => {

    const { abteilungId } = props;

    const { isAuthenticated } = useAuth0();

    const { TextArea } = Input;
    const { Option } = Select;

    const [isModalVisible, setIsModalVisible] = useState(false);

    const [name, setName] = useState<string>('');
    const [comment, setComment] = useState<string>('');
    const [weightInKg, setWeightInKg] = useState<number>(0);
    const [count, setCount] = useState<number>(1);
    const [consumables, setConsumables] = useState<boolean>(false);
    const [categorieIds, setCategorieIds] = useState<string[]>([]);

    const [catLoading, setCatLoading] = useState(false);

    const [categories, setCategories] = useState<Categorie[]>([])

    //fetch categories
    useEffect(() => {
        setCatLoading(true);
        return firestore().collection(abteilungenCollection).doc(abteilungId).collection(abteilungenCategoryCollection).onSnapshot(snap => {
            setCatLoading(false);
            const categoriesLoaded = snap.docs.flatMap(doc => {
                return {
                    ...doc.data() as Categorie,
                    id: doc.id
                } as any;
            });
            setCategories(categoriesLoaded);
        });
    }, [isAuthenticated]);

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
        setCategorieIds([])
    }

    return <>
        <Button type="primary" onClick={()=>{setIsModalVisible(!isModalVisible)}}>
            Material hinzufügen
      </Button>
        <Modal title="Material hinzufügen" visible={isModalVisible} onOk={addMaterial} onCancel={()=>{ setIsModalVisible(false) }}>
            {
                catLoading ? <Spin /> :<>
                    <Input
                        value={name}
                        onChange={(e: any)=> setName(e.currentTarget.value)}
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
                    <Select
                        mode="multiple"
                        allowClear
                        value={categorieIds}
                        style={{ width: '100%' }}
                        placeholder="Kategorien"
                        onChange={(vals) => setCategorieIds(vals)}
                        >
                            {
                                categories.map(cat => <Option key={cat.id} value={cat.id}>{cat.name}</Option>)
                            }
                    </Select>
                </>
            }
            
        </Modal>
    </>
}
