import { useState, useContext, useMemo, useEffect, createContext } from 'react';
import { Col, PageHeader, Row, Spin, message, Menu } from 'antd';
import classNames from 'classnames';
import appStyles from 'styles.module.scss';
import { Abteilung, AbteilungMember } from 'types/abteilung.type';
import { firestore } from 'config/firebase/firebase';
import { abteilungenCollection, abteilungenMembersCollection, usersCollection } from 'config/firebase/collections';
import { useParams } from 'react-router';
import { ContainerOutlined, SettingOutlined, TagsOutlined, TeamOutlined } from '@ant-design/icons';
import { MemberTable } from './members/MemberTable';
import { Can } from 'config/casl/casl';
import { ability } from 'config/casl/ability';
import { AbteilungenContext } from 'components/navigation/NavigationMenu';
import { useAuth0 } from '@auth0/auth0-react';
import { UserData } from 'types/user.type';
import { AbteilungMaterialView } from 'views/abteilung/material/abteilungMaterials';
import { AbteilungSettings } from './settings/AbteilungSettings';
import { GroupTable } from './group/GroupTable';


export interface AbteilungDetailProps {
}

export type AbteilungDetailViewParams = {
    abteilungSlugOrId: string;
};

export const MembersContext = createContext<{ members: AbteilungMember[], loading: boolean }>({ loading: false, members: [] });
export const MembersUserDataContext = createContext<{ userData: { [uid: string]: UserData }, loading: boolean }>({ loading: false, userData: {} });


export const AbteilungDetail = (props: AbteilungDetailProps) => {

    const { abteilungSlugOrId } = useParams<AbteilungDetailViewParams>();
    const { isAuthenticated } = useAuth0();

    const abteilungenContext = useContext(AbteilungenContext);

    const abteilungen = abteilungenContext.abteilungen;
    const abteilungLoading = abteilungenContext.loading;

    const [abteilung, setAbteilung] = useState<Abteilung | undefined>(undefined);
    const [selectedMenu, setSelectedMenu] = useState<'mat' | 'settings' | 'members' | 'groups'>('mat');



    useMemo(() => {
        //fetch abteilung
        if (!abteilungLoading && abteilungen.length > 0) {
            if (abteilungSlugOrId !== undefined) {
                const result = abteilungen.find(abt => abt.id === abteilungSlugOrId || abt.slug === abteilungSlugOrId);
                if (result) {
                    setAbteilung(result);
                } else {
                    message.error(`Unbekannte Abteilung ${abteilungSlugOrId}`)
                }

            } else {
                message.error(`Unbekannte Abteilung ${abteilungSlugOrId}`)
            }
        }
    }, [abteilungen])

    const [members, setMembers] = useState<AbteilungMember[]>([]);
    const [userData, setUserData] = useState<{ [uid: string]: UserData }>({});

    const [membersLoading, setMembersLoading] = useState(false);
    const [userDataLoading, setUserDataLoading] = useState(false);

    const canUpdate = ability.can('update', 'Abteilung');

    //fetch members if user has access
    useEffect(() => {
        if (!isAuthenticated || !abteilung || !canUpdate) return;
        setMembersLoading(true);
        return firestore().collection(abteilungenCollection).doc(abteilung.id).collection(abteilungenMembersCollection).onSnapshot(snap => {
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

    //fetch user data from members if user has access
    useEffect(() => {
        if (!isAuthenticated || !abteilung || !canUpdate) return;
        const loadUser = async () => {
            setUserDataLoading(true)
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
            setUserDataLoading(false)
        }

        loadUser();

    }, [members])



    const navigation = () => {
        if (!abteilung) return;
        switch (selectedMenu) {
            case 'mat':
                return <AbteilungMaterialView />
            case 'members':
                return <MemberTable abteilungId={abteilung.id} />
            case 'groups':
                return <GroupTable abteilung={abteilung}/>
            case 'settings':
                return <AbteilungSettings abteilung={abteilung} />
        }
    }


    if (abteilungLoading || !abteilung) return <Spin />

    return <div className={classNames(appStyles['flex-grower'])}>
        <MembersContext.Provider value={{ members, loading: membersLoading }}>
            <MembersUserDataContext.Provider value={{ userData, loading: userDataLoading }}>
                <PageHeader title={`Abteilung ${abteilung?.name}`}>
                    <Menu onClick={(e) => { setSelectedMenu(e.key as any) }} selectedKeys={[selectedMenu]} mode='horizontal'>
                        <Menu.Item key='mat' icon={<ContainerOutlined />}>
                            Material
                        </Menu.Item>
                        {canUpdate && <Menu.Item key='members' icon={<TeamOutlined />}>
                            Mitglieder
                        </Menu.Item>
                        }
                        {canUpdate && <Menu.Item key='groups' icon={<TagsOutlined />}>
                            Gruppen
                        </Menu.Item>
                        }
                        {canUpdate && <Menu.Item key='settings' icon={<SettingOutlined />}>
                            Einstellungen
                        </Menu.Item>
                        }

                    </Menu>
                    {
                        navigation()
                    }

                </PageHeader>
            </MembersUserDataContext.Provider>
        </MembersContext.Provider>
    </div>

}