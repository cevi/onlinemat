import React, { useState } from 'react';
import { Button, message, Modal, Spin, Form } from 'antd';
import { db } from 'config/firebase/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { abteilungenCollection, abteilungenMaterialsCollection } from 'config/firebase/collections';
import { Material } from 'types/material.types';
import { validateMessages } from 'util/FormValdationMessages';
import { generateKeywords, getAvailableMatCount, getAvailableMatCountToEdit } from 'util/MaterialUtil';
import { MaterialFormFields } from './MaterialFormFields';

export interface AddMaterialProps {
    abteilungId: string
    onSuccess?: () => void
}

export const AddMaterial = (props: AddMaterialProps) => {

    const { abteilungId, onSuccess } = props;

    const [form] = Form.useForm<Material>();

    const [renderMatImages, setRenderMatImages] = useState([]);
    const [maxCount, setMaxCount] = useState<{damaged: number, lost: number}>({damaged: 0, lost: 0});
    const [availCount, setAvailCount] = useState<number>(0);

    const addMaterial = async () => {
        try {
            await form.validateFields();
        } catch(validation) {
            //form is not valid
            return;
        }
        try {
            const material = form.getFieldsValue() as Material;
            material.keywords = generateKeywords(material.name)

            const response = await addDoc(collection(db, abteilungenCollection, abteilungId, abteilungenMaterialsCollection), material)
            if (response.id) {
                message.success(`Material ${form.getFieldValue('name')} erfolgreich erstellt`);
                form.resetFields();
                setRenderMatImages([])
                if(onSuccess) {
                    onSuccess()
                }
            } else {
                message.error('Es ist leider ein Fehler aufgetreten')
            }
        } catch (ex) {
            message.error(`Es ist ein Fehler aufgetreten: ${ex}`)
        }

    }

    return <>
        <Form
            form={form}
            initialValues={{ consumables: false, categorieIds: [], comment: '', lost: 0, damaged: 0, weightInKg: null, imageUrls: [], onlyLendInternal: true, standort: [] }}
            onValuesChange={() => {
                if (renderMatImages !== form.getFieldValue('imageUrls')) {
                    setRenderMatImages(form.getFieldValue('imageUrls'))
                }

                let tempMat = form.getFieldsValue();
                setMaxCount(getAvailableMatCountToEdit(tempMat))
                setAvailCount(getAvailableMatCount(tempMat))
            }}
            onFinish={addMaterial}
            validateMessages={validateMessages}
        >
            <MaterialFormFields
                maxCount={maxCount}
                availCount={availCount}
                renderMatImages={renderMatImages}
            />

            <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
                <Button type='primary' htmlType='submit'>
                    Material hinzufügen
                </Button>
            </Form.Item>
        </Form>
    </>
}

export const AddMaterialButton = (props: AddMaterialProps) => {

    const { abteilungId } = props;

    const [isModalVisible, setIsModalVisible] = useState(false);

    return <>
        <Button type='primary' onClick={() => { setIsModalVisible(!isModalVisible) }}>
            Material hinzufügen
        </Button>
        <Modal
            title='Material hinzufügen'
            open={isModalVisible}
            onCancel={() => { setIsModalVisible(false) }}
            footer={[
                <Button key='back' onClick={() => { setIsModalVisible(false) }}>
                  Abbrechen
                </Button>,
              ]}
        >
            <AddMaterial abteilungId={abteilungId} onSuccess={()=> { setIsModalVisible(false)}}/>
        </Modal>
    </>

}
