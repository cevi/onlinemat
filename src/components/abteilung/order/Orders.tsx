import { useAuth0 } from '@auth0/auth0-react';
import { Col, message, Row, Select } from 'antd';
import Search from 'antd/lib/input/Search';
import { abteilungenCollection, abteilungenOrdersCollection } from 'config/firebase/collections';
import { db } from 'config/firebase/firebase';
import { collection, query as firestoreQuery, where, onSnapshot } from 'firebase/firestore';
import { useUser } from 'hooks/use-user';
import dayjs from 'dayjs';
import { useContext, useEffect, useState } from 'react';
import { Abteilung, AbteilungMember } from 'types/abteilung.type';
import { Group } from 'types/group.types';
import { Order } from 'types/order.types';
import { getGroupName } from 'util/AbteilungUtil';
import { groupObjToList } from 'util/GroupUtil';
import { dateFormatWithTime } from 'util/MaterialUtil';
import { getStatusName } from 'util/OrderUtil';
import { MembersContext, MembersUserDataContext } from '../AbteilungDetails';
import { OrderTable } from './OrderTable';

export interface OrdersProps {
    abteilung: Abteilung
}

export const Orders = (props: OrdersProps) => {

    const { abteilung } = props;

    const { isAuthenticated } = useAuth0();
    const user = useUser()

    const { Option } = Select;

    const [ordersByGroup, setOrdersByGroup] = useState<Order[]>([]);
    const [ordersByOrderer, setOrdersByOrderer] = useState<Order[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(false);

    const [query, setQuery] = useState<string | undefined>(undefined);
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
    const [selectedGroups, setSelectedGroups] = useState<Group[]>([]);
    const [userGroups, setUserGroups] = useState<Group[]>([]);

    //fetch members
    const membersContext = useContext(MembersContext);

    const members = membersContext.members;
    const membersLoading = membersContext.loading;

    //fetch userData
    const membersUserDataContext = useContext(MembersUserDataContext);

    const userData = membersUserDataContext.userData;
    const userDataLoading = membersUserDataContext.loading;


    const membersMerged = members.map(member => ({ ...member, ...(userData[member.userId] || { displayName: 'Loading...' }) }));

    useEffect(() => {
        if (!isAuthenticated || !abteilung || !user.appUser || !user.appUser.userData) return;
        const uid = user.appUser.userData.id;
        const roles = user.appUser.userData.roles || {};
        const userRole = roles[abteilung.id] as (AbteilungMember['role'] | 'pending');
        const isStaff = user.appUser.userData.staff ? user.appUser.userData.staff : false

        if (userRole === 'admin' || userRole === 'matchef' || isStaff) {
            return;
        }


        const groupsWithUser = groupObjToList(abteilung.groups).filter(group => group.members.includes(uid)).sort((a: Group, b: Group) => b.createdAt.valueOf() - a.createdAt.valueOf());
        setUserGroups(groupsWithUser)
        if (groupsWithUser.length > 10) {
            setSelectedGroups(groupsWithUser.slice(0, 10))
        } else {
            setSelectedGroups(groupsWithUser)
        }

    }, [abteilung])

    let ordersByGroupListener: () => void;

    //fetch orders based on role
    useEffect(() => {
        if (!isAuthenticated || !abteilung || !user.appUser || !user.appUser.userData) return;
        const roles = user.appUser.userData.roles || {};

        const uid = user.appUser.userData.id;
        const userRole = roles[abteilung.id] as (AbteilungMember['role'] | 'pending');
        const isStaff = user.appUser.userData.staff ? user.appUser.userData.staff : false
        setOrdersLoading(true);
        let ordersRef;

        //check if user can see all orders
        const ordersCollectionRef = collection(db, abteilungenCollection, abteilung.id, abteilungenOrdersCollection);
        if (userRole !== 'admin' && userRole !== 'matchef' && !isStaff) {
            ordersRef = firestoreQuery(ordersCollectionRef, where('orderer', '==', uid))
        } else {
            ordersRef = ordersCollectionRef;
        }

        return onSnapshot(ordersRef, (snap) => {
            setOrdersLoading(false);
            const ordersLoaded = snap.docs.flatMap(doc => {

                return {
                    ...doc.data() as Order,
                    __caslSubjectType__: 'Order',
                    id: doc.id,
                    startDate: dayjs(doc.data().startDate.toDate()),
                    endDate: dayjs(doc.data().endDate.toDate()),
                    creationTime: dayjs(doc.data().creationTime.toDate())
                } as Order;
            });
            setOrdersByOrderer(ordersLoaded);
        }, (err) => {
            message.error(`Es ist ein Fehler aufgetreten ${err}`)
            console.error('Es ist ein Fehler aufgetreten', err)
        });
    }, [isAuthenticated]);

    //fetch orders based on uid
    useEffect(() => {
        if (!isAuthenticated || !abteilung || !user.appUser || !user.appUser.userData) return;
        const roles = user.appUser.userData.roles || {};

        const userRole = roles[abteilung.id] as (AbteilungMember['role'] | 'pending');
        const isStaff = user.appUser.userData.staff ? user.appUser.userData.staff : false
        setOrdersLoading(true);
        let ordersRef;

        const groupsToCheck = selectedGroups.map(group => group.id);

        //check if user can see all orders
        const ordersCollectionRef2 = collection(db, abteilungenCollection, abteilung.id, abteilungenOrdersCollection);
        if (userRole !== 'admin' && userRole !== 'matchef' && !isStaff && groupsToCheck.length > 0) {
            ordersRef = firestoreQuery(ordersCollectionRef2, where('groupId', 'in', groupsToCheck))
        }

        if (!ordersRef) {
            if (ordersByGroupListener) {
                ordersByGroupListener()
            }
            setOrdersByGroup([])
            setOrdersLoading(false);
            return;
        }

        ordersByGroupListener = onSnapshot(ordersRef, (snap) => {
            setOrdersLoading(false);
            const ordersLoaded = snap.docs.flatMap(doc => {

                return {
                    ...doc.data() as Order,
                    __caslSubjectType__: 'Order',
                    id: doc.id,
                    startDate: dayjs(doc.data().startDate.toDate()),
                    endDate: dayjs(doc.data().endDate.toDate()),
                    creationTime: dayjs(doc.data().creationTime.toDate())
                } as Order;
            });
            setOrdersByGroup(ordersLoaded);
        }, (err) => {
            message.error(`Es ist ein Fehler aufgetreten ${err}`)
            console.error('Es ist ein Fehler aufgetreten', err)
        });
    }, [isAuthenticated, selectedGroups]);

    useEffect(() => {
        if (ordersLoading || membersLoading || userDataLoading) return;

        if (!query) {
            setFilteredOrders(orders);
            return;
        }

        const filtered = orders.filter(o => {
            const lowerQuery = query.toLowerCase();
            const user = membersMerged.find(u => u.id === o.orderer);
            const userName = user ? user.displayName : 'Unbekannt';

            const groupName = getGroupName(o.groupId, abteilung);

            const status = getStatusName(o);

            return userName.toLowerCase().includes(lowerQuery)
                || o.customGroupName?.toLowerCase().includes(lowerQuery)
                || groupName.toLowerCase().includes(lowerQuery)
                || status.toLowerCase().includes(lowerQuery)
                || o.startDate.format(dateFormatWithTime).toLowerCase().includes(lowerQuery)
                || o.endDate.format(dateFormatWithTime).toLowerCase().includes(lowerQuery)
        });

        setFilteredOrders(filtered)

    }, [query])

    useEffect(() => {
        const list: Order[] = [...ordersByOrderer];
        ordersByGroup.forEach(o => {
            if (!list.find(m => m.id === o.id)) {
                list.push(o)
            }
        })
        setOrders(list)
    }, [ordersByOrderer, ordersByGroup])

    const updateSelectedGroups = (groupIds: string[]) => {
        const groups: Group[] = [];

        if (groupIds.length > 10) {
            message.warning('Es können leider nur 10 Gruppen / Anlässe gleichzeitig ausgewählt werden');
            return;
        }

        groupIds.forEach(id => {
            const group = userGroups.find(g => g.id === id);
            if (!group) {
                message.error(`Gruppe/Anlass ${id} konnte nicht gefunden werden`);
                console.error(`Gruppe/Anlass ${id} konnte nicht gefunden werden`);
            } else {
                groups.push(group);
            }
        })

        setSelectedGroups(groups);
    }

    return <Row gutter={[16, 16]}>
        {(selectedGroups.length > 0 || userGroups.length > 0) && <Col span={12}>
            <Select
                mode='multiple'
                allowClear
                style={{ width: '100%' }}
                placeholder='Gruppe / Anlass auswählen'
                value={selectedGroups.map(g => g.id)}
                onChange={(vals) => { updateSelectedGroups(vals) }}
            >
                {
                    userGroups.sort((a: Group, b: Group) => a.createdAt.valueOf() - b.createdAt.valueOf()).map(g => {
                        return <Option key={g.id}>{g.name}</Option>
                    })
                }
            </Select>
        </Col>
        }
        <Col span={selectedGroups.length > 0 || userGroups.length > 0 ? 12 : 24}>
            <Search
                placeholder='nach Bestellung suchen'
                allowClear
                enterButton='Suchen'
                size='large'
                onSearch={(query) => setQuery(query)}
            />
        </Col>
        <Col span={24}>
            <OrderTable abteilung={abteilung} orders={query ? filteredOrders : orders} loading={ordersLoading || userDataLoading || membersLoading} members={membersMerged} />
        </Col>
    </Row>
}