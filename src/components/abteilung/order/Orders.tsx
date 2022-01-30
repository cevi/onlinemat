import { useAuth0 } from "@auth0/auth0-react";
import { Col, message, Row } from "antd";
import Search from "antd/lib/input/Search";
import { abteilungenCollection, abteilungenOrdersCollection } from "config/firebase/collections";
import { firestore } from "config/firebase/firebase";
import { useUser } from "hooks/use-user";
import moment from "moment";
import { useContext, useEffect, useState } from "react";
import { Abteilung, AbteilungMember } from "types/abteilung.type";
import { Order } from "types/order.types";
import { dateFormatWithTime } from "util/MaterialUtil";
import { getStatusName } from "util/OrderUtil";
import { MembersContext, MembersUserDataContext } from "../AbteilungDetails";
import { OrderTable } from "./OrderTable";

export interface OrdersProps {
    abteilung: Abteilung
}

export const Orders = (props: OrdersProps) => {

    const { abteilung } = props;

    const { isAuthenticated } = useAuth0();
    const user = useUser()

    const [orders, setOrders] = useState<Order[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(false);

    const [query, setQuery] = useState<string | undefined>(undefined);
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);

    //fetch members
    const membersContext = useContext(MembersContext);

    const members = membersContext.members;
    const membersLoading = membersContext.loading;

    //fetch userData
    const membersUserDataContext = useContext(MembersUserDataContext);

    const userData = membersUserDataContext.userData;
    const userDataLoading = membersUserDataContext.loading;


    const membersMerged = members.map(member => ({ ...member, ...(userData[member.userId] || { displayName: 'Loading...' }) }));

    //fetch orders based on rolee
    useEffect(() => {
        if (!isAuthenticated || !abteilung || !user.appUser || !user.appUser.userData) return;
        const roles = user.appUser.userData.roles || {};

        const userRole = roles[abteilung.id] as (AbteilungMember['role'] | 'pending');
        const isStaff = user.appUser.userData.staff ? user.appUser.userData.staff : false
        setOrdersLoading(true);
        let ordersRef;

        //TODO: add support for groups

        //check if user can see all orders
        if (userRole !== 'admin' && userRole !== 'matchef' && !isStaff) {
            ordersRef = firestore().collection(abteilungenCollection).doc(abteilung.id).collection(abteilungenOrdersCollection).where('orderer', '==', user.appUser.userData.id)
        } else {
            ordersRef = firestore().collection(abteilungenCollection).doc(abteilung.id).collection(abteilungenOrdersCollection);
        }


        return ordersRef.onSnapshot(snap => {
            setOrdersLoading(false);
            const ordersLoaded = snap.docs.flatMap(doc => {

                return {
                    ...doc.data() as Order,
                    __caslSubjectType__: 'Order',
                    id: doc.id,
                    startDate: moment(doc.data().startDate.toDate()),
                    endDate: moment(doc.data().endDate.toDate()),
                    creationTime: moment(doc.data().creationTime.toDate())
                } as Order;
            });
            setOrders(ordersLoaded);
        }, (err) => {
            message.error(`Es ist ein Fehler aufgetreten ${err}`)
        });
    }, [isAuthenticated]);

    useEffect(() => {
        if(ordersLoading || membersLoading || userDataLoading) return;

        if(!query) {
            setFilteredOrders(orders);
            return;
        }

        const filtered = orders.filter(o => {
            const lowerQuery = query.toLowerCase();
            const user = membersMerged.find(u => u.id === o.orderer);
            const userName = user ? user.displayName :  'Unbekannt';

            const group = abteilung.groups.find(g => g.id === o.groupId);
            const groupName = group ? group.name : 'Unbekannt';

            const status = getStatusName(o.status);

            return userName.toLowerCase().includes(lowerQuery) 
            || o.customGroupName?.toLowerCase().includes(lowerQuery) 
            || groupName.toLowerCase().includes(lowerQuery) 
            || status.toLowerCase().includes(lowerQuery) 
            || o.startDate.format(dateFormatWithTime).toLowerCase().includes(lowerQuery)
            || o.endDate.format(dateFormatWithTime).toLowerCase().includes(lowerQuery)
        });

        setFilteredOrders(filtered)

    }, [query])


    return <Row gutter={[16, 16]}>
        <Col span={24}>
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