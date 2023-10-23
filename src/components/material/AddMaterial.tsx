import React, { useState, useEffect, useContext } from 'react';
import { Button, Input, message, Switch, InputNumber, Select, Spin, Form } from 'antd';
import Modal from 'antd/lib/modal/Modal';
import { firestore } from 'config/firebase/firebase';
import { abteilungenCategoryCollection, abteilungenCollection, abteilungenMaterialsCollection } from 'config/firebase/collections';
import { Categorie } from 'types/categorie.types';
import { useAuth0 } from '@auth0/auth0-react';
import { PicturesWall } from 'components/pictures/PictureWall';
import { Material } from 'types/material.types';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { validateMessages } from 'util/FormValdationMessages';
import { generateKeywords, getAvailableMatCount, getAvailableMatCountToEdit } from 'util/MaterialUtil';
import {CategorysContext, StandorteContext} from 'components/abteilung/AbteilungDetails';

export interface AddMaterialProps {
    abteilungId: string
    onSuccess?: () => void
}

export const AddMaterial = (props: AddMaterialProps) => {

    const { abteilungId, onSuccess } = props;

    const { isAuthenticated } = useAuth0();

    const [form] = Form.useForm<Material>();

    const { TextArea } = Input;
    const { Option } = Select;

    const [renderMatImages, setRenderMatImages] = useState([]);
    const [maxCount, setMaxCount] = useState<{damged: number, lost: number}>({damged: 0, lost: 0});
    const [availCount, setAvailCount] = useState<number>(0);

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
    const categoriesContext = useContext(CategorysContext);
    const categories = categoriesContext.categories;
    const catLoading = categoriesContext.loading;

    //fetch Standorte
    const standorteContext = useContext(StandorteContext);
    const standorte = standorteContext.standorte;
    const standorteLoading = standorteContext.loading;

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

            const response = await firestore().collection(abteilungenCollection).doc(abteilungId).collection(abteilungenMaterialsCollection).add(material)
            if (response.id) {
                message.success(`Material ${form.getFieldValue('name')} erfolgreich erstellt`);
                form.resetFields();
                setRenderMatImages([])
                if(onSuccess) {
                    onSuccess()
                }
            } else {
                message.error('Es ist leider ein Fehler aufgetreten')
            }
        } catch (ex) {
            message.error(`Es ist ein Fehler aufgetreten: ${ex}`)
        }

    }

    return <>
        {
            standorteLoading && catLoading ? <Spin /> : <>

                <Form
                    form={form}
                    initialValues={{ consumables: false, categorieIds: [], comment: '', lost: 0, damaged: 0,  weightInKg: null, imageUrls: [] }}
                    onValuesChange={() => {
                        if (renderMatImages !== form.getFieldValue('imageUrls')) {
                            setRenderMatImages(form.getFieldValue('imageUrls'))
                        }

                        let tempMat = form.getFieldsValue();
                        setMaxCount(getAvailableMatCountToEdit(tempMat))
                        setAvailCount(getAvailableMatCount(tempMat))
                    }}
                    onFinish={addMaterial}
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
                        ]}
                    >
                        <InputNumber min={1} />
                    </Form.Item>
                    <Form.Item
                        label='Verloren'
                        name='lost'
                        rules={[
                            { required: true },
                        ]}
                    >
                        <InputNumber min={0} max={maxCount.lost}/>
                    </Form.Item>
                    <Form.Item
                        label='Beschädigt'
                        name='damaged'
                        rules={[
                            { required: true },
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
                        label='Darf nur von Internen ausgeliehen werden'
                        name='onlyLendInternal'
                        rules={[
                            { required: true },

                        ]}
                    >
                        <Switch defaultChecked={true}/>
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

                    <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
                        <Button type='primary' htmlType='submit'>
                            Material hinzufügen
                        </Button>
                    </Form.Item>

                </Form>
                
            </>
        }
    </>
}

export const AddMaterialButton = (props: AddMaterialProps) => {

    const { abteilungId } = props;

    const [isModalVisible, setIsModalVisible] = useState(false);

    return <>
        <Button type='primary' onClick={() => { setIsModalVisible(!isModalVisible) }}>
            Material hinzufügen
        </Button>
        <Modal 
            title='Material hinzufügen' 
            visible={isModalVisible} 
            onCancel={() => { setIsModalVisible(false) }}
            footer={[
                <Button key='back' onClick={() => { setIsModalVisible(false) }}>
                  Abbrechen
                </Button>,
              ]}
        >
            <AddMaterial abteilungId={abteilungId} onSuccess={()=> { setIsModalVisible(false)}}/>
        </Modal>
    </>

}