import React, { useState, forwardRef, useImperativeHandle, useRef } from 'react';
import { Button, message, Modal, Form } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { Material } from 'types/material.types';
import { validateMessages } from 'util/FormValdationMessages';
import { editMaterial, generateKeywords, getAvailableMatCount, getAvailableMatCountToEdit } from 'util/MaterialUtil';
import { EditFormHandle } from 'types/form.types';
import { MaterialFormFields } from './MaterialFormFields';

export interface EditMaterialProps {
    abteilungId: string
    material: Material
    materialId: string
    onSuccess?: () => void
}

export const EditMaterial = forwardRef<EditFormHandle, EditMaterialProps>((props, ref) => {
    useImperativeHandle(
        ref,
        () => ({
            save() {
                prepareEditMaterial();
            }
        }),
    )

    const { abteilungId, materialId, material, onSuccess } = props;

    const [form] = Form.useForm<Material>();

    const [renderMatImages, setRenderMatImages] = useState(material.imageUrls || []);
    const [maxCount, setMaxCount] = useState<{damaged: number, lost: number}>(getAvailableMatCountToEdit(material));
    const [availCount, setAvailCount] = useState<number>(getAvailableMatCount(material));

    const prepareEditMaterial = async () => {
        try {
            await form.validateFields();
        } catch(validation) {
            //form is not valid
            return;
        }
        try {
            const material = form.getFieldsValue() as Material;
            material.id = materialId;

            await editMaterial(abteilungId, material);
            if (onSuccess) {
                onSuccess()
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
            initialValues={material}
            onValuesChange={() => {
                if (renderMatImages !== form.getFieldValue('imageUrls')) {
                    setRenderMatImages(form.getFieldValue('imageUrls'))
                }
                const tempMat = form.getFieldsValue() as Material;
                setMaxCount(getAvailableMatCountToEdit(tempMat))
                setAvailCount(getAvailableMatCount(tempMat))

                form.validateFields()
            }}
            validateMessages={validateMessages}
        >
            <MaterialFormFields
                maxCount={maxCount}
                availCount={availCount}
                renderMatImages={renderMatImages}
            />
        </Form>
    </>
})

export const EditMaterialButton = (props: EditMaterialProps) => {

    const { abteilungId, materialId, material } = props;

    const editMaterialRef = useRef<EditFormHandle>(null);

    const [isModalVisible, setIsModalVisible] = useState(false);

    return <>
        <Button type='primary' onClick={(event) => { event.preventDefault(); event.stopPropagation(); setIsModalVisible(!isModalVisible) }} icon={<EditOutlined />} />
        <Modal
            title='Material bearbeiten'
            open={isModalVisible}
            onCancel={() => { setIsModalVisible(false) }}
            footer={[
                <Button key='back' onClick={() => { setIsModalVisible(false) }}>
                    Abbrechen
                </Button>,
                <Button key='save'  type='primary' onClick={() => { editMaterialRef.current?.save() }}>
                    Änderungen speichern
                </Button>
            ]}
        >
            <EditMaterial ref={editMaterialRef} abteilungId={abteilungId} materialId={materialId} material={material} onSuccess={() => { setIsModalVisible(false) }} />
        </Modal>
    </>

}
