import { useState, useMemo, useEffect } from 'react';
import { Abteilung, AbteilungMember } from 'types/abteilung.type';
import { db } from 'config/firebase/firebase';
import { collection, doc, getDoc, query, where } from 'firebase/firestore';
import {
    abteilungenCategoryCollection,
    abteilungenCollection,
    abteilungenInvitationsCollection,
    abteilungenMaterialsCollection,
    abteilungenMembersCollection,
    abteilungenStandortCollection,
    usersCollection
} from 'config/firebase/collections';
import { useFirestoreCollection } from 'hooks/useFirestoreCollection';
import { ability } from 'config/casl/ability';
import { useAuth0 } from '@auth0/auth0-react';
import { UserData } from 'types/user.type';
import { Categorie } from 'types/categorie.types';
import { Material } from 'types/material.types';
import { Standort } from 'types/standort.types';
import { Invitation } from 'types/invitation.types';
import {
    MembersContext,
    MembersUserDataContext,
    CategorysContext,
    StandorteContext,
    MaterialsContext,
    InvitationsContext,
} from 'contexts/AbteilungContexts';

interface AbteilungDataProviderProps {
    abteilung: Abteilung;
    children: React.ReactNode;
}

export const AbteilungDataProvider = ({ abteilung, children }: AbteilungDataProviderProps) => {
    const { isAuthenticated } = useAuth0();

    const canUpdate = useMemo(() => ability.can('update', { __caslSubjectType__: 'Abteilung', id: abteilung.id } as Abteilung), [abteilung]);
    const canRead = useMemo(() => ability.can('read', { __caslSubjectType__: 'Abteilung', id: abteilung.id } as Abteilung), [abteilung]);

    const [userData, setUserData] = useState<{ [uid: string]: UserData }>({});
    const [userDataLoading, setUserDataLoading] = useState(false);

    const { data: members, loading: membersLoading } = useFirestoreCollection<AbteilungMember>({
        ref: collection(db, abteilungenCollection, abteilung.id, abteilungenMembersCollection),
        enabled: isAuthenticated && canRead,
        transform: (data, id) => ({ ...data, __caslSubjectType__: 'AbteilungMember', userId: id } as AbteilungMember),
        deps: [isAuthenticated, abteilung, canRead],
    });

    const { data: categories, loading: catLoading } = useFirestoreCollection<Categorie>({
        ref: collection(db, abteilungenCollection, abteilung.id, abteilungenCategoryCollection),
        enabled: isAuthenticated && canRead,
        transform: (data, id) => ({ ...data, __caslSubjectType__: 'Categorie', id } as Categorie),
        deps: [isAuthenticated, abteilung, canRead],
    });

    const { data: standorte, loading: standorteLoading } = useFirestoreCollection<Standort>({
        ref: collection(db, abteilungenCollection, abteilung.id, abteilungenStandortCollection),
        enabled: isAuthenticated && canRead,
        transform: (data, id) => ({ ...data, __caslSubjectType__: 'Standort', id } as Standort),
        deps: [isAuthenticated, abteilung, canRead],
    });

    const { data: materials, loading: matLoading } = useFirestoreCollection<Material>({
        ref: collection(db, abteilungenCollection, abteilung.id, abteilungenMaterialsCollection),
        enabled: isAuthenticated && canRead,
        transform: (data, id) => ({ ...data, __caslSubjectType__: 'Material', id } as Material),
        deps: [isAuthenticated, abteilung, canRead],
    });

    const { data: invitations, loading: invitationsLoading } = useFirestoreCollection<Invitation>({
        ref: canUpdate
            ? query(
                collection(db, abteilungenCollection, abteilung.id, abteilungenInvitationsCollection),
                where('status', '==', 'pending')
            )
            : null,
        enabled: isAuthenticated && canUpdate,
        transform: (data, id) => ({ ...data, __caslSubjectType__: 'Invitation', id } as Invitation),
        deps: [isAuthenticated, abteilung, canUpdate],
    });

    //fetch user data from members if user has access
    useEffect(() => {
        if (!isAuthenticated || !canRead) return;
        const loadUser = async () => {
            setUserDataLoading(true);
            const localUserData: { [uid: string]: UserData } = {};

            // Build basic userData from member displayNames (available to all members)
            members.forEach(member => {
                localUserData[member.userId] = {
                    __caslSubjectType__: 'UserData',
                    id: member.userId,
                    displayName: member.displayName || member.userId,
                } as UserData;
            });

            // For admins/staff, fetch full user data from users collection
            if (canUpdate) {
                const promises: Promise<UserData>[] = [];
                members.forEach(member => {
                    const uid = member.userId;
                    const userDoc = getDoc(doc(db, usersCollection, uid)).then((d) => ({
                        ...d.data(),
                        __caslSubjectType__: 'UserData',
                        id: d.id
                    } as UserData));
                    promises.push(userDoc);
                });

                const values = await Promise.all(promises);
                values.forEach(val => {
                    localUserData[val.id] = val;
                });
            }

            setUserData(localUserData);
            setUserDataLoading(false);
        };

        loadUser();
    }, [members]);

    return (
        <MembersContext.Provider value={{ members, loading: membersLoading }}>
            <MembersUserDataContext.Provider value={{ userData, loading: userDataLoading }}>
                <CategorysContext.Provider value={{ categories, loading: catLoading }}>
                    <MaterialsContext.Provider value={{ materials, loading: matLoading }}>
                        <StandorteContext.Provider value={{ standorte, loading: standorteLoading }}>
                            <InvitationsContext.Provider value={{ invitations, loading: invitationsLoading }}>
                                {children}
                            </InvitationsContext.Provider>
                        </StandorteContext.Provider>
                    </MaterialsContext.Provider>
                </CategorysContext.Provider>
            </MembersUserDataContext.Provider>
        </MembersContext.Provider>
    );
};
