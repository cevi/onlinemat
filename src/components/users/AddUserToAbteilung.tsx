import {Button, Form, message, Modal, Select, Spin} from "antd";
import {db} from "../../config/firebase/firebase";
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {abteilungenCollection, abteilungenMembersCollection} from "../../config/firebase/collections";
import React, {useContext, useState} from "react";
import {AbteilungenContext} from "../navigation/NavigationMenu";
import {getRoles} from "../abteilung/members/MemberTable";
import { useTranslation } from 'react-i18next';
import { AbteilungMember } from 'types/user.type';

export interface EditAbteilungMemberProps {
    uid: string
    onSuccess?: () => void
    size?: 'small' | 'middle' | 'large'
}

export const AddUserToAbteilung = (props: EditAbteilungMemberProps) => {

    const {uid, onSuccess} = props;

    const { t } = useTranslation();
    const roles = getRoles(t);
    const [form] = Form.useForm<AbteilungMember>();

    const abteilungenContext = useContext(AbteilungenContext);
    const abteilungen = abteilungenContext.abteilungen;
    const abtielungenLoading = abteilungenContext.loading;

    const addUserToAbteilung = async () => {
        const userRef = doc(db, abteilungenCollection, form.getFieldValue('abteilung'), abteilungenMembersCollection, uid)
        const memberDoc = await getDoc(userRef);
        if (memberDoc.exists()) {
            message.error(t('navigation:users.addToAbteilung.alreadyMember'));
        } else {
            const member: AbteilungMember = {
                userId: uid,
                role: form.getFieldValue('role'),
                approved: true,
            }
            await setDoc(doc(db, abteilungenCollection, form.getFieldValue('abteilung'), abteilungenMembersCollection, uid), member)
                .then(() => {
                    if (onSuccess) {
                        onSuccess();
                    }
                })
                .catch(() => {
                    message.error(t('navigation:users.addToAbteilung.error'))
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
                        label={t('navigation:users.addToAbteilung.abteilungLabel')}
                        name='abteilung'
                        rules={[
                            {required: true},
                            {type: 'string', min: 1},
                        ]}
                    >
                        <Select
                            showSearch
                            placeholder={t('navigation:users.addToAbteilung.abteilungPlaceholder')}
                            optionFilterProp='children'
                            options={abteilungen.map((a) => ({
                                value: a.id,
                                label: a.name,
                            })).sort((a, b) => a.label.localeCompare(b.label))}
                        />
                    </Form.Item>
                    <Form.Item
                        label={t('navigation:users.addToAbteilung.roleLabel')}
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
                            {t('navigation:users.addToAbteilung.submit')}
                        </Button>
                    </Form.Item>
                </Form>
            </>
        }
    </>
}

export const AddUserToAbteilungButton = (props: EditAbteilungMemberProps) => {
    const {uid, size} = props;

    const [isModalVisible, setIsModalVisible] = useState(false);
    const { t } = useTranslation();

    return <>
        <Button type='primary' size={size} onClick={() => setIsModalVisible(!isModalVisible)}>
            {t('navigation:users.addToAbteilung.button')}
        </Button>
        <Modal
            title={t('navigation:users.addToAbteilung.title')}
            open={isModalVisible}
            onCancel={() => setIsModalVisible(false)}
            footer={[
                <Button key='back' onClick={() => setIsModalVisible(false)}>
                    {t('common:buttons.cancel')}
                </Button>,
            ]}
        >
            <AddUserToAbteilung uid={uid} onSuccess={() => {
                message.success(t('navigation:users.addToAbteilung.success'))
                setIsModalVisible(false)
            }}/>
        </Modal>
    </>

}