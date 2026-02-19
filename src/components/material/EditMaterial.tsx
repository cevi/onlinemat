import React, { useState, forwardRef, useImperativeHandle, useRef } from 'react';
import { Button, message, Modal, Form } from 'antd';
import { useTranslation } from 'react-i18next';
import { EditOutlined } from '@ant-design/icons';
import { Material } from 'types/material.types';
import { getValidateMessages } from 'util/FormValdationMessages';
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
    const { t } = useTranslation();

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
                message.error(t('common:errors.genericShort'))
            }
        } catch (ex) {
            message.error(t('common:errors.generic', { error: String(ex) }))
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
            validateMessages={getValidateMessages()}
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
    const { t } = useTranslation();

    const editMaterialRef = useRef<EditFormHandle>(null);

    const [isModalVisible, setIsModalVisible] = useState(false);

    return <>
        <Button type='primary' onClick={(event) => { event.preventDefault(); event.stopPropagation(); setIsModalVisible(!isModalVisible) }} icon={<EditOutlined />} />
        <Modal
            title={t('material:edit.title')}
            open={isModalVisible}
            onCancel={() => { setIsModalVisible(false) }}
            footer={[
                <Button key='back' onClick={() => { setIsModalVisible(false) }}>
                    {t('common:buttons.cancel')}
                </Button>,
                <Button key='save'  type='primary' onClick={() => { editMaterialRef.current?.save() }}>
                    {t('material:edit.submit')}
                </Button>
            ]}
        >
            <EditMaterial ref={editMaterialRef} abteilungId={abteilungId} materialId={materialId} material={material} onSuccess={() => { setIsModalVisible(false) }} />
        </Modal>
    </>

}
