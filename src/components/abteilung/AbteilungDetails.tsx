import { useState, useContext, useMemo, useEffect, createContext } from 'react';
import { Col, Image, Input, PageHeader, Row, Spin, Form, Button, message, Popconfirm } from 'antd';
import classNames from 'classnames';
import appStyles from 'styles.module.scss';
import moduleStyles from './Abteilung.module.scss'
import { Abteilung, AbteilungMember } from 'types/abteilung.type';
import { firestore, functions } from 'config/firebase/firebase';
import { abteilungenCollection, abteilungenMembersCollection, usersCollection } from 'config/firebase/collections';
import { useNavigate, useParams } from 'react-router';
import ceviLogoImage from "assets/cevi_logo.png";
import { DeleteOutlined } from '@ant-design/icons';
import { validateMessages } from 'util/FormValdationMessages';
import { MemberTable } from './members/MemberTable';
import { AbilityContext, Can } from 'config/casl/casl';
import { ability } from 'config/casl/ability';
import { slugify } from 'util/FormUtil';
import { AbteilungenContext } from 'components/navigation/NavigationMenu';
import { useAuth0 } from '@auth0/auth0-react';
import { UserData } from 'types/user.type';


export interface AbteilungDetailProps {
}

export type AbteilungDetailViewParams = {
    abteilungSlugOrId: string;
};

export const MembersContext = createContext<{ members: AbteilungMember[], loading: boolean }>({ loading: false, members: [] });
export const MembersUserDataContext = createContext<{ userData: { [uid: string]: UserData }, loading: boolean }>({ loading: false, userData: {} });


export const AbteilungDetail = (props: AbteilungDetailProps) => {

    const { abteilungSlugOrId } = useParams<AbteilungDetailViewParams>();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth0();

    const abteilungenContext = useContext(AbteilungenContext);

    const abteilungen = abteilungenContext.abteilungen;
    const abteilungLoading = abteilungenContext.loading;

    const [form] = Form.useForm<Abteilung>();


    const [abteilung, setAbteilung] = useState<Abteilung | undefined>(undefined);

    const [updateLoading, setUpdateLoading] = useState(false);

    useMemo(() => {
        //fetch abteilung
        if (!abteilungLoading && abteilungen.length > 0) {
            if (abteilungSlugOrId !== undefined) {
                const result = abteilungen.find(abt => abt.id === abteilungSlugOrId || abt.slug === abteilungSlugOrId);
                if (result) {
                    setAbteilung(result);
                } else {
                    message.error(`Unbekannte Abteilung ${abteilungSlugOrId}`)
                }

            } else {
                message.error(`Unbekannte Abteilung ${abteilungSlugOrId}`)
            }
        }
    }, [abteilungen])

    const [members, setMembers] = useState<AbteilungMember[]>([]);
    const [userData, setUserData] = useState<{ [uid: string]: UserData }>({});

    const [membersLoading, setMembersLoading] = useState(false);
    const [userDataLoading, setUserDataLoading] = useState(false);

    const disabled = ability.cannot('update', 'Abteilung');

    //fetch members if user has access
    useEffect(() => {
        if (!isAuthenticated || !abteilung || disabled) return;
        setMembersLoading(true);
        return firestore().collection(abteilungenCollection).doc(abteilung.id).collection(abteilungenMembersCollection).onSnapshot(snap => {
            setMembersLoading(false);
            const membersLoaded = snap.docs.flatMap(doc => {

                return {
                    ...doc.data(),
                    __caslSubjectType__: 'AbteilungMember',
                    userId: doc.id
                } as AbteilungMember;
            });
            setMembers(membersLoaded);
        }, (err) => {
            message.error(`Es ist ein Fehler aufgetreten ${err}`)
        });
    }, [isAuthenticated]);

    //fetch user data from members if user has access
    useEffect(() => {
        if (!isAuthenticated || !abteilung || disabled) return;
        const loadUser = async () => {
            setUserDataLoading(true)
            const promises: Promise<UserData>[] = [];
            const localUserData = userData;
            members.forEach(member => {
                const uid = member.userId;
                if (!userData[uid]) {
                    //fetch full user data
                    const userDoc = firestore().collection(usersCollection).doc(uid).get().then((doc) => {
                        return {
                            ...doc.data(),
                            __caslSubjectType__: 'UserData',
                            id: doc.id
                        } as UserData
                    });
                    promises.push(userDoc);
                }
            })

            const values = await Promise.all(promises);

            values.forEach(val => {
                localUserData[val.id] = val;
            })
            await setUserData(localUserData)
            setUserDataLoading(false)
        }

        loadUser();

    }, [members])


    const updateAbteilung = async () => {
        if (!abteilung) return;
        try {
            if (!abteilung.id) {
                message.error(`Unbekannte Abteilung: ${abteilungSlugOrId}`)
                return;
            }
            setUpdateLoading(true);
            if (abteilung?.slug !== form.getFieldsValue().slug) {
                await updateSlug();
            }

            await firestore().collection(abteilungenCollection).doc(abteilung.id).update({
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
        if (!abteilung) return;
        try {
            if (!abteilung.id) {
                message.error(`Unbekannte Abteilung: ${abteilungSlugOrId}`)
                return;
            }
            const slug = form.getFieldsValue().slug;
            await functions().httpsCallable('updateSlug')({ abteilungId: abteilung.id, slug });
        } catch (ex) {
            console.error(`Es ist ein Fehler aufgetreten: ${ex}`)
            throw ex;
        }
    }

    const delteAbteilung = async (ab: Abteilung | undefined) => {
        if (!ab) return;
        try {
            await firestore().collection(abteilungenCollection).doc(ab.id).delete();
            message.info(`${ab.name} erfolgreich gelöscht`)
            navigate('/')
        } catch (ex) {
            message.error(`Es ist ein Fehler aufgetreten: ${ex}`)
        }
    }


    if (abteilungLoading || !abteilung) return <Spin />

    return <div className={classNames(appStyles['flex-grower'])}>
        <MembersContext.Provider value={{ members, loading: membersLoading }}>
            <MembersUserDataContext.Provider value={{userData, loading: userDataLoading}}>
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
                                initialValues={abteilung}
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
                                <MemberTable abteilungId={abteilung.id} abteilung={abteilung} />
                            </Col>
                        </Row>
                    </Can>
                </PageHeader>
            </MembersUserDataContext.Provider>
        </MembersContext.Provider>
    </div>

}