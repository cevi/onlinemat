import { Button, Col, DatePicker, Form, Input, Row, Select, Spin } from 'antd';
import { useUser } from 'hooks/use-user';
import moment, { Moment } from 'moment';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Abteilung } from 'types/abteilung.type';
import { DetailedCartItem } from 'types/cart.types';
import { Group } from 'types/group.types';
import { Order } from 'types/order.types';
import { validateMessages } from 'util/FormValdationMessages';

export interface CreateOrderProps {
    abteilung: Abteilung
    items: DetailedCartItem[]
    createOrder: (orderToCreate: any) => Promise<string | undefined>
}

export const CreateOrder = forwardRef((props: CreateOrderProps, ref) => {
    useImperativeHandle(
        ref,
        () => ({
            submitOrder() {
                prepareOrderCreation();
            }
        }),
    )

    const { abteilung, items, createOrder } = props;

    const [form] = Form.useForm<Order>();
    const userState = useUser();

    const { RangePicker } = DatePicker;
    const { TextArea } = Input;
    const { Option, OptGroup } = Select;

    //select next satureday from 14:00 - 17:00
    const defaultStartDate = moment().day(6).hour(14).minute(0).second(0);
    const deafultEndDate = moment().day(6).hour(17).minute(0).second(0);

    const customGroupId = 'custom';

    const [userGroups, setUserGroups] = useState<Group[]>([]);

    const [selectedGroup, setSelectedGroup] = useState<string | undefined>(undefined);
    const [startDate, setStartDate] = useState<Moment>(defaultStartDate);
    const [endDate, setEndDate] = useState<Moment>(deafultEndDate);

    const [orderLoading, setOrderLoading] = useState<boolean>(false);

    useEffect(() => {
        form.setFieldsValue({ groupId: selectedGroup })
    }, [selectedGroup])


    useEffect(() => {
        const isStaff = userState.appUser?.userData.staff || false;

        if (isStaff) {
            setUserGroups(abteilung.groups)
            return;
        }

        const uid = userState.appUser && userState.appUser.firebaseUser.uid || undefined;
        if (!uid) return;

        const groupsFromUser = abteilung.groups.filter(group => group.members.filter(memberId => memberId === uid).length > 0)
        setUserGroups(groupsFromUser)

    }, [userState])

    useEffect(() => {
        //set default group
        form.setFieldsValue({
            groupId: defaultGroup(userGroups)
        })
    }, [userGroups])

    useEffect(() => {
        if (form.getFieldValue('startDate') !== startDate) {
            form.setFieldsValue({ startDate: startDate })
        }
        if (form.getFieldValue('endDate') !== endDate) {
            form.setFieldsValue({ endDate: endDate })
        }

        //TODO: check availabilty

    }, [startDate, endDate])

    const defaultGroup = (groups: Group[]) => {
        let group = customGroupId;

        if (groups.filter(g => g.type === 'group').length > 0) {
            group = groups.filter(g => g.type === 'group')[0].id;
        } else if (groups.filter(g => g.type === 'event').length > 0) {
            group = groups.filter(g => g.type === 'event')[0].id;
        }

        return group;
    }


    const prepareOrderCreation = async () => {
        if (!startDate || !endDate) return;

        //TODO: if available create order

        const formValues = form.getFieldsValue();

        const orderItems = items.map(i => {
            return {
                count: i.count,
                matId: i.matId
            }
        })

        const orderToCreate = {
            startDate: startDate.second(0).toISOString(),
            endDate: endDate.second(0).toISOString(),
            items: orderItems,
            comment: formValues.comment,
            customGroupName: formValues.customGroupName,
            groupId: formValues.groupId,
        };

        const orderId = await createOrder(orderToCreate)

        if(orderId) {
            form.resetFields();
        }
    }

    if (!userState) return <Spin />

    return <Row>
        <Col span={12}>
            <Form
                form={form}
                validateMessages={validateMessages}
                onFinish={prepareOrderCreation}
            >
                <Row gutter={[16, 16]}>
                    <Col span={24}>
                        <Form.Item
                            label='Datum'
                            rules={[
                                { required: true },
                            ]}
                        >
                            <RangePicker
                                value={[startDate, endDate]}
                                minuteStep={10}
                                onCalendarChange={(values) => {
                                    if (!values) return;
                                    if (values.length <= 1) return;
                                    if (values[0] === null) return;
                                    if (values[1] === null) return;
                                    setStartDate(values[0]);
                                    setEndDate(values[1]);
                                }}
                                format='DD.MM.YYYY HH:mm'
                                showTime={{
                                    format: 'HH:mm'
                                }}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={18}>
                        <Form.Item
                            label='Gruppe / Anlass'
                            name='groupId'
                            rules={[
                                { required: true },
                            ]}
                        >
                            <Select
                                showSearch
                                onChange={(val) => setSelectedGroup(val)}
                            >
                                <OptGroup label='Gruppe'>
                                    {
                                        userGroups.filter(g => g.type === 'group').map(g => {
                                            return <Option key={`group_option_${g.id}`} value={g.id}>{g.name}</Option>
                                        })
                                    }
                                </OptGroup>
                                <OptGroup label='Anlass'>
                                    {
                                        userGroups.filter(g => g.type === 'event').map(g => {
                                            return <Option key={`event_option_${g.id}`} value={g.id}>{g.name}</Option>
                                        })
                                    }
                                </OptGroup>
                                <OptGroup label='Andere'>
                                    <Option key='custom_option_custom' value={customGroupId}>Andere</Option>
                                </OptGroup>
                            </Select>
                        </Form.Item>
                    </Col>
                    {
                        selectedGroup === customGroupId && <Col span={18}>
                            <Form.Item
                                label='Bezeichnung'
                                name='customGroupName'
                                rules={[
                                    { required: selectedGroup === customGroupId },
                                ]}
                            >
                                <Input />
                            </Form.Item>
                        </Col>
                    }
                    <Col span={18}>
                        <Form.Item
                            label='Bemerkung'
                            name='comment'
                            rules={[
                                { required: false },
                            ]}
                        >
                            <TextArea rows={4} />
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Col>
        <Col span={12}>
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    {
                        items.map(item => {
                            return <p key={`item_${item.matId}`}>{`${item.count} x ${item.name}`}</p>
                        })
                    }
                </Col>
            </Row>

        </Col>

    </Row>

})