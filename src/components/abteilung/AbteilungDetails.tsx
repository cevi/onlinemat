import React, { useState, useEffect } from 'react';
import { Col, Image, Input, PageHeader, Row, Spin, Form, Button, message, Popconfirm } from 'antd';
import classNames from 'classnames';
import appStyles from 'styles.module.scss';
import moduleStyles from './Abteilung.module.scss'
import { Abteilung, AbteilungMember } from 'types/abteilung.type';
import { firestore, functions } from 'config/firebase/firebase';
import { abteilungenCollection, abteilungenMembersCollection, usersCollection } from 'config/firebase/collections';
import { useAuth0 } from '@auth0/auth0-react';
import { useHistory, useParams } from 'react-router';
import ceviLogoImage from "assets/cevi_logo.png";
import { DeleteOutlined } from '@ant-design/icons';
import { validateMessages } from 'util/FormValdationMessages';
import { MemberTable } from './members/MemberTable';
import { Can } from 'config/casl/casl';
import { ability } from 'config/casl/ability';
import { slugify } from 'util/FormUtil';
import { getAbteilungIdBySlugOrId } from 'util/AbteilungUtil';


export interface AbteilungDetailProps {
}

export type AbteilungDetailViewParams = {
    abteilungSlugOrId: string;
};


export const AbteilungDetail = (props: AbteilungDetailProps) => {

    const { abteilungSlugOrId } = useParams<AbteilungDetailViewParams>();
    const { isAuthenticated } = useAuth0();
    const { push } = useHistory();
    const [form] = Form.useForm<Abteilung>();


    const [abteilungId, setAbteilungId] = useState<string | undefined>(undefined);
    const [abteilung, setAbteilung] = useState<Abteilung>();

    const [abteilungLoading, setAbteilungLoading] = useState(false);
    const [updateLoading, setUpdateLoading] = useState(false);

    //fetch abteilung
    useEffect(() => {
        const listener = async () => {
            if(!isAuthenticated) return;
            const abteilungId = await getAbteilungIdBySlugOrId(abteilungSlugOrId);
            setAbteilungId(abteilungId);
            setAbteilungLoading(true);
            try {
                return firestore().collection(abteilungenCollection).doc(abteilungId).onSnapshot(snap => {
                    setAbteilungLoading(false);
                    const abteilungLoaded = {
                        ...snap.data(),
                        __caslSubjectType__: 'Abteilung',
                        id: snap.id
                    } as Abteilung;
                    setAbteilung(abteilungLoaded);
                    form.setFieldsValue({
                        name: abteilungLoaded.name,
                        slug: abteilungLoaded.slug,
                        ceviDBId: abteilungLoaded.ceviDBId || '',
                        logoUrl: abteilungLoaded.logoUrl || ''
                    })
                });
            } catch (ex) {
                message.error(`Es ist ein Fehler aufgetreten ${ex}`)
            }
        }

        listener();

    }, [isAuthenticated, abteilungSlugOrId]);



    const updateAbteilung = async () => {
        try {
            if (!abteilungId) {
                message.error(`Unbekannte Abteilung: ${abteilungSlugOrId}`)
                return;
            }
            setUpdateLoading(true);
            if (abteilung?.slug !== form.getFieldsValue().slug) {
                await updateSlug();
            }

            await firestore().collection(abteilungenCollection).doc(abteilungId).update({
                name: form.getFieldsValue().name,
                ceviDBId: form.getFieldsValue().ceviDBId,
                logoUrl: form.getFieldsValue().logoUrl
            } as Abteilung);
            message.success(`Änderungen erfolgreich gespeichert`);
        } catch (ex) {
            message.error(`Es ist ein Fehler aufgetreten: ${ex}`)
        }
        setUpdateLoading(false);
    }

    const updateSlug = async () => {
        try {
            if (!abteilungId) {
                message.error(`Unbekannte Abteilung: ${abteilungSlugOrId}`)
                return;
            }
            const slug = form.getFieldsValue().slug;
            await functions().httpsCallable('updateSlug')({ abteilungId, slug });
        } catch (ex) {
           console.error(`Es ist ein Fehler aufgetreten: ${ex}`)
           throw ex;
        }
    }

    const delteAbteilung = async (ab: Abteilung) => {
        try {
            await firestore().collection(abteilungenCollection).doc(ab.id).delete();
            message.info(`${ab.name} erfolgreich gelöscht`)
            push('/')
        } catch (ex) {
            message.error(`Es ist ein Fehler aufgetreten: ${ex}`)
        }
    }

    const disabled = ability.cannot('update', 'Abteilung');


    if (abteilungLoading || !abteilung) return <Spin />

    return <div className={classNames(appStyles['flex-grower'])}>
        <PageHeader title={`Abteilung ${abteilung?.name}`}>
            <Row>
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
                        layout="vertical"
                        onFinish={updateAbteilung}
                        onFinishFailed={() => { }}
                        autoComplete="off"
                        validateMessages={validateMessages}
                        initialValues={{
                            ceviDBId: '',
                            logoUrl: ''
                        }}
                    >
                        <Row gutter={[16, 24]}>
                            <Col span={8}>
                                <Form.Item
                                    label="Abteilungsname"
                                    name="name"
                                    rules={[
                                        { required: true },
                                        { type: 'string', min: 6 },
                                    ]}
                                >
                                    <Input
                                        placeholder="Abteilungsname"
                                        disabled={disabled || updateLoading}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item
                                    label="Slug"
                                    name="slug"
                                    tooltip={'Url lesbarer Name'}
                                    rules={[
                                        { required: true },
                                        { type: 'string', min: 4 },
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
                                        placeholder="Slug"
                                        onChange={(val) => form.setFieldsValue({ slug: slugify(val.currentTarget.value) })}
                                        disabled={disabled || updateLoading}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item
                                    label="Cevi DB Abteilungs ID"
                                    name="ceviDBId"
                                    rules={[
                                        { required: false }
                                    ]}
                                >
                                    <Input
                                        placeholder="Cevi DB Id"
                                        disabled={disabled || updateLoading}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item
                                    label="Cevi Logo Url"
                                    name="logoUrl"
                                    rules={[
                                        { required: false },
                                        { type: 'url', warningOnly: true },
                                        { type: 'string', min: 6 },
                                    ]}
                                >
                                    <Input
                                        placeholder="Cevi Logo Url"
                                        disabled={disabled || updateLoading}
                                    />
                                </Form.Item>
                            </Col>
                            <Can I='update' this={abteilung}>
                                <Col span={8}>
                                    <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
                                        <Button type="primary" htmlType="submit" disabled={updateLoading}>
                                            Speichern
                                        </Button>
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Popconfirm
                                        title='Möchtest du diese Abteilung wirklich löschen?'
                                        onConfirm={() => delteAbteilung(abteilung)}
                                        onCancel={() => { }}
                                        okText='Ja'
                                        cancelText='Nein'
                                    >
                                        <Button type='ghost' danger icon={<DeleteOutlined />} disabled={updateLoading}>
                                            Löschen
                                        </Button>
                                    </Popconfirm>
                                </Col>
                            </Can>
                        </Row>
                    </Form>
                </div>
            </Row>
            <Can I='update' this={abteilung}>
                <Row>
                    <Col span={24}>
                        <MemberTable abteilungId={abteilung.id} />
                    </Col>
                </Row>
            </Can>
        </PageHeader>
    </div>

}