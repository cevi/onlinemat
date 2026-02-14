import React, { useState } from 'react';
import { Button, Select, message, Form, Spin } from 'antd';
import Modal from 'antd/lib/modal/Modal';
import { functions } from 'config/firebase/firebase';
import { httpsCallable } from 'firebase/functions';
import { validateMessages } from 'util/FormValdationMessages';
import { AbteilungMember } from 'types/abteilung.type';
import { roles } from '../members/MemberTable';

export interface JoinAbteilungProps {
    abteilungId: string
    abteilungName?: string
    onSuccess?: () => void
}

export const JoinAbteilung = (props: JoinAbteilungProps) => {

    const { abteilungId, abteilungName, onSuccess } = props;

    const { Option } = Select;

    const [form] = Form.useForm<AbteilungMember['role']>();

    const [loading, setLoading] = useState(false);

    const joinAbteilung = async () => {
        try {
            setLoading(true)
            const role = form.getFieldValue('role');
            await httpsCallable(functions, 'joinAbteilung')({ abteilungId, role });
            setLoading(false)
            message.success(`Anfrage an ${abteilungName} erfolgreich gesendet`)
            form.resetFields();
            if(onSuccess) {
                onSuccess()
            }
        } catch(ex) {
            setLoading(false)
            message.error(`Es ist ein Fehler aufgetreten: ${ex}`)
        }
        
    }

    return <>
            <Form
                form={form}
                validateMessages={validateMessages}
                onFinish={joinAbteilung}
                initialValues={{ role: 'member' }}
            >

                <Form.Item
                    label='Rolle'
                    name='role'
                    rules={[
                        { required: true }
                    ]}
                >
                    <Select key={`joinRoleSelection`} defaultValue='member'>
                        {
                            roles.map(role => <Option key={`join_role_${role.key}`} value={role.key}>{role.name}</Option>)
                        }
                    </Select>
                </Form.Item>
                <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
                    <Button type='primary' htmlType='submit' disabled={loading}>
                        Beitritt anfragen
                    </Button>
                </Form.Item>

                {
                    loading && <Form.Item wrapperCol={{ offset: 11, span: 16 }}><Spin/></Form.Item>
                }

            </Form>
    </>
}

export const JoinAbteilungButton = (props: JoinAbteilungProps) => {

    const { abteilungId, abteilungName } = props;

    const [isModalVisible, setIsModalVisible] = useState(false);

    return <>
        <Button type='primary' onClick={() => { setIsModalVisible(!isModalVisible) }}>
            Beitreten
        </Button>
        <Modal 
            title={`Abteilung ${abteilungName} beitreten`}
            open={isModalVisible}
            onCancel={() => { setIsModalVisible(false) }}
            footer={[
                <Button key='back' onClick={() => { setIsModalVisible(false) }}>
                  Abbrechen
                </Button>,
              ]}
        >
            <JoinAbteilung abteilungId={abteilungId} abteilungName={abteilungName} onSuccess={()=> { setIsModalVisible(false)}}/>
        </Modal>
    </>

}
