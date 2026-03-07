import {Button, Form, message, Modal, Select, Spin} from "antd";
import {db} from "../../config/firebase/firebase";
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {abteilungenCollection, abteilungenMembersCollection, usersCollection} from "../../config/firebase/collections";
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
        const abteilungId = form.getFieldValue('abteilung');
        const role = form.getFieldValue('role');
        const memberRef = doc(db, abteilungenCollection, abteilungId, abteilungenMembersCollection, uid);

        // Check if already a member (may fail with permission error if staff is not a member of this abteilung)
        try {
            const memberDoc = await getDoc(memberRef);
            if (memberDoc.exists()) {
                message.error(t('navigation:users.addToAbteilung.alreadyMember'));
                return;
            }
        } catch {
            // Permission error reading member doc — proceed with creation
        }

        // Fetch user profile for displayName and email
        const userDoc = await getDoc(doc(db, usersCollection, uid)).catch(() => null);
        const userProfile = userDoc?.data();
        const displayName = userProfile?.displayName || '';

        const member: any = {
            userId: uid,
            role,
            approved: true,
            displayName,
        };
        if (role === 'guest') {
            member.email = userProfile?.email || '';
        }

        await setDoc(memberRef, member)
            .then(() => {
                if (onSuccess) {
                    onSuccess();
                }
            })
            .catch(() => {
                message.error(t('navigation:users.addToAbteilung.error'))
            })
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