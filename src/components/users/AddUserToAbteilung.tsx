import {Button, Form, message, Select, Spin} from "antd";
import {firestore} from "../../config/firebase/firebase";
import {abteilungenCollection, abteilungenMembersCollection} from "../../config/firebase/collections";
import React, {useContext, useState} from "react";
import {AbteilungenContext} from "../navigation/NavigationMenu";
import {roles} from "../abteilung/members/MemberTable";
import {useForm} from "antd/es/form/Form";
import Modal from "antd/lib/modal/Modal";
import { AbteilungMember } from 'types/user.type';

export interface EditAbteilungMemberProps {
    uid: string
    onSuccess?: () => void
}

export const AddUserToAbteilung = (props: EditAbteilungMemberProps) => {

    const {uid, onSuccess} = props;

    const [form] = useForm<AbteilungMember>();

    const abteilungenContext = useContext(AbteilungenContext);
    const abteilungen = abteilungenContext.abteilungen;
    const abtielungenLoading = abteilungenContext.loading;

    const addUserToAbteilung = async () => {
        const userRef = firestore().collection(abteilungenCollection).doc(form.getFieldValue('abteilung')).collection(abteilungenMembersCollection).doc(uid)
        const memberDoc = await userRef.get();
        if (memberDoc.exists) {
            message.error('Dieser Benutzer ist bereits mitglied dieser Abteilung');
        } else {
            const member: AbteilungMember = {
                userId: uid,
                role: form.getFieldValue('role'),
                approved: true,
            }
            await firestore().collection(abteilungenCollection).doc(form.getFieldValue('abteilung')).collection(abteilungenMembersCollection).doc(uid).set(member)
                .then(() => {
                    if (onSuccess) {
                        onSuccess();
                    }
                })
                .catch(() => {
                    message.error('Der Benutzer konnte nicht zur Abteilung hinzugefügt werden!')
                })
        }
    }

    return <>
        {
            abtielungenLoading ? <Spin/> : <>
                <Form
                    form={form}
                    initialValues={{
                        role: 'member'
                    } as Partial<AbteilungMember>}
                    onFinish={addUserToAbteilung}>
                    <Form.Item
                        label='Abteilung'
                        name='abteilung'
                        rules={[
                            {required: true},
                            {type: 'string', min: 1},
                        ]}
                    >
                        <Select
                            showSearch
                            placeholder='Abteilung'
                            optionFilterProp='children'
                            options={[{label: 'Keine Abteilung', value: null} as any, ...abteilungen.map((a) => {
                                return {
                                    value: a.id,
                                    label: a.name,
                                }
                            }).sort((a, b) => a.label.localeCompare(b.label))]}
                        >
                        </Select>
                    </Form.Item>
                    <Form.Item
                        label='Rolle'
                        name='role'
                        rules={[
                            {required: true}
                        ]}
                    >
                        <Select key='role'>
                            {
                                roles.map(role => <Select.Option key={role.key}
                                                                 value={role.key}>{role.name}</Select.Option>)
                            }
                        </Select>
                    </Form.Item>
                    <Form.Item wrapperCol={{offset: 8, span: 16}}>
                        <Button type='primary' htmlType='submit'>
                            Zu Abteilung hinzufügen
                        </Button>
                    </Form.Item>
                </Form>
            </>
        }
    </>
}

export const AddUserToAbteilungButton = (props: EditAbteilungMemberProps) => {
    const {uid} = props;

    const [isModalVisible, setIsModalVisible] = useState(false);

    return <>
        <Button type='primary' onClick={() => setIsModalVisible(!isModalVisible)}>
            Benutzer zu Abteilung hinzufügen
        </Button>
        <Modal
            title='Benutzer zu Abteilung hinzufügen'
            visible={isModalVisible}
            onCancel={() => setIsModalVisible(false)}
            footer={[
                <Button key='back' onClick={() => setIsModalVisible(false)}>
                    Abbrechen
                </Button>,
            ]}
        >
            <AddUserToAbteilung uid={uid} onSuccess={() => {
                message.success('Der Benutzer wurde erfolgreich zur Abteilung hinzugefügt')
                setIsModalVisible(false)
            }}/>
        </Modal>
    </>

}