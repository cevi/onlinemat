import {UserData} from "../../types/user.type";
import React, {forwardRef, useContext, useImperativeHandle, useRef, useState} from "react";
import {AutoComplete, Button, Form, Input, message} from "antd";
import {editUserData} from "../../util/UserUtil";
import {useUser} from "../../hooks/use-user";
import {validateMessages} from "../../util/FormValdationMessages";
import {EditOutlined} from "@ant-design/icons";
import Modal from "antd/lib/modal/Modal";
import {AbteilungenContext} from "../navigation/NavigationMenu";

export interface EditProfileProps {
    userId: string | undefined;
    userData: UserData | undefined;
    onSuccess?: () => void
}

export const EditProfile = forwardRef((props: EditProfileProps, ref) => {
    useImperativeHandle(
        ref,
        () => ({
            saveEditProfile() {
                prepareEditProfile();
            }
        }),
    )

    const {userId, userData, onSuccess} = props;

    const [form] = Form.useForm<UserData>();

    const userState = useUser();

    const abteilungenContext = useContext(AbteilungenContext);
    const abteilungen = abteilungenContext.abteilungen;

    const prepareEditProfile = async () => {
        try {
            await form.validateFields();
        } catch (validation) {
            //form is not valid
            return;
        }
        try {
            const userData = Object.assign(userState.appUser?.userData, form.getFieldsValue());
            userData.id = userId || '';
            await editUserData(userState.appUser?.firebaseUser?.uid, userData);
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
        {
            <Form
                form={form}
                initialValues={userData}
                onValuesChange={() => {
                    const tempUserData = form.getFieldsValue() as UserData;
                    form.validateFields()

                }}
                validateMessages={validateMessages}
            >
                <Form.Item
                    label='Vollständiger Name'
                    name='name'
                    rules={[
                        {required: true},
                        {type: 'string', min: 1},
                    ]}
                >
                    <Input
                        placeholder='Name'
                    />
                </Form.Item>
                <Form.Item
                    label='Vorname'
                    name='given_name'
                    rules={[
                        {required: true},
                        {type: 'string', min: 1},
                    ]}
                >
                    <Input
                        placeholder='Vorname'
                    />
                </Form.Item>
                <Form.Item
                    label='Nachname'
                    name='family_name'
                    rules={[
                        {required: true},
                        {type: 'string', min: 1},
                    ]}
                >
                    <Input
                        placeholder='Nachname'
                    />
                </Form.Item>
                <Form.Item
                    label='Nickname'
                    name='nickname'
                    rules={[
                        {required: true},
                        {type: 'string', min: 1},
                    ]}
                >
                    <Input
                        placeholder='Nickname'
                    />
                </Form.Item>
                <Form.Item
                    label='Email'
                    name='email'
                    rules={[
                        {required: true},
                        {type: 'string', min: 1},
                    ]}
                >
                    <Input
                        placeholder='Email'
                    />
                </Form.Item>
                <Form.Item
                    label='Standard Abteilung'
                    name='defaultAbteilung'
                    rules={[
                        {type: 'string', min: 1},
                    ]}
                >
                    <AutoComplete
                        dataSource={abteilungen.map(a => a.slug ? a.slug : a.id)}
                    />

                </Form.Item>
            </Form>
        }
    </>
})

export const EditProfileButton = (props: EditProfileProps) => {

    const {userId, userData} = props;
    const editProfileRef = useRef();
    const [isModalVisible, setIsModalVisible] = useState(false);

    return <>
        <Button type='primary' onClick={() => {
            setIsModalVisible(!isModalVisible)
        }} icon={<EditOutlined/>}/>
        <Modal
            title='Profil bearbeiten'
            visible={isModalVisible}
            onCancel={() => {
                setIsModalVisible(false)
            }}
            footer={[
                <Button key='back' onClick={() => {
                    setIsModalVisible(false)
                }}>
                    Abbrechen
                </Button>,
                <Button key='save' type='primary' onClick={() => {
                    if (!editProfileRef || !editProfileRef.current) return;
                    //TODO: typescript
                    (editProfileRef.current as any).saveEditProfile()
                }}
                >
                    Änderungen speichern
                </Button>
            ]}
        >
            <EditProfile ref={editProfileRef} userId={userId} userData={userData} onSuccess={() => {
                setIsModalVisible(false)
            }}/>
        </Modal>
    </>

}
