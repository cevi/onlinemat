import React, { useState, useEffect } from 'react';
import { Table, Select, Button, Tooltip, message } from 'antd';
import { AbteilungMember, AbteilungMemberUserData } from 'types/abteilung.type';
import { approveMemberRequest, banMember, changeRoleOfMember, denyMemberRequest, removeMember, unBanMember } from 'util/MemberUtil';
import classNames from 'classnames';
import moduleStyles from './MemberTable.module.scss'
import { UserData } from 'types/user.type';
import { firestore } from 'config/firebase/firebase';
import { abteilungenCollection, abteilungenMembersCollection, usersCollection } from 'config/firebase/collections';
import { useAuth0 } from '@auth0/auth0-react';



export interface MemberImplTableProps {
    abteilungId: string
    members: AbteilungMemberUserData[]
    loading: boolean
}

export const roles = [{ key: 'guest', name: 'Gast' }, { key: 'member', name: 'Mitglied' }, { key: 'matchef', name: 'Matchef' }, { key: 'admin', name: 'Admin' }];


export const MemberTableImpl = (props: MemberImplTableProps) => {

    const { abteilungId, loading, members } = props;

    const { Option } = Select;

    const renderActions = (record: AbteilungMemberUserData) => {

        if (record.banned && !!record.banned) {
            return <div className={classNames(moduleStyles['actions'])}>
                <Button type="primary" onClick={() => unBanMember(abteilungId, record.userId)}>Benutzer entsperren</Button>
            </div>
        }

        if (!record.approved || !!!record.approved) {

            //show approve / deny / ban
            return <div className={classNames(moduleStyles['actions'])}>
                <Button type="primary" onClick={() => approveMemberRequest(abteilungId, record.userId)}>{`als ${roles.find(r => r.key === record.role)?.name || record.role} Annehmen`}</Button>
                <Button type="dashed" danger onClick={() => denyMemberRequest(abteilungId, record.userId)}>Ablehnen</Button>
                <Tooltip title="Die Anfrage wird abgelehnt und der Benutzer kann in Zukunft keinen neuen Antrag stellen">
                    <Button type="primary" danger onClick={() => banMember(abteilungId, record.userId)}>Sperren</Button>
                </Tooltip>

            </div>
        }

        return <div className={classNames(moduleStyles['actions'])}>
            <Select key={`${record.userId}_roleSelection`} value={record.role} style={{ width: 120 }} onChange={(role) => changeRoleOfMember(abteilungId, record.userId, role)}>
                {
                    roles.map(role => <Option key={`${record.userId}_role_${role.key}`} value={role.key}>{role.name}</Option>)
                }
            </Select>
            <Button type="dashed" danger onClick={() => removeMember(abteilungId, record.userId)}>Entfernen</Button>
        </div>

    }

    const columns = [
        {
            title: 'Name',
            dataIndex: 'displayName',
            key: 'displayName',
            sorter: (a: AbteilungMemberUserData, b: AbteilungMemberUserData) => a.displayName.normalize().localeCompare(b.displayName.normalize()),
            render: (text: string, record: AbteilungMemberUserData) => (
                <p>{record.displayName}</p>
            )
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            sorter: (a: AbteilungMemberUserData, b: AbteilungMemberUserData) => a.email.normalize().localeCompare(b.email.normalize()),
            render: (text: string, record: AbteilungMemberUserData) => (
                <p>{record.email}</p>
            )
        },
        {
            title: 'Rolle',
            key: 'role',
            dataIndex: 'role',
            sorter: (a: AbteilungMemberUserData, b: AbteilungMemberUserData) => a.role.normalize().localeCompare(b.role.normalize()),
            render: (text: string, record: AbteilungMemberUserData) => (
                renderActions(record)
            )
        }
    ];


    return <Table loading={loading} columns={columns} dataSource={members.sort((a: AbteilungMemberUserData, b: AbteilungMemberUserData) => ((a.approved || false) === (b.approved || false)) ? 0 : (a.approved || false) ? 1 : -1)} />;

}

export interface MemberTableProps {
    abteilungId: string
}

export const MemberTable = (props: MemberTableProps) => {

    const { abteilungId } = props;
    const { isAuthenticated } = useAuth0();


    const [members, setMembers] = useState<AbteilungMember[]>([]);
    const [userData, setUserData] = useState<{ [uid: string]: UserData }>({});

    const [membersLoading, setMembersLoading] = useState(false);
    const [userDataLoading, setuserDataLoading] = useState(false);


    //fetch members
    useEffect(() => {
        if(!isAuthenticated) return;
        setMembersLoading(true);
        return firestore().collection(abteilungenCollection).doc(abteilungId).collection(abteilungenMembersCollection).onSnapshot(snap => {
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

    useEffect(() => {
        const loadUser = async () => {
            setuserDataLoading(true)
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
            setuserDataLoading(false)
        }

        loadUser();

    }, [members])


    return <MemberTableImpl loading={userDataLoading || membersLoading} abteilungId={abteilungId} members={members.map(member => ({...member, ...(userData[member.userId] || { displayName: 'Loading...' })}))}/>
}