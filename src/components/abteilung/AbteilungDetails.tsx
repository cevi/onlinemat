import React, { useState, useEffect } from 'react';
import { Col, Image, Input, PageHeader, Row, Spin, Form, Button, message, Popconfirm } from 'antd';
import classNames from 'classnames';
import appStyles from 'styles.module.scss';
import moduleStyles from './Abteilung.module.scss'
import { Abteilung } from 'types/abteilung.type';
import { firestore } from 'config/firebase/firebase';
import { abteilungenCollection } from 'config/firebase/collections';
import { useAuth0 } from '@auth0/auth0-react';
import { useHistory, useParams } from 'react-router';
import ceviLogoImage from "../../assets/cevi_logo.png";
import { DeleteOutlined } from '@ant-design/icons';


export interface AbteilungDetailProps {
}

export type AbteilungDetailViewParams = {
    abteilungId: string;
};


export const AbteilungDetail = (props: AbteilungDetailProps) => {

    const { abteilungId } = useParams<AbteilungDetailViewParams>();
    const { isAuthenticated } = useAuth0();
    const { push } = useHistory();
    const [ form ] = Form.useForm<Abteilung>();


    const[abteilung, setAbteilung] = useState<Abteilung>();

    const [abteilungLoading, setAbteilungLoading] = useState(false);


    //fetch abteilung
    useEffect(() => {
        setAbteilungLoading(true);
        return firestore().collection(abteilungenCollection).doc(abteilungId).onSnapshot(snap => {
            setAbteilungLoading(false);
            const abteilungLoaded = {
                    ...snap.data() as Abteilung,
                    id: snap.id
                } as Abteilung;
            setAbteilung(abteilungLoaded);
            form.setFieldsValue({
                name: abteilungLoaded.name,
                ceviDBId: abteilungLoaded.ceviDBId,
                logoUrl: abteilungLoaded.logoUrl
            })
        });
    }, [isAuthenticated]);

    const updateAbteilung = async () => {
        try {
            await firestore().collection(abteilungenCollection).doc(abteilungId).update(form.getFieldsValue() as Abteilung);
            message.success(`Änderungen erfolgreich gespeichert`);
        } catch(ex) {
            message.error(`Es ist ein Fehler aufgetreten: ${ex}`)
        }
    }

    const delteAbteilung = async (ab: Abteilung) => {
        try {
            await firestore().collection(abteilungenCollection).doc(ab.id).delete();
            message.info(`${ab.name} erfolgreich gelöscht`)
            push('/')
        } catch(ex) {
            message.error(`Es ist ein Fehler aufgetreten: ${ex}`)
        }
    } 


    if(abteilungLoading || !abteilung) return <Spin/>

    return <div className={classNames(appStyles['flex-grower'])}>
                <PageHeader title={`Abteilung ${abteilung?.name}`}>
                    <Row>
                        <div className={classNames(moduleStyles['ceviLogoWrapper'])}>
                            <Image
                                width={200}
                                src={abteilung?.logoUrl && abteilung.ceviDBId !== '' ? abteilung.logoUrl :  `${ceviLogoImage}`}
                                preview={false}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <Form
                                form={form}
                                layout="vertical"
                                onFinish={updateAbteilung}
                                onFinishFailed={()=>{}}
                                autoComplete="off"
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
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={8}>
                                        <Form.Item 
                                            label="Cevi DB Abteilungs ID"
                                            name="ceviDBGroupID"
                                            rules={[
                                                { required: false }
                                            ]}
                                        >
                                            <Input
                                                placeholder="Cevi DB Id" 
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
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={8}>
                                        <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
                                            <Button type="primary" htmlType="submit">
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
                                            <Button type='ghost' danger icon={<DeleteOutlined />}>
                                                Löschen
                                            </Button>
                                        </Popconfirm>
                                    </Col>
                                </Row>
                            </Form>
                        </div>
                    </Row>
                </PageHeader>
    </div>

}