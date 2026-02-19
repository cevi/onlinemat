import React, {forwardRef, useImperativeHandle, useRef, useState} from 'react';
import {Button, Form, Input, message, Modal} from 'antd';
import {EditOutlined} from '@ant-design/icons';
import {getValidateMessages} from 'util/FormValdationMessages';
import {Standort} from "../../types/standort.types";
import {editStandort} from "../../util/StandortUtil";
import { EditFormHandle } from 'types/form.types';
import { useTranslation } from 'react-i18next';

export interface EditStandortProps {
    abteilungId: string
    standort: Standort
    standortId: string
    onSuccess?: () => void
}

export const EditStandort = forwardRef<EditFormHandle, EditStandortProps>((props, ref) => {
    useImperativeHandle(
        ref,
        () => ({
            save() {
                prepareEditStandort();
            }
        }),
    )

    const { abteilungId, standortId, standort, onSuccess } = props;

    const [form] = Form.useForm<Standort>();
    const { t } = useTranslation();

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
                initialValues={standort}
                onValuesChange={() => {
                    const tempStandort = form.getFieldsValue() as Standort;
                    form.validateFields()

                }}
                validateMessages={getValidateMessages()}
            >
                <Form.Item
                    label={t('standort:form.name')}
                    name='name'
                    rules={[
                        { required: true },
                        { type: 'string', min: 1 },
                    ]}
                >
                    <Input
                        placeholder={t('standort:form.namePlaceholder')}
                    />
                </Form.Item>
                <Form.Item
                    label={t('standort:form.street')}
                    name='street'
                    rules={[
                        { required: false },
                    ]}
                >
                    <Input
                        placeholder={t('standort:form.streetPlaceholder')}
                    />
                </Form.Item>

                <Form.Item
                    label={t('standort:form.city')}
                    name='city'
                    rules={[
                        { required: false },
                    ]}
                >

                    <Input
                        placeholder={t('standort:form.cityPlaceholder')}
                    />
                </Form.Item>
                <Form.Item
                    label={t('standort:form.coordinates')}
                    name='coordinates'
                    rules={[
                        { required: false },
                    ]}
                >

                    <Input
                        placeholder={t('standort:form.coordinatesPlaceholder')}
                    />
                </Form.Item>
            </Form>
        }
    </>
})

export const EditStandortButton = (props: EditStandortProps) => {

    const { abteilungId, standortId, standort } = props;

    const editStandortRef = useRef<EditFormHandle>(null);

    const [isModalVisible, setIsModalVisible] = useState(false);
    const { t } = useTranslation();

    return <>
        <Button type='primary' onClick={() => { setIsModalVisible(!isModalVisible) }} icon={<EditOutlined />} />
        <Modal
            title={t('standort:edit.title')}
            open={isModalVisible}
            onCancel={() => { setIsModalVisible(false) }}
            footer={[
                <Button key='back' onClick={() => { setIsModalVisible(false) }}>
                    {t('common:buttons.cancel')}
                </Button>,
                <Button key='save'  type='primary' onClick={() => { editStandortRef.current?.save() }}>
                    {t('standort:edit.submit')}
                </Button>
            ]}
        >
            <EditStandort ref={editStandortRef} abteilungId={abteilungId} standortId={standortId} standort={standort} onSuccess={() => { setIsModalVisible(false) }} />
        </Modal>
    </>

}