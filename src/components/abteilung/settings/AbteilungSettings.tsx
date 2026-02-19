import classNames from 'classnames';
import { Button, Col, Form, Image, Input, message, Popconfirm, Row, Switch, Typography, Upload } from 'antd';
import ceviLogoImage from 'assets/onlinemat_logo.png';
import { useNavigate } from 'react-router';
import { Abteilung } from 'types/abteilung.type';
import { useContext, useState } from 'react';
import { auth, db, functions } from 'config/firebase/firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { abteilungenCollection, abteilungenMembersCollection } from 'config/firebase/collections';
import { MembersContext } from 'contexts/AbteilungContexts';
import moduleStyles from '../Abteilung.module.scss'
import { ability } from 'config/casl/ability';
import { slugify } from 'util/FormUtil';
import { Can } from 'config/casl/casl';
import { DeleteOutlined } from '@ant-design/icons';
import { getValidateMessages } from 'util/FormValdationMessages';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from 'hooks/useIsMobile';

export interface AbteilungSettingsProps {
    abteilung: Abteilung
}

export const AbteilungSettings = (props: AbteilungSettingsProps) => {

    const { abteilung } = props;

    const { t } = useTranslation();
    const navigate = useNavigate();
    const isMobile = useIsMobile();

    const [form] = Form.useForm<Abteilung>();
    const [updateLoading, setUpdateLoading] = useState(false);

    const [slug, setSlug] = useState<string>(abteilung.slug);

    const disabled = ability.cannot('update', 'Abteilung');
    const canToggleSearch = ability.can('update', { __caslSubjectType__: 'Material' as const, abteilungId: abteilung.id });

    const [searchVisible, setSearchVisible] = useState<boolean>(abteilung.searchVisible !== false);
    const [searchVisibleLoading, setSearchVisibleLoading] = useState(false);

    const uid = auth.currentUser?.uid;
    const { members } = useContext(MembersContext);
    const currentMember = members.find(m => m.userId === uid);
    const isAdmin = currentMember?.role === 'admin';

    const [notifyOnNewOrder, setNotifyOnNewOrder] = useState<boolean>(currentMember?.notifyOnNewOrder === true);
    const [notifyLoading, setNotifyLoading] = useState(false);

    const toggleNotifyOnNewOrder = async (checked: boolean) => {
        if (!uid) return;
        try {
            setNotifyLoading(true);
            await updateDoc(doc(db, abteilungenCollection, abteilung.id, abteilungenMembersCollection, uid), {
                notifyOnNewOrder: checked
            });
            setNotifyOnNewOrder(checked);
            message.success(t('abteilung:settings.saveSuccess'));
        } catch (ex) {
            message.error(t('common:errors.generic', { error: ex }));
        } finally {
            setNotifyLoading(false);
        }
    };

    const toggleSearchVisible = async (checked: boolean) => {
        try {
            setSearchVisibleLoading(true);
            await updateDoc(doc(db, abteilungenCollection, abteilung.id), {
                searchVisible: checked
            });
            setSearchVisible(checked);
            message.success(t('abteilung:settings.saveSuccess'));
        } catch (ex) {
            message.error(t('common:errors.generic', { error: ex }));
        } finally {
            setSearchVisibleLoading(false);
        }
    };

    const updateAbteilung = async () => {
        if (!abteilung) return;
        try {
            setUpdateLoading(true);
            let slugChanged = false;
            if (abteilung?.slug !== slug) {
                await updateSlug();
                slugChanged = true
            }


            let noDatatToUpdate = false
            if(!form.getFieldsValue().name && !form.getFieldsValue().ceviDBId && !form.getFieldsValue().logoUrl && !form.getFieldsValue().email) {
                noDatatToUpdate = true
            }

            if(!noDatatToUpdate) {
                console.log('do update')
                await updateDoc(doc(db, abteilungenCollection, abteilung.id), {
                    name: form.getFieldsValue().name,
                    ceviDBId: form.getFieldsValue().ceviDBId || null,
                    logoUrl: form.getFieldsValue().logoUrl || null,
                    email: form.getFieldsValue().email || null
                } as Abteilung);
            }
           
            message.success(t('abteilung:settings.saveSuccess'));

            //if slug changed, redirect to new url
            if (slugChanged && slug) {
                navigate(`/abteilungen/${slug}/settings`)
            }

        } catch (ex) {
            message.error(t('common:errors.generic', { error: ex }))
        }
        setUpdateLoading(false);
    }

    const updateSlug = async () => {
        if (!abteilung) return;
        try {
            const slug = form.getFieldsValue().slug;
            await httpsCallable(functions, 'updateSlug')({ abteilungId: abteilung.id, slug });
        } catch (ex) {
            console.error(t('common:errors.generic', { error: ex }))
            throw ex;
        }
    }

    const delteAbteilung = async (ab: Abteilung | undefined) => {
        if (!ab) return;
        try {
            await deleteDoc(doc(db, abteilungenCollection, ab.id));
            message.info(t('abteilung:settings.deleteSuccess', { name: ab.name }))
            navigate('/')
        } catch (ex) {
            message.error(t('common:errors.generic', { error: ex }))
        }
    }

    return <Row gutter={[16, 16]}>
        <Col xs={24} lg={4} style={isMobile ? { textAlign: 'center', marginBottom: 16 } : undefined}>
            <Image
                width={isMobile ? 120 : 200}
                src={abteilung?.logoUrl && abteilung.logoUrl !== '' ? abteilung.logoUrl : `${ceviLogoImage}`}
                preview={false}
            />
        </Col>
        <Col xs={24} lg={20}>
            {canToggleSearch && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                    <Switch
                        checked={searchVisible}
                        onChange={toggleSearchVisible}
                        loading={searchVisibleLoading}
                    />
                    <div>
                        <Typography.Text strong>{t('abteilung:settings.searchVisible')}</Typography.Text>
                        <br />
                        <Typography.Text type="secondary">{t('abteilung:settings.searchVisibleDescription')}</Typography.Text>
                    </div>
                </div>
            )}
            {isAdmin && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                    <Switch
                        checked={notifyOnNewOrder}
                        onChange={toggleNotifyOnNewOrder}
                        loading={notifyLoading}
                    />
                    <div>
                        <Typography.Text strong>{t('abteilung:settings.notifyOnNewOrder')}</Typography.Text>
                        <br />
                        <Typography.Text type="secondary">{t('abteilung:settings.notifyOnNewOrderDescription')}</Typography.Text>
                    </div>
                </div>
            )}
            <Form
                form={form}
                layout='vertical'
                onFinish={updateAbteilung}
                onFinishFailed={() => { }}
                autoComplete='off'
                validateMessages={getValidateMessages()}
                initialValues={abteilung}
            >
                <Row gutter={[16, 0]}>
                    <Col xs={24} sm={12} lg={8}>
                        <Form.Item
                            label={t('abteilung:settings.name')}
                            name='name'
                            rules={[
                                { required: true },
                                { type: 'string', min: 6 },
                            ]}
                        >
                            <Input
                                placeholder={t('abteilung:settings.namePlaceholder')}
                                disabled={disabled || updateLoading}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} lg={8}>
                        <Form.Item
                            label={t('abteilung:settings.slug')}
                            name='slug'
                            tooltip={t('abteilung:settings.slugTooltip')}
                            rules={[
                                { required: true },
                                { type: 'string', min: 3 },
                                {
                                    validator: (rule: any, value: string, cb: (msg?: string) => void) => {
                                        //check for whitespaces
                                        if (value.includes(' ')) {
                                            return cb(t('abteilung:settings.slugNoSpaces'))
                                        }
                                        //Check if contains upper case
                                        if (value.toLowerCase() !== value) {
                                            return cb(t('abteilung:settings.slugLowercase'))
                                        }

                                        //OK
                                        return cb();
                                    }
                                }
                            ]}

                        >
                            <Input
                                placeholder={t('abteilung:settings.slugPlaceholder')}
                                onChange={(val) => {form.setFieldsValue({ slug: slugify(val.currentTarget.value) }); setSlug(val.currentTarget.value)}}
                                disabled={disabled || updateLoading}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} lg={8}>
                        <Form.Item
                            label={t('abteilung:settings.ceviDbId')}
                            name='ceviDBId'
                            rules={[
                                { required: false }
                            ]}
                        >
                            <Input
                                placeholder={t('abteilung:settings.ceviDbIdPlaceholder')}
                                disabled={disabled || updateLoading}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} lg={8}>
                        <Form.Item
                            label={t('abteilung:settings.logoUrl')}
                            name='logoUrl'
                            rules={[
                                { required: false },
                                { type: 'url', warningOnly: true },
                                { type: 'string', min: 6 },
                            ]}
                        >
                            <Input
                                placeholder={t('abteilung:settings.logoUrlPlaceholder')}
                                disabled={disabled || updateLoading}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} lg={8}>
                        <Form.Item
                            label={t('abteilung:settings.email')}
                            name='email'
                            rules={[
                                { type: 'email' },
                            ]}
                        >
                            <Input
                                placeholder={t('abteilung:settings.emailPlaceholder')}
                                disabled={disabled || updateLoading}
                            />
                        </Form.Item>
                    </Col>
                    <Can I='update' this={abteilung}>
                        <Col span={24}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                <Button type='primary' htmlType='submit' disabled={updateLoading}>
                                    {t('abteilung:settings.save')}
                                </Button>
                                <Popconfirm
                                    title={t('abteilung:settings.deleteConfirm')}
                                    onConfirm={() => delteAbteilung(abteilung)}
                                    onCancel={() => { }}
                                    okText={t('common:confirm.yes')}
                                    cancelText={t('common:confirm.no')}
                                >
                                    <Button type='text' danger icon={<DeleteOutlined />} disabled={updateLoading}>
                                        {t('abteilung:settings.delete')}
                                    </Button>
                                </Popconfirm>
                            </div>
                        </Col>
                    </Can>
                </Row>
            </Form>
        </Col>
    </Row>
}
