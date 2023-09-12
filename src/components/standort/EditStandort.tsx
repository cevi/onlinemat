import React, {forwardRef, useImperativeHandle, useRef, useState} from 'react';
import {Button, Form, Input, message} from 'antd';
import Modal from 'antd/lib/modal/Modal';
import {EditOutlined} from '@ant-design/icons';
import {validateMessages} from 'util/FormValdationMessages';
import {Standort} from "../../types/standort.types";
import {editStandort} from "../../util/StandortUtil";

export interface EditStandortProps {
    abteilungId: string
    standort: Standort
    standortId: string
    onSuccess?: () => void
}

export const EditStandort = forwardRef((props: EditStandortProps, ref) => {
    useImperativeHandle(
        ref,
        () => ({
            saveEditStandort() {
                prepareEditStandort();
            }
        }),
    )

    const { abteilungId, standortId, standort, onSuccess } = props;

    const [form] = Form.useForm<Standort>();

    const prepareEditStandort = async () => {
        try {
            await form.validateFields();
        } catch(validation) {
            //form is not valid
            return;
        }
        try {
            const standort = form.getFieldsValue() as Standort;
            standort.id = standortId;

            await editStandort(abteilungId, standort);
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
                initialValues={standort}
                onValuesChange={() => {
                    const tempStandort = form.getFieldsValue() as Standort;
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
                        placeholder='Standortname'
                    />
                </Form.Item>
                <Form.Item
                    label='Strasse'
                    name='street'
                    rules={[
                        { required: false },
                    ]}
                >
                    <Input
                        placeholder='Strasse'
                    />
                </Form.Item>

                <Form.Item
                    label='Ort'
                    name='city'
                    rules={[
                        { required: false },
                    ]}
                >

                    <Input
                        placeholder='Ort'
                    />
                </Form.Item>
                <Form.Item
                    label='Koordinaten'
                    name='coordinates'
                    rules={[
                        { required: false },
                    ]}
                >

                    <Input
                        placeholder='Koordinaten'
                    />
                </Form.Item>
            </Form>
        }
    </>
})

export const EditStandortButton = (props: EditStandortProps) => {

    const { abteilungId, standortId, standort } = props;

    const editStandortRef = useRef();

    const [isModalVisible, setIsModalVisible] = useState(false);

    return <>
        <Button type='primary' onClick={() => { setIsModalVisible(!isModalVisible) }} icon={<EditOutlined />} />
        <Modal
            title='Stadort bearbeiten'
            visible={isModalVisible}
            onCancel={() => { setIsModalVisible(false) }}
            footer={[
                <Button key='back' onClick={() => { setIsModalVisible(false) }}>
                    Abbrechen
                </Button>,
                <Button key='save'  type='primary' onClick={() => { 
                    if(!editStandortRef || !editStandortRef.current) return;
                    //TODO: typescript
                    (editStandortRef.current as any).saveEditStandort() }}
                >
                    Änderungen speichern
                </Button>
            ]}
        >
            <EditStandort ref={editStandortRef} abteilungId={abteilungId} standortId={standortId} standort={standort} onSuccess={() => { setIsModalVisible(false) }} />
        </Modal>
    </>

}