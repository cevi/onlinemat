import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { Button, Input, message, Modal, Form, Radio, Select } from 'antd';
import { db } from 'config/firebase/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { abteilungenCollection } from 'config/firebase/collections';
import { getValidateMessages } from 'util/FormValdationMessages';
import { Abteilung, AbteilungMemberUserData } from 'types/abteilung.type';
import { Group } from 'types/group.types';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

export interface AddGroupProps {
    abteilung: Abteilung
    members: AbteilungMemberUserData[]
    onSuccess?: () => void
}

export interface AddGroupRef {
    save: () => void
}

export const AddGroup = forwardRef<AddGroupRef, AddGroupProps>((props, ref) => {

    const { abteilung, members, onSuccess } = props;

    const { t } = useTranslation();
    const [form] = Form.useForm<Group>();

    const groups = abteilung.groups || {};

    useImperativeHandle(ref, () => ({
        save: () => form.submit()
    }));

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

    return <Form
        form={form}
        layout="vertical"
        validateMessages={getValidateMessages()}
        onFinish={addGroup}
        initialValues={{
            type: 'group',
            members: [],
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
            <Input placeholder={t('group:form.namePlaceholder')} />
        </Form.Item>

        <Form.Item
            label={t('group:form.type')}
            name='type'
            rules={[{ required: true }]}
        >
            <Radio.Group optionType="button" buttonStyle="solid">
                <Radio.Button value='group'>{t('group:form.typeGroup')}</Radio.Button>
                <Radio.Button value='event'>{t('group:form.typeEvent')}</Radio.Button>
            </Radio.Group>
        </Form.Item>

        <Form.Item
            label={t('group:form.members')}
            name='members'
            rules={[
                { required: true },
                ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (value && value.length >= 1) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error(t('group:form.membersMin')));
                    },
                  }),
            ]}
        >
            <Select
                mode='multiple'
                showSearch
                allowClear
                style={{ width: '100%' }}
                placeholder={t('group:form.membersPlaceholder')}
                optionFilterProp="children"
            >
                {members.map(m => (
                    <Select.Option key={m.id} value={m.id}>{m.displayName}</Select.Option>
                ))}
            </Select>
        </Form.Item>
    </Form>
});

AddGroup.displayName = 'AddGroup';

export const AddGroupButton = (props: AddGroupProps) => {

    const { abteilung, members } = props;

    const { t } = useTranslation();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const addGroupRef = React.useRef<AddGroupRef>(null);

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
                <Button key='submit' type='primary' onClick={() => addGroupRef.current?.save()}>
                    {t('group:add.submit')}
                </Button>,
            ]}
        >
            <AddGroup ref={addGroupRef} abteilung={abteilung} members={members} onSuccess={() => { setIsModalVisible(false) }} />
        </Modal>
    </>

}
