import React, {forwardRef, useImperativeHandle, useRef, useState} from 'react';
import {Button, Form, Input, message} from 'antd';
import Modal from 'antd/lib/modal/Modal';
import {EditOutlined} from '@ant-design/icons';
import {validateMessages} from 'util/FormValdationMessages';
import {Categorie} from "../../types/categorie.types";
import {editCategory} from "../../util/CategoryUtil";

export interface EditCategoryProps {
    abteilungId: string
    category: Categorie
    categoryId: string
    onSuccess?: () => void
}

export const EditCategory = forwardRef((props: EditCategoryProps, ref) => {
    useImperativeHandle(
        ref,
        () => ({
            saveEditCategory() {
                prepareEditCategory();
            }
        }),
    )

    const { abteilungId, categoryId, category, onSuccess } = props;

    const [form] = Form.useForm<Categorie>();

    const prepareEditCategory = async () => {
        try {
            await form.validateFields();
        } catch(validation) {
            //form is not valid
            return;
        }
        try {
            const category = form.getFieldsValue() as Categorie;
            category.id = categoryId;

            await editCategory(abteilungId, category);
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
        {
            <Form
                form={form}
                initialValues={category}
                onValuesChange={() => {
                    const tempCategory = form.getFieldsValue() as Categorie;
                    form.validateFields()

                }}
                validateMessages={validateMessages}
            >
                <Form.Item
                    label='Name'
                    name='name'
                    rules={[
                        { required: true },
                        { type: 'string', min: 1 },
                    ]}
                >
                    <Input
                        placeholder='Name'
                    />
                </Form.Item>
            </Form>
        }
    </>
})

export const EditCategoryButton = (props: EditCategoryProps) => {

    const { abteilungId, categoryId, category } = props;

    const editCategoryRef = useRef();

    const [isModalVisible, setIsModalVisible] = useState(false);

    return <>
        <Button type='primary' onClick={() => { setIsModalVisible(!isModalVisible) }} icon={<EditOutlined />} />
        <Modal
            title='Kategorie bearbeiten'
            open={isModalVisible}
            onCancel={() => { setIsModalVisible(false) }}
            footer={[
                <Button key='back' onClick={() => { setIsModalVisible(false) }}>
                    Abbrechen
                </Button>,
                <Button key='save'  type='primary' onClick={() => { 
                    if(!editCategoryRef || !editCategoryRef.current) return;
                    //TODO: typescript
                    (editCategoryRef.current as any).saveEditCategory() }}
                >
                    Änderungen speichern
                </Button>
            ]}
        >
            <EditCategory ref={editCategoryRef} abteilungId={abteilungId} categoryId={categoryId} category={category} onSuccess={() => { setIsModalVisible(false) }} />
        </Modal>
    </>

}