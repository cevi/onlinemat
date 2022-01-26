import React, { useState } from 'react';
import { Button, Input, message, Form } from 'antd';
import Modal from 'antd/lib/modal/Modal';
import { firestore } from 'config/firebase/firebase';
import { abteilungenCategoryCollection, abteilungenCollection } from 'config/firebase/collections';
import { validateMessages } from 'util/FormValdationMessages';
import { Categorie } from 'types/categorie.types';

export interface AddCategorieProps {
    abteilungId: string
    onSuccess?: () => void
}

export const AddCategorie = (props: AddCategorieProps) => {

    const { abteilungId, onSuccess } = props;

    const [form] = Form.useForm<Categorie>();

    const addCategorie = async () => {
        try {
            const response = await firestore().collection(abteilungenCollection).doc(abteilungId).collection(abteilungenCategoryCollection).add(form.getFieldsValue() as Categorie)
            if(response.id) {
                message.success(`Kategorie ${form.getFieldValue('name')} erfolgreich erstellt`);
                form.resetFields();
                if(onSuccess) {
                    onSuccess()
                }
            } else {
                message.error('Es ist leider ein Fehler aufgetreten')
            }
        } catch(ex) {
            message.error(`Es ist ein Fehler aufgetreten: ${ex}`)
        }
        
    }

    return <>
            <Form
                form={form}
                validateMessages={validateMessages}
                onFinish={addCategorie}
            >

                <Form.Item
                    label="Name"
                    name="name"
                    rules={[
                        { required: true },
                        { type: 'string', min: 1 },
                    ]}
                >
                    <Input
                        placeholder="Kategoriename"
                    />
                </Form.Item>
                <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
                        <Button type="primary" htmlType="submit">
                            Kategorie hinzufügen
                        </Button>
                    </Form.Item>
            </Form>
    </>
}

export const AddCategorieButton = (props: AddCategorieProps) => {

    const { abteilungId } = props;

    const [isModalVisible, setIsModalVisible] = useState(false);

    return <>
        <Button type="primary" onClick={() => { setIsModalVisible(!isModalVisible) }}>
            Kategorie hinzufügen
        </Button>
        <Modal 
            title="Kategorie hinzufügen" 
            visible={isModalVisible} 
            onCancel={() => { setIsModalVisible(false) }}
            footer={[
                <Button key="back" onClick={() => { setIsModalVisible(false) }}>
                  Abbrechen
                </Button>,
              ]}
        >
            <AddCategorie abteilungId={abteilungId} onSuccess={()=> { setIsModalVisible(false)}}/>
        </Modal>
    </>

}
