import React, { useState, useEffect } from 'react';
import { Button, Input, message, Form, Radio, Transfer } from 'antd';
import Modal from 'antd/lib/modal/Modal';
import { firestore } from 'config/firebase/firebase';
import { abteilungenCategoryCollection, abteilungenCollection } from 'config/firebase/collections';
import { validateMessages } from 'util/FormValdationMessages';
import { Abteilung, AbteilungMember, AbteilungMemberUserData } from 'types/abteilung.type';
import { Group } from 'types/group.types';
import { EditOutlined } from '@ant-design/icons';

export interface EditGroupProps {
    abteilung: Abteilung
    group: Group
    members: AbteilungMemberUserData[]
    onSuccess?: () => void
}

export const EditGroup = (props: EditGroupProps) => {

    const { abteilung, group, members, onSuccess } = props;

    const [form] = Form.useForm<Group>();

    const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
    const [targetKeys, setTargetKeys] = useState<string[]>(group.members || []);

    const groups = abteilung.groups || [];

    const editGroup = async () => {
        try {

            let filterGroups = groups.filter(g => g.id !== group.id);


            await firestore().collection(abteilungenCollection).doc(abteilung.id).update({
                groups: [...filterGroups, {
                    ...form.getFieldsValue(),
                    id: group.id
                }]
            })
            message.success(`${form.getFieldValue('type') === 'group' ? 'Gruppe' : 'Anlass'} ${form.getFieldValue('name')} erfolgreich bearbeitet`);
            setSelectedKeys([])
            setTargetKeys([])
            form.resetFields();
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
        <Form
            form={form}
            initialValues={group}
            validateMessages={validateMessages}
            onFinish={editGroup}
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
                    placeholder="Name"
                />
            </Form.Item>
            <Form.Item
                label="Type"
                name="type"
                rules={[
                    { required: true },
                ]}
            >
                <Radio.Group>
                    <Radio value='group'>Gruppe</Radio>
                    <Radio value='event'>Anlass</Radio>
                </Radio.Group>
            </Form.Item>
            <Form.Item
                label='Mitglieder'
                name='members'
                rules={[
                    { required: true },
                    ({ getFieldValue }) => ({
                        validator(_, value) {
                            if ((getFieldValue('members') as string[]).length >= 1) {
                                return Promise.resolve();
                            }
                            return Promise.reject(new Error('Du must mindestens 1 Mitglied auswählen'));
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
                <Button type="primary" htmlType="submit">
                    Gruppe/Anlass hinzufügen
                </Button>
            </Form.Item>
        </Form>
    </>
}

export const EditGroupButton = (props: EditGroupProps) => {

    const { abteilung, group, members } = props;

    const [isModalVisible, setIsModalVisible] = useState(false);

    return <>
        <Button type="primary" onClick={() => { setIsModalVisible(!isModalVisible) }} icon={<EditOutlined />} />
        <Modal
            title="Gruppe/Anlass bearbeiten"
            visible={isModalVisible}
            onCancel={() => { setIsModalVisible(false) }}
            footer={[
                <Button key="back" onClick={() => { setIsModalVisible(false) }}>
                    Abbrechen
                </Button>,
            ]}
        >
            <EditGroup abteilung={abteilung} members={members} group={group} onSuccess={() => { setIsModalVisible(false) }} />
        </Modal>
    </>

}


export const deleteGroup = async (abteilung: Abteilung, group: Group) => {
    try {

        let filterGroups = abteilung.groups.filter(g => g.id !== group.id);


        await firestore().collection(abteilungenCollection).doc(abteilung.id).update({
            groups: [...filterGroups]
        })
        message.success(`${group.type === 'group' ? 'Gruppe' : 'Anlass'} ${group.name} erfolgreich gelöscht`);
    } catch (ex) {
        message.error(`Es ist ein Fehler aufgetreten: ${ex}`)
    }

}
