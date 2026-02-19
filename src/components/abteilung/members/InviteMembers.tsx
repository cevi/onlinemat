import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { Button, Modal, Form, Select, message } from 'antd';
import { UserAddOutlined } from '@ant-design/icons';
import { httpsCallable } from 'firebase/functions';
import { functions } from 'config/firebase/firebase';
import { Abteilung } from 'types/abteilung.type';
import { groupObjToList } from 'util/GroupUtil';
import { getRoles } from './MemberTable';
import { useTranslation } from 'react-i18next';

export interface InviteMembersProps {
    abteilung: Abteilung;
    onSuccess?: () => void;
}

interface InviteMembersFormValues {
    emails: string[];
    role: string;
    groupIds: string[];
}

interface InviteMembersFormProps extends InviteMembersProps {
    onLoadingChange?: (loading: boolean) => void;
}

interface InviteMembersRef {
    save: () => void;
}

const InviteMembersForm = forwardRef<InviteMembersRef, InviteMembersFormProps>((props, ref) => {
    const { abteilung, onSuccess, onLoadingChange } = props;
    const { t } = useTranslation();
    const [form] = Form.useForm<InviteMembersFormValues>();
    const [loading, setLoading] = useState(false);

    const roles = getRoles(t);
    const groups = groupObjToList(abteilung.groups);

    useImperativeHandle(ref, () => ({
        save: () => form.submit(),
    }));

    const handleSubmit = async (values: InviteMembersFormValues) => {
        if (!values.emails || values.emails.length === 0) {
            message.warning(t('member:invite.noEmail'));
            return;
        }

        setLoading(true);
        onLoadingChange?.(true);
        try {
            const result = await httpsCallable<
                { abteilungId: string; emails: string[]; role: string; groupIds: string[] },
                { created: number; skipped: { email: string; reason: string }[] }
            >(functions, 'createInvitations')({
                abteilungId: abteilung.id,
                emails: values.emails,
                role: values.role,
                groupIds: values.groupIds || [],
            });

            const { created, skipped } = result.data;

            if (skipped.length > 0) {
                message.warning(t('member:invite.partialSuccess', { created, skipped: skipped.length }));
            } else {
                message.success(t('member:invite.success', { count: created }));
            }

            form.resetFields();
            onSuccess?.();
        } catch (err: any) {
            if (err?.code === 'functions/permission-denied') {
                message.error(t('member:invite.permissionError'));
            } else {
                message.error(t('member:invite.error'));
            }
        } finally {
            setLoading(false);
            onLoadingChange?.(false);
        }
    };

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
                role: 'member',
                groupIds: [],
                emails: [],
            }}
        >
            <Form.Item
                label={t('member:invite.emailLabel')}
                name="emails"
                rules={[
                    {
                        validator(_, value) {
                            if (!value || value.length === 0) {
                                return Promise.reject(new Error(t('member:invite.noEmail')));
                            }
                            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                            const invalid = value.filter((v: string) => !emailRegex.test(v));
                            if (invalid.length > 0) {
                                return Promise.reject(new Error(`${invalid.join(', ')}`));
                            }
                            return Promise.resolve();
                        },
                    },
                ]}
                extra={t('member:invite.emailHelp')}
            >
                <Select
                    mode="tags"
                    tokenSeparators={[',', '\n', ' ']}
                    placeholder={t('member:invite.emailPlaceholder')}
                    style={{ width: '100%' }}
                    notFoundContent={null}
                    open={false}
                />
            </Form.Item>

            <Form.Item
                label={t('member:invite.roleLabel')}
                name="role"
                rules={[{ required: true }]}
            >
                <Select>
                    {roles.map(role => (
                        <Select.Option key={role.key} value={role.key}>{role.name}</Select.Option>
                    ))}
                </Select>
            </Form.Item>

            {groups.length > 0 && (
                <Form.Item
                    label={t('member:invite.groupLabel')}
                    name="groupIds"
                >
                    <Select
                        mode="multiple"
                        allowClear
                        placeholder={t('member:invite.groupPlaceholder')}
                        style={{ width: '100%' }}
                    >
                        {groups.map(group => (
                            <Select.Option key={group.id} value={group.id}>
                                {group.name} ({group.type === 'group' ? 'Gruppe' : 'Anlass'})
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>
            )}
        </Form>
    );
});

InviteMembersForm.displayName = 'InviteMembersForm';

export const InviteMembersButton = (props: InviteMembersProps) => {
    const { abteilung } = props;
    const { t } = useTranslation();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const formRef = React.useRef<InviteMembersRef>(null);

    return (
        <>
            <Button
                type="primary"
                icon={<UserAddOutlined />}
                onClick={() => setIsModalVisible(true)}
            >
                {t('member:invite.button')}
            </Button>
            <Modal
                title={t('member:invite.title')}
                open={isModalVisible}
                onCancel={() => { if (!submitting) setIsModalVisible(false); }}
                closable={!submitting}
                maskClosable={!submitting}
                footer={[
                    <Button key="cancel" disabled={submitting} onClick={() => setIsModalVisible(false)}>
                        {t('common:buttons.cancel')}
                    </Button>,
                    <Button key="submit" type="primary" loading={submitting} onClick={() => formRef.current?.save()}>
                        {t('member:invite.submit')}
                    </Button>,
                ]}
            >
                <InviteMembersForm
                    ref={formRef}
                    abteilung={abteilung}
                    onLoadingChange={setSubmitting}
                    onSuccess={() => setIsModalVisible(false)}
                />
            </Modal>
        </>
    );
};
