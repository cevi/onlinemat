import React, { useState, useEffect } from 'react';
import { Button, Input, message, Modal, Form, Radio, Transfer } from 'antd';
import { db } from 'config/firebase/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { abteilungenCategoryCollection, abteilungenCollection } from 'config/firebase/collections';
import { getValidateMessages } from 'util/FormValdationMessages';
import { Abteilung, AbteilungMember, AbteilungMemberUserData } from 'types/abteilung.type';
import { Group } from 'types/group.types';
import { EditOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';

export interface EditGroupProps {
    abteilung: Abteilung
    group: Group
    members: AbteilungMemberUserData[]
    onSuccess?: () => void
}

export const EditGroup = (props: EditGroupProps) => {

    const { abteilung, group, members, onSuccess } = props;

    const { t } = useTranslation();
    const [form] = Form.useForm<Group>();

    const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
    const [targetKeys, setTargetKeys] = useState<string[]>(group.members || []);

    const groups = abteilung.groups || [];

    const editGroup = async () => {
        try {

            const filterGroups = groups;

            filterGroups[group.id] =  {
                ...form.getFieldsValue(),
                createdAt: group.createdAt
            }


            await updateDoc(doc(db, abteilungenCollection, abteilung.id), {
                groups: filterGroups
            })
            message.success(t('group:edit.success', { type: form.getFieldValue('type') === 'group' ? t('group:form.typeGroup') : t('group:form.typeEvent'), name: form.getFieldValue('name') }));
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
            initialValues={group}
            validateMessages={getValidateMessages()}
            onFinish={editGroup}
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
                        return { ...m, key: m.id }
                    })
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
                    {t('group:edit.submit')}
                </Button>
            </Form.Item>
        </Form>
    </>
}

export const EditGroupButton = (props: EditGroupProps) => {

    const { abteilung, group, members } = props;

    const { t } = useTranslation();
    const [isModalVisible, setIsModalVisible] = useState(false);

    return <>
        <Button type='primary' onClick={() => { setIsModalVisible(!isModalVisible) }} icon={<EditOutlined />} />
        <Modal
            title={t('group:edit.title')}
            open={isModalVisible}
            onCancel={() => { setIsModalVisible(false) }}
            footer={[
                <Button key='back' onClick={() => { setIsModalVisible(false) }}>
                    {t('common:buttons.cancel')}
                </Button>,
            ]}
        >
            <EditGroup abteilung={abteilung} members={members} group={group} onSuccess={() => { setIsModalVisible(false) }} />
        </Modal>
    </>

}


export const deleteGroup = async (abteilung: Abteilung, group: Group, t: TFunction) => {
    try {

        const { [group.id]: unused, ...filterGroups } = abteilung.groups


        await updateDoc(doc(db, abteilungenCollection, abteilung.id), {
            groups: filterGroups
        })
        message.success(t('group:delete.success', { type: group.type === 'group' ? t('group:form.typeGroup') : t('group:form.typeEvent'), name: group.name }));
    } catch (ex) {
        message.error(t('common:errors.generic', { error: ex }))
    }

}
