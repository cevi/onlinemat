import { Avatar, Col, DatePicker, Form, Input, List, message, Row, Select, Spin } from 'antd';
import { useUser } from 'hooks/use-user';
import dayjs, { Dayjs } from 'dayjs';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Abteilung } from 'types/abteilung.type';
import { CartItem, DetailedCartItem } from 'types/cart.types';
import { Group } from 'types/group.types';
import { Order } from 'types/order.types';
import { validateMessages } from 'util/FormValdationMessages';
import { groupObjToList } from 'util/GroupUtil';
import { dateFormatWithTime } from 'util/MaterialUtil';
import { OrderItems } from './OrderItems';

export interface CreateOrderProps {
    abteilung: Abteilung
    initItems: DetailedCartItem[]
    createOrder: (orderToCreate: any) => Promise<{ orderId: string | undefined, collisions: { [matId: string]: number } | undefined }>
    changeCart: (items: CartItem[]) => void
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

    const { abteilung, initItems, createOrder, changeCart } = props;

    const [items, setItems] = useState<DetailedCartItem[]>(initItems);

    const [form] = Form.useForm<Order>();
    const userState = useUser();

    const { RangePicker } = DatePicker as any;
    const { TextArea } = Input;
    const { Option, OptGroup } = Select;

    //select next satureday from 14:00 - 17:00
    const defaultStartDate = dayjs().day(6).hour(14).minute(0).second(0);
    const deafultEndDate = dayjs().day(6).hour(17).minute(0).second(0);

    const customGroupId = 'custom';

    const [userGroups, setUserGroups] = useState<Group[]>([]);

    const [selectedGroup, setSelectedGroup] = useState<string | undefined>(undefined);
    const [startDate, setStartDate] = useState<Dayjs>(defaultStartDate);
    const [endDate, setEndDate] = useState<Dayjs>(deafultEndDate);

    const [collisions, setCollisions] = useState<{ [matId: string]: number } | undefined>(undefined)

    useEffect(() => {
        form.setFieldsValue({ groupId: selectedGroup })
    }, [selectedGroup])


    useEffect(() => {
        const isStaff = userState.appUser?.userData.staff || false;
        const list = groupObjToList(abteilung.groups);

        if (isStaff) {
            setUserGroups(list.sort((a: Group, b: Group) => a.name.localeCompare(b.name)))
            return;
        }

        const uid = userState.appUser && userState.appUser.firebaseUser.uid || undefined;
        if (!uid) return;

        const groupsFromUser = list.filter(group => group.members.filter(memberId => memberId === uid).length > 0).sort((a: Group, b: Group) => a.name.localeCompare(b.name))
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

        if (items.length <= 0) {
            message.error('Dein Warenkorb ist leer');
            return;
        }

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
            groupId: formValues.groupId === 'custom' ? undefined : formValues.groupId,
        };

        const response = await createOrder(orderToCreate)

        if (response.collisions) {
            setCollisions(response.collisions)
        }

        if (response.orderId && !response.collisions) {
            form.resetFields();
        }
    }

    const updateOrderItemsByAvail = () => {
        let newDetailedItems = items;
        const newItems: CartItem[] = [];
        items.forEach(i => {

            if (i.matId in (collisions || {})) {
                const avail = (collisions as any)[i.matId] as number;
                if (avail <= 0) {
                    newDetailedItems = [...newDetailedItems.filter(newItem => newItem.matId !== i.matId)];
                } else {
                    const newItem = newDetailedItems.find(newItem => newItem.matId === i.matId);
                    if (!newItem) return;
                    newItem.count = avail;
                    newItem.maxCount = avail;
                    newDetailedItems = [...newDetailedItems.filter(newItem => newItem.matId !== i.matId), newItem];
                }
            }
        })
        setItems(newDetailedItems);
        setCollisions(undefined);
        newDetailedItems.forEach(i => {
            newItems.push({
                __caslSubjectType__: 'CartItem',
                count: i.count,
                matId: i.matId,

            })
        });
        changeCart(newItems)
    }

    if (!userState) return <Spin />

    return <Row>
        <Col span={12}>
            <Form
                form={form}
                validateMessages={validateMessages}
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
                                onCalendarChange={(values: any[]) => {
                                    if (!values) return;
                                    if (values.length <= 1) return;
                                    if (values[0] === null) return;
                                    if (values[1] === null) return;
                                    setStartDate(values[0]);
                                    setEndDate(values[1]);
                                }}
                                format={dateFormatWithTime}
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
                    <OrderItems items={items.sort((a: DetailedCartItem, b: DetailedCartItem) => a.name.localeCompare(b.name))} collisions={collisions} updateOrderItemsByAvail={updateOrderItemsByAvail} />
                </Col>
            </Row>

        </Col>

    </Row>

})