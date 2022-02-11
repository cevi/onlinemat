import React, { useContext } from 'react';
import classNames from 'classnames';
import appStyles from 'styles.module.scss';
import { PageHeader, Card, Tag, Row, Col, Tooltip, Image, Form, Input, Button, Select } from 'antd';
import { useAuth0 } from '@auth0/auth0-react';
import Avatar from 'antd/lib/avatar/avatar';
import { useUser } from 'hooks/use-user';
import ceviLogoImage from 'assets/cevi_logo.png';
import { ContactsOutlined, GoogleOutlined, MailOutlined } from '@ant-design/icons';
import { AbteilungenContext } from 'components/navigation/NavigationMenu';
import { getRoleText } from 'util/MemberUtil';
import { validateMessages } from 'util/FormValdationMessages';
import { updateCustomDisplayName } from 'util/UserUtils';
import { Abteilung } from 'types/abteilung.type';

export interface CustomDisplayName {
    customDisplayName: string
    defaultAbteilung: string | null
}

export const ProfileView = () => {
    const { user, isLoading } = useAuth0();

    const userState = useUser();

    const abteilungenContext = useContext(AbteilungenContext);

    const abteilungen = abteilungenContext.abteilungen;
    const abteilungLoading = abteilungenContext.loading;

    const [form] = Form.useForm<CustomDisplayName>();

    const { Option } = Select;

    // ignore ResizeObserver loop limit exceeded
    // this is ok in several scenarios according to 
    // https://github.com/WICG/resize-observer/issues/38
    const e = window.onerror;
        window.onerror = function (err) {
            if (err === 'ResizeObserver loop limit exceeded') {
                console.warn('Ignored: ResizeObserver loop limit exceeded');
                return false;
            } else {
                return (e as any)(...arguments as any);
            }
        }

    const updateUserProfile = () => {
        if (!userState.appUser) return;
        const formValues = form.getFieldsValue();
        if (formValues.defaultAbteilung === 'none') {
            formValues.defaultAbteilung = null
        }
        updateCustomDisplayName(userState.appUser.firebaseUser.uid, formValues)
    }


    const showAccountConnection = (uid: string | undefined) => {

        if (!uid) return <></>


        let accountIcon = <MailOutlined />
        let accountText = 'Email';
        if (uid.startsWith('google-oauth2')) {
            accountIcon = <GoogleOutlined />
            accountText = 'Google'
        }
        if (uid.startsWith('oauth2|CeviDB')) {
            accountIcon = <Image
                height={16}
                width='auto'
                src={ceviLogoImage}
                preview={false}
            />
            accountText = 'Cevi DB'
        }

        return <span><Tooltip key='accountTypeTooltip' title='Dein Accountverbindung'>
            {accountIcon} {' ' + accountText}
        </Tooltip></span>

    }


    return <div className={classNames(appStyles['flex-grower'])}><Row gutter={[24, 24]}>
        <Col span={12}>
            <Row gutter={[24, 24]}>
                <Col span={24}>
                    <PageHeader title='Profile'></PageHeader>
                </Col>
                <Col span={24}>
                    <Card loading={isLoading || userState.loading || abteilungLoading}>
                        {
                            <>
                                <Row gutter={[24, 24]}>
                                    <Col span={24}>
                                        <div className={classNames(appStyles['flex-grower'], appStyles['center-container'])}>
                                            <Avatar
                                                src={user?.picture ? user.picture : 'https://static.asianetnews.com/img/default-user-avatar.png'}
                                                size={{ xs: 24, sm: 32, md: 40, lg: 64, xl: 80, xxl: 100 }}
                                            />
                                            <h2>{userState.appUser?.userData.customDisplayName || userState.appUser?.userData.displayName}</h2>
                                            <h3>{userState.appUser?.userData.email}</h3>
                                        </div>
                                    </Col>
                                    <Col span={24}>
                                        <p>
                                            <Tooltip key='nameTooltip' title='Dein Name'>
                                                <ContactsOutlined />{` ${userState.appUser?.userData.name}`}
                                            </Tooltip>
                                        </p>
                                        <p>
                                            <Tooltip key='nickNameTooltip' title='Dein Spitzname'>
                                                <ContactsOutlined />{` ${userState.appUser?.userData.nickname}`}
                                            </Tooltip>
                                        </p>

                                        {
                                            showAccountConnection(userState.appUser?.firebaseUser?.uid)
                                        }

                                        {
                                            userState.appUser?.userData?.staff && <><br/><br/><Tag color='#108ee9'>Staff</Tag></>
                                        }
                                    </Col>
                                    <Col span={24}>
                                        <p>Abteilungen:</p>
                                        {
                                            Object.keys(userState.appUser?.userData.roles || {}).map(abteilungId => {
                                                return <Tooltip key={`${abteilungId}_role_tooltip`} title={getRoleText(userState.appUser?.userData.roles[abteilungId])}>
                                                    <Tag key={abteilungId} color='processing'>
                                                        {abteilungen.find(abt => abt.id === abteilungId)?.name}
                                                    </Tag>
                                                </Tooltip>
                                            }).sort()
                                        }
                                    </Col>
                                </Row>


                            </>
                        }

                    </Card>
                </Col>

            </Row>

        </Col>
        <Col span={12}>
            <Row gutter={[24, 24]}>
                <Col span={24}>
                    <PageHeader title='Einstellungen'></PageHeader>
                </Col>
                <Col span={24}>
                    <Form
                        form={form}
                        initialValues={{
                            customDisplayName: userState.appUser?.userData.customDisplayName || userState.appUser?.userData.displayName,
                            defaultAbteilung: userState.appUser?.userData.defaultAbteilung || 'none'
                        }}
                        validateMessages={validateMessages}
                        onFinish={updateUserProfile}
                    >

                        <Form.Item
                            label='Anzeigename'
                            name='customDisplayName'
                            rules={[
                                { required: true },
                                { type: 'string', min: 1 },
                            ]}
                        >
                            <Input
                                placeholder='Anzeigename'
                            />
                        </Form.Item>
                        <Form.Item
                            label='Standart Abteilung'
                            name='defaultAbteilung'
                            rules={[
                                { required: true },
                            ]}
                        >
                            <Select
                                showSearch
                                optionFilterProp='children'
                                filterOption={(input: any, option: any) =>
                                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                }
                                allowClear
                                style={{ width: '100%' }}
                                placeholder='Standart Abteilung'
                            >
                                <Option key='none' value='none'>Keine</Option>
                                {
                                    userState.appUser?.userData?.staff ?
                                        abteilungen.sort((a: Abteilung, b: Abteilung) => a.name.localeCompare(b.name)).map(abteilung => <Option key={abteilung.id} value={abteilung.id}>{abteilung.name}</Option>)
                                        :
                                        Object.keys(userState.appUser?.userData?.roles || {}).map(abteilungId => <Option key={abteilungId} value={abteilungId}>{abteilungen.find(abt => abt.id === abteilungId)?.name}</Option>).sort()
                                }
                            </Select>
                        </Form.Item>
                        <Form.Item wrapperCol={{ offset: 20, span: 4 }}>
                            <Button type='primary' htmlType='submit'>
                                Speichern
                            </Button>
                        </Form.Item>
                    </Form>
                </Col>
            </Row>
        </Col>
    </Row>
    </div>
}
