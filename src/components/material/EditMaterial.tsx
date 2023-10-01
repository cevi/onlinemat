import React, { useState, useEffect, useContext, forwardRef, useImperativeHandle, useRef } from 'react';
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
import { editMaterial, generateKeywords, getAvailableMatCount, getAvailableMatCountToEdit } from 'util/MaterialUtil';
import {CategorysContext, StandorteContext} from 'components/abteilung/AbteilungDetails';
import { max } from 'moment';

export interface EditMaterialProps {
    abteilungId: string
    material: Material
    materialId: string
    onSuccess?: () => void
}

export const EditMaterial = forwardRef((props: EditMaterialProps, ref) => {
    useImperativeHandle(
        ref,
        () => ({
            saveEditMaterial() {
                preparteEditMaterial();
            }
        }),
    )

    const { abteilungId, materialId, material, onSuccess } = props;

    const [form] = Form.useForm<Material>();


    const { TextArea } = Input;
    const { Option } = Select;

    //fetch categories
    const categoriesContext = useContext(CategorysContext);
    const categories = categoriesContext.categories;
    const catLoading = categoriesContext.loading;

    //fetch Standorte
    const standorteContext = useContext(StandorteContext);
    const standorte = standorteContext.standorte;
    const standorteLoading = standorteContext.loading;

    const [renderMatImages, setRenderMatImages] = useState(material.imageUrls || []);

    const [maxCount, setMaxCount] = useState<{damged: number, lost: number}>(getAvailableMatCountToEdit(material));
    const [availCount, setAvailCount] = useState<number>(getAvailableMatCount(material));

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



    const preparteEditMaterial = async () => {
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
        {
            catLoading && standorteLoading ? <Spin /> : <>

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
                    <Form.Item
                        label='Name'
                        name='name'
                        rules={[
                            { required: true },
                            { type: 'string', min: 1 },
                        ]}
                    >
                        <Input
                            placeholder='Materialname'
                        />
                    </Form.Item>
                    <Form.Item
                        label='Bemerkung'
                        name='comment'
                        rules={[
                            { required: false },
                        ]}
                    >
                        <TextArea
                            placeholder='Bemerkung'
                            rows={4}
                        />
                    </Form.Item>
                    <Form.Item
                        label='Standort'
                        name='standort'
                        rules={[
                            { required: false },
                        ]}
                    >
                        <Select
                            mode='multiple'
                            allowClear
                            style={{ width: '100%' }}
                            placeholder='Standort'
                        >
                            {
                                standorte.map(std => <Option key={std.id} value={std.id}>{std.name}</Option>)
                            }
                        </Select>
                    </Form.Item>
                    <Form.Item
                        label='Anzahl'
                        name='count'
                        rules={[
                            { required: true },
                            { type: 'number', min: 1 },
                        ]}
                    >
                        <InputNumber min={1}/>
                    </Form.Item>
                    <Form.Item
                        label='Verloren'
                        name='lost'
                        rules={[
                            { required: true },
                            { type: 'number', min: 0, max: maxCount.lost }
                        ]}
                    >
                        <InputNumber min={0} max={maxCount.lost}/>
                    </Form.Item>
                    <Form.Item
                        label='Beschädigt'
                        name='damaged'
                        rules={[
                            { required: true },
                            { type: 'number', min: 0, max: maxCount.damged }
                        ]}
                    >
                        <InputNumber min={0} max={maxCount.damged}/>
                    </Form.Item>
                    <Form.Item>
                        {
                            `Verfügbar: ${availCount}`
                        }
                    </Form.Item>
                    <Form.Item
                        label='Gewicht in Kg'
                        name='weightInKg'
                        rules={[
                            { required: false },
                        ]}
                    >
                        <InputNumber />
                    </Form.Item>
                    <Form.Item
                        label='Ist Verbrauchsmaterial'
                        name='consumables'
                        rules={[
                            { required: true },

                        ]}
                    >
                        <Switch />
                    </Form.Item>
                    <Form.Item
                        label='Kategorien'
                        name='categorieIds'
                        rules={[
                            { required: false },
                        ]}
                    >
                        <Select
                            mode='multiple'
                            allowClear
                            style={{ width: '100%' }}
                            placeholder='Kategorien'
                        >
                            {
                                categories.map(cat => <Option key={cat.id} value={cat.id}>{cat.name}</Option>)
                            }
                        </Select>
                    </Form.Item>
                    <Form.List
                        name='imageUrls'
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
                                            <Input placeholder='Material Bild Url' style={{ width: '90%' }} />
                                        </Form.Item>
                                        <MinusCircleOutlined
                                            className='dynamic-delete-button'
                                            onClick={() => remove(field.name)}
                                        />
                                    </Form.Item>
                                ))}
                                <Form.Item>
                                    <Button
                                        type='dashed'
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

                </Form>

            </>
        }
    </>
})

export const EditMaterialButton = (props: EditMaterialProps) => {

    const { abteilungId, materialId, material } = props;

    const editMaterialRef = useRef();

    const [isModalVisible, setIsModalVisible] = useState(false);

    return <>
        <Button type='primary' onClick={(event) => { event.preventDefault(); event.stopPropagation(); setIsModalVisible(!isModalVisible) }} icon={<EditOutlined />} />
        <Modal
            title='Material bearbeiten'
            visible={isModalVisible}
            onCancel={() => { setIsModalVisible(false) }}
            footer={[
                <Button key='back' onClick={() => { setIsModalVisible(false) }}>
                    Abbrechen
                </Button>,
                <Button key='save'  type='primary' onClick={() => { 
                    if(!editMaterialRef || !editMaterialRef.current) return;
                    //TODO: typescript
                    (editMaterialRef.current as any).saveEditMaterial() }}
                >
                    Änderungen speichern
                </Button>
            ]}
        >
            <EditMaterial ref={editMaterialRef} abteilungId={abteilungId} materialId={materialId} material={material} onSuccess={() => { setIsModalVisible(false) }} />
        </Modal>
    </>

}