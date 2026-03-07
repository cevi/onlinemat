import React, { forwardRef, useContext, useImperativeHandle, useRef, useState } from 'react';
import { Button, Form, Input, InputNumber, message, Modal, Select, Space } from 'antd';
import { EditOutlined, MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { getValidateMessages } from 'util/FormValdationMessages';
import { Sammlung } from 'types/sammlung.types';
import { editSammlung } from 'util/SammlungUtil';
import { EditFormHandle } from 'types/form.types';
import { useTranslation } from 'react-i18next';
import { MaterialsContext } from 'contexts/AbteilungContexts';

export interface EditSammlungProps {
    abteilungId: string;
    sammlung: Sammlung;
    onSuccess?: () => void;
}

export const EditSammlung = forwardRef<EditFormHandle, EditSammlungProps>((props, ref) => {
    const { abteilungId, sammlung, onSuccess } = props;

    const [form] = Form.useForm();
    const { t } = useTranslation();
    const { materials } = useContext(MaterialsContext);

    const materialOptions = materials.map(m => ({ label: m.name, value: m.id }));

    useImperativeHandle(ref, () => ({
        save() {
            prepareEdit();
        }
    }));

    const prepareEdit = async () => {
        try {
            await form.validateFields();
        } catch {
            return;
        }
        try {
            const values = form.getFieldsValue();
            const updated: Sammlung = {
                __caslSubjectType__: 'Sammlung',
                id: sammlung.id,
                name: values.name,
                description: values.description || '',
                imageUrls: values.imageUrls?.filter(Boolean) || [],
                items: values.items || [],
            };
            await editSammlung(abteilungId, updated);
            onSuccess?.();
        } catch (ex) {
            message.error(t('common:errors.generic', { error: ex }));
        }
    };

    return (
        <Form
            form={form}
            initialValues={{
                name: sammlung.name,
                description: sammlung.description,
                imageUrls: sammlung.imageUrls || [],
                items: sammlung.items || [{ matId: undefined, count: 1 }],
            }}
            validateMessages={getValidateMessages()}
            layout="vertical"
        >
            <Form.Item
                label={t('sammlung:form.name')}
                name="name"
                rules={[{ required: true }, { type: 'string', min: 1 }]}
            >
                <Input placeholder={t('sammlung:form.namePlaceholder')} />
            </Form.Item>
            <Form.Item label={t('sammlung:form.description')} name="description">
                <Input.TextArea placeholder={t('sammlung:form.descriptionPlaceholder')} rows={2} />
            </Form.Item>

            <Form.List name="imageUrls">
                {(fields, { add, remove }) => (
                    <>
                        {fields.map((field) => (
                            <Form.Item key={field.key} label={field.key === 0 ? t('sammlung:form.imageUrls') : undefined}>
                                <Space style={{ display: 'flex' }} align="baseline">
                                    <Form.Item {...field} noStyle>
                                        <Input placeholder={t('sammlung:form.imageUrlPlaceholder')} style={{ width: 300 }} />
                                    </Form.Item>
                                    <MinusCircleOutlined onClick={() => remove(field.name)} />
                                </Space>
                            </Form.Item>
                        ))}
                        <Form.Item>
                            <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />}>
                                {t('sammlung:form.addImage')}
                            </Button>
                        </Form.Item>
                    </>
                )}
            </Form.List>

            <Form.List name="items">
                {(fields, { add, remove }) => (
                    <>
                        {fields.map((field) => (
                            <Space key={field.key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                                <Form.Item
                                    name={[field.name, 'matId']}
                                    rules={[{ required: true }]}
                                >
                                    <Select
                                        showSearch
                                        placeholder={t('sammlung:form.materialPlaceholder')}
                                        style={{ width: 200 }}
                                        options={materialOptions}
                                        filterOption={(input, option) =>
                                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                        }
                                    />
                                </Form.Item>
                                <Form.Item
                                    name={[field.name, 'count']}
                                    rules={[{ required: true }]}
                                >
                                    <InputNumber min={1} placeholder={t('sammlung:form.count')} />
                                </Form.Item>
                                {fields.length > 1 && (
                                    <MinusCircleOutlined onClick={() => remove(field.name)} />
                                )}
                            </Space>
                        ))}
                        <Form.Item>
                            <Button type="dashed" onClick={() => add({ count: 1 })} icon={<PlusOutlined />}>
                                {t('sammlung:form.addItem')}
                            </Button>
                        </Form.Item>
                    </>
                )}
            </Form.List>
        </Form>
    );
});

export const EditSammlungButton = (props: EditSammlungProps) => {
    const { abteilungId, sammlung } = props;
    const editRef = useRef<EditFormHandle>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const { t } = useTranslation();

    return (
        <>
            <Button type="primary" onClick={() => setIsModalVisible(true)} icon={<EditOutlined />} />
            <Modal
                title={t('sammlung:edit.title')}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={[
                    <Button key="back" onClick={() => setIsModalVisible(false)}>
                        {t('common:buttons.cancel')}
                    </Button>,
                    <Button key="save" type="primary" onClick={() => editRef.current?.save()}>
                        {t('sammlung:edit.submit')}
                    </Button>,
                ]}
                width={600}
            >
                <EditSammlung
                    ref={editRef}
                    abteilungId={abteilungId}
                    sammlung={sammlung}
                    onSuccess={() => setIsModalVisible(false)}
                />
            </Modal>
        </>
    );
};
