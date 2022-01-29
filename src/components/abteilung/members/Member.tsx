import { Col, Row } from "antd";
import Search from "antd/lib/input/Search";
import { useContext, useEffect, useState } from "react";
import { AbteilungMemberUserData } from "types/abteilung.type";
import { MembersContext, MembersUserDataContext } from "../AbteilungDetails";
import { MemberTable } from "./MemberTable";

export interface MemberProps {
    abteilungId: string
}

export const Member = (props: MemberProps) => {
    const { abteilungId } = props;

    //fetch members
    const membersContext = useContext(MembersContext);

    const members = membersContext.members;
    const membersLoading = membersContext.loading;

    //fetch userData
    const membersUserDataContext = useContext(MembersUserDataContext);

    const userData = membersUserDataContext.userData;
    const userDataLoading = membersUserDataContext.loading;

    const [memberMerged, setMemberMerged] = useState<AbteilungMemberUserData[]>([]);

    const [query, setQuery] = useState<string | undefined>(undefined);

    useEffect(()=> {
        setMemberMerged(members.map(member => ({ ...member, ...(userData[member.userId] || { displayName: 'Loading...' }) })))
    }, [userData, members, membersLoading, userDataLoading])


    return <Row gutter={[16, 16]}>
        <Col span={24}>
            <Search
                placeholder='nach Mitglied suchen'
                allowClear
                enterButton='Suchen'
                size='large'
                onSearch={(query) => setQuery(query)}
            />
        </Col>
        <Col span={24}>
            <MemberTable loading={userDataLoading || membersLoading} abteilungId={abteilungId} members={query ? memberMerged.filter(item => item.name.toLowerCase().includes(query.toLowerCase()) || item.email.toLowerCase().includes(query.toLowerCase())) : memberMerged} />
        </Col>
    </Row>
}