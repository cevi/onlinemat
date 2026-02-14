import React, { useState, useEffect } from 'react';
import { Button, Input, message, Modal, Form, Radio, Transfer } from 'antd';
import { db } from 'config/firebase/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { abteilungenCategoryCollection, abteilungenCollection } from 'config/firebase/collections';
import { getValidateMessages } from 'util/FormValdationMessages';
import { Abteilung, AbteilungMember, AbteilungMemberUserData } from 'types/abteilung.type';
import { Group } from 'types/group.types';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

export interface AddGroupProps {
    abteilung: Abteilung
    members: AbteilungMemberUserData[]
    onSuccess?: () => void
}

export const AddGroup = (props: AddGroupProps) => {

    const { abteilung, members, onSuccess } = props;

    const { t } = useTranslation();
    const [form] = Form.useForm<Group>();

    const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
    const [targetKeys, setTargetKeys] = useState<string[]>([]);

    const groups = abteilung.groups || {};

    const addGroup = async () => {
        try {
            let generatedId = '';
            do {
                //this is just a basic 'random' time based id. It's just used to make the group unique
                generatedId = (new Date()).getTime().toString(36) + Math.random().toString(36).slice(6);

            } while(!!groups[generatedId])

            const groupToAdd = groups;
            groupToAdd[generatedId] = {
                ...form.getFieldsValue(),
                createdAt: dayjs().toDate()
            }

            await updateDoc(doc(db, abteilungenCollection, abteilung.id), {
                groups: groupToAdd
            })
            message.success(t('group:add.success', { type: form.getFieldValue('type') === 'group' ? t('group:form.typeGroup') : t('group:form.typeEvent'), name: form.getFieldValue('name') }));
            setSelectedKeys([])
            setTargetKeys([])
            form.resetFields();
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
        <Form
            form={form}
            validateMessages={getValidateMessages()}
            onFinish={addGroup}
            initialValues={{
                type: 'group'
            }}
        >

            <Form.Item
                label={t('group:form.name')}
                name='name'
                rules={[
                    { required: true },
                    { type: 'string', min: 1 },
                ]}
            >
                <Input
                    placeholder={t('group:form.namePlaceholder')}
                />
            </Form.Item>
            <Form.Item
                label={t('group:form.type')}
                name='type'
                rules={[
                    { required: true },
                ]}
            >
                <Radio.Group>
                    <Radio value='group'>{t('group:form.typeGroup')}</Radio>
                    <Radio value='event'>{t('group:form.typeEvent')}</Radio>
                </Radio.Group>
            </Form.Item>
            <Form.Item
                label={t('group:form.members')}
                name='members'
                rules={[
                    { required: true },
                    ({ getFieldValue }) => ({
                        validator(_, value) {
                          if ((getFieldValue('members') as string[]).length >= 1) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error(t('group:form.membersMin')));
                        },
                      }),
                ]}
            >
                <Transfer
                    dataSource={members.map(m => {
                        return {...m, key: m.id}})
                    }

                    showSearch
                    targetKeys={targetKeys}
                    selectedKeys={selectedKeys}
                    onChange={(nextTargetKeys, direction, moveKeys) => {
                        setTargetKeys(nextTargetKeys);
                        form.setFieldsValue({ members: nextTargetKeys });
                    }}
                    onSelectChange={(sourceSelectedKeys, targetSelectedKeys) => {
                        setSelectedKeys([...sourceSelectedKeys, ...targetSelectedKeys])
                    }}
                    filterOption={(inputValue, option) => option.name.toLowerCase().indexOf(inputValue.toLowerCase()) > -1}
                    render={item => item.displayName}
                />
            </Form.Item>
            <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
                <Button type='primary' htmlType='submit'>
                    {t('group:add.submit')}
                </Button>
            </Form.Item>
        </Form>
    </>
}

export const AddGroupButton = (props: AddGroupProps) => {

    const { abteilung, members } = props;

    const { t } = useTranslation();
    const [isModalVisible, setIsModalVisible] = useState(false);

    return <>
        <Button type='primary' onClick={() => { setIsModalVisible(!isModalVisible) }}>
            {t('group:add.button')}
        </Button>
        <Modal
            title={t('group:add.title')}
            open={isModalVisible}
            onCancel={() => { setIsModalVisible(false) }}
            footer={[
                <Button key='back' onClick={() => { setIsModalVisible(false) }}>
                    {t('common:buttons.cancel')}
                </Button>,
            ]}
        >
            <AddGroup abteilung={abteilung} members={members} onSuccess={() => { setIsModalVisible(false) }} />
        </Modal>
    </>

}
