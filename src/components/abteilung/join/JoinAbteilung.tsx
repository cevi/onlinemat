import React, { useState } from 'react';
import { Button, Modal, Select, message, Form, Spin } from 'antd';
import { functions } from 'config/firebase/firebase';
import { httpsCallable } from 'firebase/functions';
import { getValidateMessages } from 'util/FormValdationMessages';
import { AbteilungMember } from 'types/abteilung.type';
import { getRoles } from '../members/MemberTable';
import { useTranslation } from 'react-i18next';

export interface JoinAbteilungProps {
    abteilungId: string
    abteilungName?: string
    onSuccess?: () => void
}

export const JoinAbteilung = (props: JoinAbteilungProps) => {

    const { abteilungId, abteilungName, onSuccess } = props;

    const { t } = useTranslation();
    const roles = getRoles(t);
    const { Option } = Select;

    const [form] = Form.useForm<AbteilungMember['role']>();

    const [loading, setLoading] = useState(false);

    const joinAbteilung = async () => {
        try {
            setLoading(true)
            const role = form.getFieldValue('role');
            await httpsCallable(functions, 'joinAbteilung')({ abteilungId, role });
            setLoading(false)
            message.success(t('abteilung:join.success', { name: abteilungName }))
            form.resetFields();
            if(onSuccess) {
                onSuccess()
            }
        } catch(ex) {
            setLoading(false)
            message.error(t('common:errors.generic', { error: ex }))
        }
        
    }

    return <>
            <Form
                form={form}
                validateMessages={getValidateMessages()}
                onFinish={joinAbteilung}
                initialValues={{ role: 'member' }}
            >

                <Form.Item
                    label={t('abteilung:join.roleLabel')}
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
                        {t('abteilung:join.submit')}
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

    const { t } = useTranslation();
    const [isModalVisible, setIsModalVisible] = useState(false);

    return <>
        <Button type='primary' onClick={() => { setIsModalVisible(!isModalVisible) }}>
            {t('abteilung:join.button')}
        </Button>
        <Modal 
            title={t('abteilung:join.title', { name: abteilungName })}
            open={isModalVisible}
            onCancel={() => { setIsModalVisible(false) }}
            footer={[
                <Button key='back' onClick={() => { setIsModalVisible(false) }}>
                  {t('common:buttons.cancel')}
                </Button>,
              ]}
        >
            <JoinAbteilung abteilungId={abteilungId} abteilungName={abteilungName} onSuccess={()=> { setIsModalVisible(false)}}/>
        </Modal>
    </>

}
