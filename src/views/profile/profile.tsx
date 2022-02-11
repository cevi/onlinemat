import React, { useContext } from 'react';
import classNames from 'classnames';
import appStyles from 'styles.module.scss';
import { PageHeader, Card, Tag, Row, Col, Tooltip, Image, Form, Input, Button } from 'antd';
import { useAuth0 } from '@auth0/auth0-react';
import Avatar from 'antd/lib/avatar/avatar';
import { useUser } from 'hooks/use-user';
import ceviLogoImage from 'assets/cevi_logo.png';
import { ContactsOutlined, GoogleOutlined, MailOutlined } from '@ant-design/icons';
import { AbteilungenContext } from 'components/navigation/NavigationMenu';
import { getRoleText } from 'util/MemberUtil';
import { validateMessages } from 'util/FormValdationMessages';
import { updateCustomDisplayName } from 'util/UserUtils';

export interface CustomDisplayName {
    customDisplayName: string
}

export const ProfileView = () => {
    const { user, isLoading } = useAuth0();

    const userState = useUser();

    const abteilungenContext = useContext(AbteilungenContext);

    const abteilungen = abteilungenContext.abteilungen;
    const abteilungLoading = abteilungenContext.loading;

    const [form] = Form.useForm<CustomDisplayName>();

    const updateUserProfile = () => {
        if (!userState.appUser) return;
        const formValues = form.getFieldsValue();
        updateCustomDisplayName(userState.appUser.firebaseUser.uid, formValues.customDisplayName)
    }


    const showAccountConnection = (uid: string) => {

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

        return <p><Tooltip key='accountTypeTooltip' title='Dein Accountverbindung'>
            {accountIcon} {' ' + accountText}
        </Tooltip></p>

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
                            (user && userState.appUser && !abteilungLoading) && <>
                                <Row gutter={[24, 24]}>
                                    <Col span={24}>
                                        <div className={classNames(appStyles['flex-grower'], appStyles['center-container'])}>
                                            <Avatar
                                                src={user.picture ? user.picture : 'https://static.asianetnews.com/img/default-user-avatar.png'}
                                                size={{ xs: 24, sm: 32, md: 40, lg: 64, xl: 80, xxl: 100 }}
                                            />
                                            <h2>{userState.appUser.userData.customDisplayName || userState.appUser.userData.displayName}</h2>
                                            <h3>{userState.appUser.userData.email}</h3>
                                        </div>
                                    </Col>
                                    <Col span={24}>
                                        <p>
                                            <Tooltip key='nameTooltip' title='Dein Name'>
                                                <ContactsOutlined />{` ${userState.appUser.userData.name}`}
                                            </Tooltip>
                                        </p>
                                        <p>
                                            <Tooltip key='nickNameTooltip' title='Dein Spitzname'>
                                                <ContactsOutlined />{` ${userState.appUser.userData.nickname}`}
                                            </Tooltip>
                                        </p>

                                        {
                                            showAccountConnection(userState.appUser.firebaseUser.uid)
                                        }

                                        {
                                            userState.appUser?.userData?.staff && <Tag color='#108ee9'>Staff</Tag>
                                        }
                                    </Col>
                                    <Col span={24}>
                                        <p>Abteilungen:</p>
                                        {
                                            Object.keys(userState.appUser.userData.roles || {}).map(abteilungId => {
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
                            customDisplayName: userState.appUser?.userData.customDisplayName || userState.appUser?.userData.displayName
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
