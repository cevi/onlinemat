import React, {forwardRef, useImperativeHandle, useRef, useState} from 'react';
import {Button, Form, Input, message, Modal} from 'antd';
import {EditOutlined} from '@ant-design/icons';
import {getValidateMessages} from 'util/FormValdationMessages';
import {Categorie} from "../../types/categorie.types";
import {editCategory} from "../../util/CategoryUtil";
import { EditFormHandle } from 'types/form.types';
import { useTranslation } from 'react-i18next';

export interface EditCategoryProps {
    abteilungId: string
    category: Categorie
    categoryId: string
    onSuccess?: () => void
}

export const EditCategory = forwardRef<EditFormHandle, EditCategoryProps>((props, ref) => {
    useImperativeHandle(
        ref,
        () => ({
            save() {
                prepareEditCategory();
            }
        }),
    )

    const { abteilungId, categoryId, category, onSuccess } = props;

    const [form] = Form.useForm<Categorie>();
    const { t } = useTranslation();

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
                message.error(t('common:errors.genericShort'))
            }
        } catch (ex) {
            message.error(t('common:errors.generic', { error: ex }))
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
                validateMessages={getValidateMessages()}
            >
                <Form.Item
                    label={t('category:form.name')}
                    name='name'
                    rules={[
                        { required: true },
                        { type: 'string', min: 1 },
                    ]}
                >
                    <Input
                        placeholder={t('category:form.name')}
                    />
                </Form.Item>
            </Form>
        }
    </>
})

export const EditCategoryButton = (props: EditCategoryProps) => {

    const { abteilungId, categoryId, category } = props;

    const editCategoryRef = useRef<EditFormHandle>(null);

    const [isModalVisible, setIsModalVisible] = useState(false);
    const { t } = useTranslation();

    return <>
        <Button type='primary' onClick={() => { setIsModalVisible(!isModalVisible) }} icon={<EditOutlined />} />
        <Modal
            title={t('category:edit.title')}
            open={isModalVisible}
            onCancel={() => { setIsModalVisible(false) }}
            footer={[
                <Button key='back' onClick={() => { setIsModalVisible(false) }}>
                    {t('common:buttons.cancel')}
                </Button>,
                <Button key='save'  type='primary' onClick={() => { editCategoryRef.current?.save() }}>
                    {t('category:edit.submit')}
                </Button>
            ]}
        >
            <EditCategory ref={editCategoryRef} abteilungId={abteilungId} categoryId={categoryId} category={category} onSuccess={() => { setIsModalVisible(false) }} />
        </Modal>
    </>

}