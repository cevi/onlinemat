import React, { useState, useEffect } from 'react';
import { Button, Input, message, Form, Radio, Transfer } from 'antd';
import Modal from 'antd/lib/modal/Modal';
import { firestore } from 'config/firebase/firebase';
import { abteilungenCategoryCollection, abteilungenCollection } from 'config/firebase/collections';
import { validateMessages } from 'util/FormValdationMessages';
import { AbteilungMember, AbteilungMemberUserData } from 'types/abteilung.type';
import { Group } from 'types/group.types';

export interface AddGroupProps {
    abteilungId: string
    members: AbteilungMemberUserData[]
    onSuccess?: () => void
}

export const AddGroup = (props: AddGroupProps) => {

    const { abteilungId, members, onSuccess } = props;

    const [form] = Form.useForm<Group>();

    const [addMembers, setAddMembers] = useState<string[]>([]);


    const addGroup = async () => {
        try {
            const response = await firestore().collection(abteilungenCollection).doc(abteilungId).collection(abteilungenCategoryCollection).add(form.getFieldsValue() as Group)
            if (response.id) {
                message.success(`${form.getFieldValue('type')} ${form.getFieldValue('name')} erfolgreich erstellt`);
                form.resetFields();
                if (onSuccess) {
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

            >
                <Transfer
                    dataSource={members}
                    showSearch
                    targetKeys={addMembers}
                    onChange={(e) => setAddMembers(e)}
                    onSearch={(dir, value) => {
                        console.log('search:', dir, value);
                    }}
                    filterOption={(inputValue, option) => option.name.indexOf(inputValue) > -1}
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

    const { abteilungId, members } = props;

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
            <AddGroup abteilungId={abteilungId} members={members} onSuccess={() => { setIsModalVisible(false) }} />
        </Modal>
    </>

}
