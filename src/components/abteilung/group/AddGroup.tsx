import React, { useState, useEffect } from 'react';
import { Button, Input, message, Form, Radio, Transfer } from 'antd';
import Modal from 'antd/lib/modal/Modal';
import { firestore } from 'config/firebase/firebase';
import { abteilungenCategoryCollection, abteilungenCollection } from 'config/firebase/collections';
import { validateMessages } from 'util/FormValdationMessages';
import { Abteilung, AbteilungMember, AbteilungMemberUserData } from 'types/abteilung.type';
import { Group } from 'types/group.types';

export interface AddGroupProps {
    abteilungId: string
    abteilung: Abteilung
    members: AbteilungMemberUserData[]
    onSuccess?: () => void
}

export const AddGroup = (props: AddGroupProps) => {

    const { abteilungId, abteilung, members, onSuccess } = props;

    const [form] = Form.useForm<Group>();

    const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
    const [targetKeys, setTargetKeys] = useState<string[]>([]);

    const groups = abteilung.groups || [];

    const addGroup = async () => {
        try {
            let generatedId = '';
            do {
                //this is just a basic "random" time based id. It's just used to make the group unique
                generatedId = (new Date()).getTime().toString(36) + Math.random().toString(36).slice(6);

            } while(!!groups.find(gr => gr.id === generatedId))

            await firestore().collection(abteilungenCollection).doc(abteilungId).update({
                groups: [...groups, {
                    ...form.getFieldsValue(),
                    id: generatedId
                }]
            })
            message.success(`${form.getFieldValue('type') === 'group' ? 'Gruppe' : 'Anlass'} ${form.getFieldValue('name')} erfolgreich erstellt`);
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
            validateMessages={validateMessages}
            onFinish={addGroup}
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
                <Button type="primary" htmlType="submit">
                    Gruppe/Anlass hinzufügen
                </Button>
            </Form.Item>
        </Form>
    </>
}

export const AddGroupButton = (props: AddGroupProps) => {

    const { abteilungId, abteilung, members } = props;

    const [isModalVisible, setIsModalVisible] = useState(false);

    return <>
        <Button type="primary" onClick={() => { setIsModalVisible(!isModalVisible) }}>
            Gruppe hinzufügen
        </Button>
        <Modal
            title="Gruppe/Anlass hinzufügen"
            visible={isModalVisible}
            onCancel={() => { setIsModalVisible(false) }}
            footer={[
                <Button key="back" onClick={() => { setIsModalVisible(false) }}>
                    Abbrechen
                </Button>,
            ]}
        >
            <AddGroup abteilungId={abteilungId} abteilung={abteilung} members={members} onSuccess={() => { setIsModalVisible(false) }} />
        </Modal>
    </>

}
