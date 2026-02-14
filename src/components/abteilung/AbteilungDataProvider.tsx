import { useState, useMemo, useEffect } from 'react';
import { Abteilung, AbteilungMember } from 'types/abteilung.type';
import { db } from 'config/firebase/firebase';
import { collection, doc, getDoc } from 'firebase/firestore';
import {
    abteilungenCategoryCollection,
    abteilungenCollection,
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
import {
    MembersContext,
    MembersUserDataContext,
    CategorysContext,
    StandorteContext,
    MaterialsContext,
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
        enabled: isAuthenticated && canUpdate,
        transform: (data, id) => ({ ...data, __caslSubjectType__: 'AbteilungMember', userId: id } as AbteilungMember),
        deps: [isAuthenticated, abteilung, canUpdate],
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

    //fetch user data from members if user has access
    useEffect(() => {
        if (!isAuthenticated || !canUpdate) return;
        const loadUser = async () => {
            setUserDataLoading(true);
            const promises: Promise<UserData>[] = [];
            const localUserData = userData;
            members.forEach(member => {
                const uid = member.userId;
                if (!userData[uid]) {
                    const userDoc = getDoc(doc(db, usersCollection, uid)).then((d) => ({
                        ...d.data(),
                        __caslSubjectType__: 'UserData',
                        id: d.id
                    } as UserData));
                    promises.push(userDoc);
                }
            });

            const values = await Promise.all(promises);
            values.forEach(val => {
                localUserData[val.id] = val;
            });
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
                            {children}
                        </StandorteContext.Provider>
                    </MaterialsContext.Provider>
                </CategorysContext.Provider>
            </MembersUserDataContext.Provider>
        </MembersContext.Provider>
    );
};
