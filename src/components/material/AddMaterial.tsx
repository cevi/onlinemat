import React, { useState } from 'react';
import { Button, message, Modal, Spin, Form } from 'antd';
import { useTranslation } from 'react-i18next';
import { db } from 'config/firebase/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { abteilungenCollection, abteilungenMaterialsCollection } from 'config/firebase/collections';
import { Material } from 'types/material.types';
import { getValidateMessages } from 'util/FormValdationMessages';
import { generateKeywords, getAvailableMatCount, getAvailableMatCountToEdit } from 'util/MaterialUtil';
import { MaterialFormFields } from './MaterialFormFields';

export interface AddMaterialProps {
    abteilungId: string
    onSuccess?: () => void
}

export const AddMaterial = (props: AddMaterialProps) => {

    const { abteilungId, onSuccess } = props;
    const { t } = useTranslation();

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
                message.success(t('material:add.success', { name: form.getFieldValue('name') }));
                form.resetFields();
                setRenderMatImages([])
                if(onSuccess) {
                    onSuccess()
                }
            } else {
                message.error(t('common:errors.genericShort'))
            }
        } catch (ex) {
            message.error(t('common:errors.generic', { error: String(ex) }))
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
            validateMessages={getValidateMessages()}
        >
            <MaterialFormFields
                maxCount={maxCount}
                availCount={availCount}
                renderMatImages={renderMatImages}
            />

            <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
                <Button type='primary' htmlType='submit'>
                    {t('material:add.submit')}
                </Button>
            </Form.Item>
        </Form>
    </>
}

export const AddMaterialButton = (props: AddMaterialProps) => {

    const { abteilungId } = props;
    const { t } = useTranslation();

    const [isModalVisible, setIsModalVisible] = useState(false);

    return <>
        <Button type='primary' onClick={() => { setIsModalVisible(!isModalVisible) }}>
            {t('material:add.button')}
        </Button>
        <Modal
            title={t('material:add.title')}
            open={isModalVisible}
            onCancel={() => { setIsModalVisible(false) }}
            footer={[
                <Button key='back' onClick={() => { setIsModalVisible(false) }}>
                  {t('common:buttons.cancel')}
                </Button>,
              ]}
        >
            <AddMaterial abteilungId={abteilungId} onSuccess={()=> { setIsModalVisible(false)}}/>
        </Modal>
    </>

}
