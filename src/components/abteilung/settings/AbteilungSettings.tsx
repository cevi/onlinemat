import classNames from 'classnames';
import { Button, Col, Form, Image, Input, message, Popconfirm, Row, Upload } from 'antd';
import ceviLogoImage from 'assets/onlinemat_logo.png';
import { useNavigate } from 'react-router';
import { Abteilung } from 'types/abteilung.type';
import { useContext, useState } from 'react';
import { db, functions } from 'config/firebase/firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { abteilungenCollection, abteilungenMaterialsCollection } from 'config/firebase/collections';
import moduleStyles from '../Abteilung.module.scss'
import { ability } from 'config/casl/ability';
import { slugify } from 'util/FormUtil';
import { Can } from 'config/casl/casl';
import { DeleteOutlined } from '@ant-design/icons';
import { validateMessages } from 'util/FormValdationMessages';

export interface AbteilungSettingsProps {
    abteilung: Abteilung
}

export const AbteilungSettings = (props: AbteilungSettingsProps) => {

    const { abteilung } = props;

    const navigate = useNavigate();

    const [form] = Form.useForm<Abteilung>();
    const [updateLoading, setUpdateLoading] = useState(false);

    const [slug, setSlug] = useState<string>(abteilung.slug);

    const disabled = ability.cannot('update', 'Abteilung');
    

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
           
            message.success(`Änderungen erfolgreich gespeichert`);

            //if slug changed, redirect to new url
            if (slugChanged && slug) {
                navigate(`/abteilungen/${slug}/settings`)
            }

        } catch (ex) {
            message.error(`Es ist ein Fehler aufgetreten: ${ex}`)
        }
        setUpdateLoading(false);
    }

    const updateSlug = async () => {
        if (!abteilung) return;
        try {
            const slug = form.getFieldsValue().slug;
            await httpsCallable(functions, 'updateSlug')({ abteilungId: abteilung.id, slug });
        } catch (ex) {
            console.error(`Es ist ein Fehler aufgetreten: ${ex}`)
            throw ex;
        }
    }

    const delteAbteilung = async (ab: Abteilung | undefined) => {
        if (!ab) return;
        try {
            await deleteDoc(doc(db, abteilungenCollection, ab.id));
            message.info(`${ab.name} erfolgreich gelöscht`)
            navigate('/')
        } catch (ex) {
            message.error(`Es ist ein Fehler aufgetreten: ${ex}`)
        }
    }

    return <Row>
        <div className={classNames(moduleStyles['ceviLogoWrapper'])}>
            <Image
                width={200}
                src={abteilung?.logoUrl && abteilung.logoUrl !== '' ? abteilung.logoUrl : `${ceviLogoImage}`}
                preview={false}
            />
        </div>
        <div style={{ flex: 1 }}>
            <Form
                form={form}
                layout='vertical'
                onFinish={updateAbteilung}
                onFinishFailed={() => { }}
                autoComplete='off'
                validateMessages={validateMessages}
                initialValues={abteilung}
            >
                <Row gutter={[16, 24]}>
                    <Col span={8}>
                        <Form.Item
                            label='Abteilungsname'
                            name='name'
                            rules={[
                                { required: true },
                                { type: 'string', min: 6 },
                            ]}
                        >
                            <Input
                                placeholder='Abteilungsname'
                                disabled={disabled || updateLoading}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            label='Slug'
                            name='slug'
                            tooltip={'Url lesbarer Name'}
                            rules={[
                                { required: true },
                                { type: 'string', min: 3 },
                                {
                                    validator: (rule: any, value: string, cb: (msg?: string) => void) => {
                                        //check for whitespaces
                                        if (value.includes(' ')) {
                                            return cb('Der Slug darf keine Leerzeichen haben')
                                        }
                                        //Check if contains upper case
                                        if (value.toLowerCase() !== value) {
                                            return cb('Der Slug muss klein geschrieben werden')
                                        }

                                        //OK
                                        return cb();
                                    }
                                }
                            ]}

                        >
                            <Input
                                placeholder='Slug'
                                onChange={(val) => {form.setFieldsValue({ slug: slugify(val.currentTarget.value) }); setSlug(val.currentTarget.value)}}
                                disabled={disabled || updateLoading}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            label='Cevi DB Abteilungs ID'
                            name='ceviDBId'
                            rules={[
                                { required: false }
                            ]}
                        >
                            <Input
                                placeholder='Cevi DB Id'
                                disabled={disabled || updateLoading}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            label='Cevi Logo Url'
                            name='logoUrl'
                            rules={[
                                { required: false },
                                { type: 'url', warningOnly: true },
                                { type: 'string', min: 6 },
                            ]}
                        >
                            <Input
                                placeholder='Cevi Logo Url'
                                disabled={disabled || updateLoading}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            label='Email'
                            name='email'
                            rules={[
                                { type: 'email' },
                            ]}
                        >
                            <Input
                                placeholder='Email'
                                disabled={disabled || updateLoading}
                            />
                        </Form.Item>
                    </Col>
                    <Can I='update' this={abteilung}>
                        <Col span={16}>
                            <Button style={{ marginRight: '10px' }} type='primary' htmlType='submit' disabled={updateLoading}>
                                Speichern
                            </Button>
                            <Popconfirm
                                title='Möchtest du diese Abteilung wirklich löschen?'
                                onConfirm={() => delteAbteilung(abteilung)}
                                onCancel={() => { }}
                                okText='Ja'
                                cancelText='Nein'
                            >
                                <Button type='ghost' danger icon={<DeleteOutlined />} disabled={updateLoading}>
                                    Abteilung Löschen
                                </Button>
                            </Popconfirm>
                        </Col>
                    </Can>
                </Row>
            </Form>
        </div>
    </Row>
}
