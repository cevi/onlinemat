import React, { useContext, useState } from "react";
import { Button, Form, Input, InputNumber, message, Modal, Select, Space } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { db } from "config/firebase/firebase";
import { collection, addDoc } from "firebase/firestore";
import { abteilungenCollection, abteilungenSammlungCollection } from "config/firebase/collections";
import { getValidateMessages } from "util/FormValdationMessages";
import { useTranslation } from 'react-i18next';
import { MaterialsContext } from "contexts/AbteilungContexts";

interface SammlungFormValues {
    name: string;
    description?: string;
    imageUrls?: string[];
    items: { matId: string; count: number }[];
}

export interface AddSammlungProps {
    abteilungId: string;
    onSuccess?: () => void;
}

export const AddSammlung = (props: AddSammlungProps) => {
    const { abteilungId, onSuccess } = props;

    const [form] = Form.useForm<SammlungFormValues>();
    const { t } = useTranslation();
    const { materials } = useContext(MaterialsContext);

    const materialOptions = materials.map(m => ({ label: m.name, value: m.id }));

    const addSammlung = async () => {
        const values = form.getFieldsValue();
        const raw: Record<string, any> = {
            name: values.name,
            description: values.description || null,
            imageUrls: values.imageUrls?.filter(Boolean) || null,
            items: values.items || [],
        };
        const data = Object.fromEntries(Object.entries(raw).filter(([, v]) => v != null));
        try {
            const response = await addDoc(
                collection(db, abteilungenCollection, abteilungId, abteilungenSammlungCollection),
                data,
            );
            if (response.id) {
                message.success(t('sammlung:add.success', { name: values.name }));
                form.resetFields();
                onSuccess?.();
            } else {
                message.error(t('common:errors.genericShort'));
            }
        } catch (ex) {
            message.error(t('common:errors.generic', { error: ex }));
            console.error(ex);
        }
    };

    return (
        <Form
            form={form}
            validateMessages={getValidateMessages()}
            initialValues={{ items: [{ matId: undefined, count: 1 }] }}
            onFinish={addSammlung}
            layout="vertical"
        >
            <Form.Item
                label={t('sammlung:form.name')}
                name="name"
                rules={[{ required: true }, { type: "string", min: 1 }]}
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

            <Form.Item>
                <Button type="primary" htmlType="submit">
                    {t('sammlung:add.submit')}
                </Button>
            </Form.Item>
        </Form>
    );
};

export const AddSammlungButton = (props: AddSammlungProps) => {
    const { abteilungId } = props;
    const [isModalVisible, setIsModalVisible] = useState(false);
    const { t } = useTranslation();

    return (
        <>
            <Button type="primary" onClick={() => setIsModalVisible(true)}>
                {t('sammlung:add.button')}
            </Button>
            <Modal
                title={t('sammlung:add.title')}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={[
                    <Button key="back" onClick={() => setIsModalVisible(false)}>
                        {t('common:buttons.cancel')}
                    </Button>,
                ]}
                width={600}
            >
                <AddSammlung abteilungId={abteilungId} onSuccess={() => setIsModalVisible(false)} />
            </Modal>
        </>
    );
};
