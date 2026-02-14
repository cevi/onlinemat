import { useAuth0 } from '@auth0/auth0-react';
import { Col, Input, message, Row, Select } from 'antd';
import { abteilungenCollection, abteilungenOrdersCollection } from 'config/firebase/collections';
import { db } from 'config/firebase/firebase';
import { collection, query as firestoreQuery, where } from 'firebase/firestore';
import { useUser } from 'hooks/use-user';
import dayjs from 'dayjs';
import { useContext, useEffect, useMemo, useState } from 'react';
import { Abteilung, AbteilungMember } from 'types/abteilung.type';
import { Group } from 'types/group.types';
import { Order } from 'types/order.types';
import { getGroupName } from 'util/AbteilungUtil';
import { groupObjToList } from 'util/GroupUtil';
import { dateFormatWithTime } from 'util/constants';
import { getStatusName } from 'util/OrderUtil';
import { MembersContext, MembersUserDataContext } from '../AbteilungDetails';
import { OrderTable } from './OrderTable';
import { useFirestoreCollection } from 'hooks/useFirestoreCollection';

export interface OrdersProps {
    abteilung: Abteilung
}

export const Orders = (props: OrdersProps) => {

    const { abteilung } = props;

    const { isAuthenticated } = useAuth0();
    const user = useUser()

    const { Option } = Select;

    const [orders, setOrders] = useState<Order[]>([]);

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

    const uid = user.appUser?.userData?.id;
    const roles = user.appUser?.userData?.roles || {};
    const userRole = abteilung ? roles[abteilung.id] as (AbteilungMember['role'] | 'pending') : undefined;
    const isStaff = user.appUser?.userData?.staff || false;
    const isAdminOrMatchef = userRole === 'admin' || userRole === 'matchef' || isStaff;

    useEffect(() => {
        if (!isAuthenticated || !abteilung || !uid) return;
        if (isAdminOrMatchef) return;

        const groupsWithUser = groupObjToList(abteilung.groups).filter(group => group.members.includes(uid)).sort((a: Group, b: Group) => b.createdAt.valueOf() - a.createdAt.valueOf());
        setUserGroups(groupsWithUser)
        if (groupsWithUser.length > 10) {
            setSelectedGroups(groupsWithUser.slice(0, 10))
        } else {
            setSelectedGroups(groupsWithUser)
        }

    }, [abteilung])

    const orderTransform = (data: Record<string, unknown>, id: string) => ({
        ...(data as unknown as Order),
        __caslSubjectType__: 'Order',
        id,
        startDate: dayjs((data.startDate as { toDate: () => Date }).toDate()),
        endDate: dayjs((data.endDate as { toDate: () => Date }).toDate()),
        creationTime: dayjs((data.creationTime as { toDate: () => Date }).toDate()),
    } as Order);

    //fetch orders based on role
    const ordersQuery = useMemo(() => {
        if (!abteilung || !uid) return null;
        const ordersCollectionRef = collection(db, abteilungenCollection, abteilung.id, abteilungenOrdersCollection);
        if (!isAdminOrMatchef) {
            return firestoreQuery(ordersCollectionRef, where('orderer', '==', uid));
        }
        return ordersCollectionRef;
    }, [abteilung, uid, isAdminOrMatchef]);

    const { data: ordersByOrderer, loading: ordersLoading1 } = useFirestoreCollection<Order>({
        ref: ordersQuery,
        enabled: isAuthenticated && !!abteilung && !!user.appUser?.userData,
        transform: orderTransform,
        deps: [isAuthenticated, ordersQuery],
    });

    //fetch orders based on group membership
    const groupOrdersQuery = useMemo(() => {
        if (!abteilung || isAdminOrMatchef) return null;
        const groupsToCheck = selectedGroups.map(group => group.id);
        if (groupsToCheck.length === 0) return null;
        const ordersCollectionRef = collection(db, abteilungenCollection, abteilung.id, abteilungenOrdersCollection);
        return firestoreQuery(ordersCollectionRef, where('groupId', 'in', groupsToCheck));
    }, [abteilung, isAdminOrMatchef, selectedGroups]);

    const { data: ordersByGroup, loading: ordersLoading2 } = useFirestoreCollection<Order>({
        ref: groupOrdersQuery,
        enabled: isAuthenticated && !!groupOrdersQuery,
        transform: orderTransform,
        deps: [isAuthenticated, groupOrdersQuery],
    });

    const ordersLoading = ordersLoading1 || ordersLoading2;

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
            <Input.Search
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