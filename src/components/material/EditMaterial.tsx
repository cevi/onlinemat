import React, { useState, useEffect } from 'react';
import { Button, Input, message, Switch, InputNumber, Select, Spin, Form } from 'antd';
import Modal from 'antd/lib/modal/Modal';
import { firestore } from 'config/firebase/firebase';
import { abteilungenCategoryCollection, abteilungenCollection, abteilungenMaterialsCollection } from 'config/firebase/collections';
import { Categorie } from 'types/categorie.types';
import { useAuth0 } from '@auth0/auth0-react';
import { PicturesWall } from 'components/pictures/PictureWall';
import { Material } from 'types/material.types';
import { EditOutlined, MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { validateMessages } from 'util/FormValdationMessages';
import { generateKeywords } from 'util/MaterialUtil';

export interface EditMaterialProps {
    abteilungId: string
    material: Material
    materialId: string
    onSuccess?: () => void
}

export const EditMaterial = (props: EditMaterialProps) => {

    const { abteilungId, materialId, material, onSuccess } = props;

    const { isAuthenticated } = useAuth0();

    const [form] = Form.useForm<Material>();


    const { TextArea } = Input;
    const { Option } = Select;

    const [catLoading, setCatLoading] = useState(false);

    const [categories, setCategories] = useState<Categorie[]>([])

    const [renderMatImages, setRenderMatImages] = useState(material.imageUrls || []);

    const formItemLayout = {
        labelCol: {
            xs: { span: 24 },
            sm: { span: 4 },
        },
        wrapperCol: {
            xs: { span: 24 },
            sm: { span: 20 },
        },
    };

    const formItemLayoutWithOutLabel = {
        wrapperCol: {
            xs: { span: 24, offset: 0 },
            sm: { span: 20, offset: 4 },
        },
    };

    //fetch categories
    useEffect(() => {
        if (!isAuthenticated) return;
        setCatLoading(true);
        return firestore().collection(abteilungenCollection).doc(abteilungId).collection(abteilungenCategoryCollection).onSnapshot(snap => {
            setCatLoading(false);
            const categoriesLoaded = snap.docs.flatMap(doc => {
                return {
                    ...doc.data(),
                    __caslSubjectType__: 'Categorie',
                    id: doc.id
                } as Categorie;
            });
            setCategories(categoriesLoaded);
        });
    }, [isAuthenticated, abteilungId]);

    const editMaterial = async () => {
        try {
            const material = form.getFieldsValue() as Material;
            material.keywords = generateKeywords(material.name)

            await firestore().collection(abteilungenCollection).doc(abteilungId).collection(abteilungenMaterialsCollection).doc(materialId).update(material);
            message.success(`Material ${form.getFieldValue('name')} erfolgreich bearbeitet`);
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
            catLoading ? <Spin /> : <>

                <Form
                    form={form}
                    initialValues={material}
                    onValuesChange={() => {
                        if (renderMatImages !== form.getFieldValue('imageUrls')) {
                            setRenderMatImages(form.getFieldValue('imageUrls'))
                        }
                    }}
                    onFinish={editMaterial}
                    validateMessages={validateMessages}
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
                            placeholder="Materialname"
                        />
                    </Form.Item>
                    <Form.Item
                        label="Bemerkung"
                        name="comment"
                        rules={[
                            { required: false },
                        ]}
                    >
                        <TextArea
                            placeholder="Bemerkung"
                            rows={4}
                        />
                    </Form.Item>
                    <Form.Item
                        label="Anzahl"
                        name="count"
                        rules={[
                            { required: true },
                        ]}
                    >
                        <InputNumber min={1} />
                    </Form.Item>
                    <Form.Item
                        label="Gewicht in Kg"
                        name="weightInKg"
                        rules={[
                            { required: false },
                        ]}
                    >
                        <InputNumber />
                    </Form.Item>
                    <Form.Item
                        label="Ist Verbrauchsmaterial"
                        name="consumables"
                        rules={[
                            { required: true },

                        ]}
                    >
                        <Switch />
                    </Form.Item>
                    <Form.Item
                        label="Kategorien"
                        name="categorieIds"
                        rules={[
                            { required: false },
                        ]}
                    >
                        <Select
                            mode="multiple"
                            allowClear
                            style={{ width: '100%' }}
                            placeholder="Kategorien"
                        >
                            {
                                categories.map(cat => <Option key={cat.id} value={cat.id}>{cat.name}</Option>)
                            }
                        </Select>
                    </Form.Item>
                    <Form.List
                        name="imageUrls"
                        rules={[
                            {
                                validator: async (_, names) => {
                                    // if (!names || names.length < 2) {
                                    //   return Promise.reject(new Error('At least 2 passengers'));
                                    // }
                                },
                            },
                        ]}
                    >
                        {(fields, { add, remove }, { errors }) => (
                            <>
                                {fields.map((field, index) => (
                                    <Form.Item
                                        {...(index === 0 ? formItemLayout : formItemLayoutWithOutLabel)}
                                        label={index === 0 ? 'Bilder Urls' : ''}
                                        required={false}
                                        key={field.key}
                                    >
                                        <Form.Item
                                            {...field}
                                            validateTrigger={['onChange', 'onBlur']}
                                            rules={[
                                                {
                                                    required: false,
                                                    whitespace: true,
                                                },
                                            ]}
                                            noStyle
                                        >
                                            <Input placeholder="Material Bild Url" style={{ width: '90%' }} />
                                        </Form.Item>
                                        <MinusCircleOutlined
                                            className="dynamic-delete-button"
                                            onClick={() => remove(field.name)}
                                        />
                                    </Form.Item>
                                ))}
                                <Form.Item>
                                    <Button
                                        type="dashed"
                                        onClick={() => add()}
                                        style={{ width: '100%' }}
                                        icon={<PlusOutlined />}
                                    >
                                        Bild hinzufügen
                                    </Button>
                                </Form.Item>
                            </>
                        )}
                    </Form.List>

                    <PicturesWall showRemove={false} imageUrls={renderMatImages} />

                    <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
                        <Button type="primary" htmlType="submit">
                            Änderungen speichern
                        </Button>
                    </Form.Item>

                </Form>

            </>
        }
    </>
}

export const EditMaterialButton = (props: EditMaterialProps) => {

    const { abteilungId, materialId, material } = props;

    const [isModalVisible, setIsModalVisible] = useState(false);

    return <>
        <Button type="primary" onClick={() => { setIsModalVisible(!isModalVisible) }} icon={<EditOutlined />}/>
        <Modal
            title="Material bearbeiten"
            visible={isModalVisible}
            onCancel={() => { setIsModalVisible(false) }}
            footer={[
                <Button key="back" onClick={() => { setIsModalVisible(false) }}>
                    Abbrechen
                </Button>,
            ]}
        >
            <EditMaterial abteilungId={abteilungId} materialId={materialId} material={material} onSuccess={() => { setIsModalVisible(false) }} />
        </Modal>
    </>

}