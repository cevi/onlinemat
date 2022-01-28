import { Col, Row } from "antd";
import { useContext } from "react";
import { Abteilung } from "types/abteilung.type";
import { MembersContext, MembersUserDataContext } from "../AbteilungDetails";
import { AddGroupButton } from "./AddGroup";
import { GroupTable } from "./GroupTable";

export interface GroupProps {
    abteilung: Abteilung
}

export const Group = (props: GroupProps) => {

    const { abteilung } = props;

    //fetch members
    const membersContext = useContext(MembersContext);

    const members = membersContext.members;
    const membersLoading = membersContext.loading;

    //fetch userData
    const membersUserDataContext = useContext(MembersUserDataContext);

    const userData = membersUserDataContext.userData;
    const userDataLoading = membersUserDataContext.loading;


    const membersMerged = members.map(member => ({ ...member, ...(userData[member.userId] || { displayName: 'Loading...' }) }));

    return <Row gutter={[16, 16]}>
            <Col span={24}>
                <AddGroupButton abteilung={abteilung} members={membersMerged} />
            </Col>
            <Col span={24}>
                <GroupTable abteilung={abteilung} members={membersMerged} loading={userDataLoading || membersLoading} />
            </Col>
    </Row>

}