import React, { useState } from 'react';
import { Button, Input, message, Modal, Form } from 'antd';
import { db } from 'config/firebase/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { abteilungenCategoryCollection, abteilungenCollection } from 'config/firebase/collections';
import { getValidateMessages } from 'util/FormValdationMessages';
import { Categorie } from 'types/categorie.types';
import { useTranslation } from 'react-i18next';

export interface AddCategorieProps {
    abteilungId: string
    onSuccess?: () => void
}

export const AddCategorie = (props: AddCategorieProps) => {

    const { abteilungId, onSuccess } = props;

    const [form] = Form.useForm<Categorie>();
    const { t } = useTranslation();

    const addCategorie = async () => {
        try {
            const response = await addDoc(collection(db, abteilungenCollection, abteilungId, abteilungenCategoryCollection), form.getFieldsValue() as Categorie)
            if(response.id) {
                message.success(t('category:add.success', { name: form.getFieldValue('name') }));
                form.resetFields();
                if(onSuccess) {
                    onSuccess()
                }
            } else {
                message.error(t('common:errors.genericShort'))
            }
        } catch(ex) {
            message.error(t('common:errors.generic', { error: ex }))
        }

    }

    return <>
            <Form
                form={form}
                validateMessages={getValidateMessages()}
                onFinish={addCategorie}
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
                        placeholder={t('category:form.namePlaceholder')}
                    />
                </Form.Item>
                <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
                        <Button type='primary' htmlType='submit'>
                            {t('category:add.submit')}
                        </Button>
                    </Form.Item>
            </Form>
    </>
}

export const AddCategorieButton = (props: AddCategorieProps) => {

    const { abteilungId } = props;

    const [isModalVisible, setIsModalVisible] = useState(false);
    const { t } = useTranslation();

    return <>
        <Button type='primary' onClick={() => { setIsModalVisible(!isModalVisible) }}>
            {t('category:add.button')}
        </Button>
        <Modal
            title={t('category:add.title')}
            open={isModalVisible}
            onCancel={() => { setIsModalVisible(false) }}
            footer={[
                <Button key='back' onClick={() => { setIsModalVisible(false) }}>
                  {t('common:buttons.cancel')}
                </Button>,
              ]}
        >
            <AddCategorie abteilungId={abteilungId} onSuccess={()=> { setIsModalVisible(false)}}/>
        </Modal>
    </>

}