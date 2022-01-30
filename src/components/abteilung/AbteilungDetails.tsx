import { useState, useContext, useMemo, useEffect, createContext } from 'react';
import { PageHeader, Spin, message, Menu, Row, Col } from 'antd';
import classNames from 'classnames';
import appStyles from 'styles.module.scss';
import { Abteilung, AbteilungMember } from 'types/abteilung.type';
import { firestore } from 'config/firebase/firebase';
import { abteilungenCategoryCollection, abteilungenCollection, abteilungenMaterialsCollection, abteilungenMembersCollection, usersCollection } from 'config/firebase/collections';
import { useLocation, useNavigate, useParams } from 'react-router';
import { ContainerOutlined, SettingOutlined, ShoppingCartOutlined, TagsOutlined, TeamOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { ability } from 'config/casl/ability';
import { AbteilungenContext } from 'components/navigation/NavigationMenu';
import { useAuth0 } from '@auth0/auth0-react';
import { UserData } from 'types/user.type';
import { AbteilungMaterialView } from 'views/abteilung/material/abteilungMaterials';
import { AbteilungSettings } from './settings/AbteilungSettings';
import { NoAccessToAbteilung } from './AbteilungNoAcceess';
import { Categorie } from 'types/categorie.types';
import { Material } from 'types/material.types';
import { CartItem } from 'types/cart.types';
import { cookieToCart, getCartCount, getCartName } from 'util/CartUtil';
import { useCookies } from 'react-cookie';
import { Cart } from './cart/Cart';
import { Group } from './group/Group';
import { Member } from './members/Member';
import { Orders } from './order/Orders';
import { OrderView } from './order/OrderView';


export interface AbteilungDetailProps {
}

export type AbteilungDetailViewParams = {
    abteilungSlugOrId: string;
    tab: string
};

export const MembersContext = createContext<{ members: AbteilungMember[], loading: boolean }>({ loading: false, members: [] });
export const MembersUserDataContext = createContext<{ userData: { [uid: string]: UserData }, loading: boolean }>({ loading: false, userData: {} });
export const CategorysContext = createContext<{ categories: Categorie[], loading: boolean }>({ loading: false, categories: [] });
export const MaterialsContext = createContext<{ materials: Material[], loading: boolean }>({ loading: false, materials: [] });
//export const CartContext = createContext<Cart | undefined>(undefined);


export type AbteilungTab = 'mat' | 'settings' | 'members' | 'groups' | 'cart' | 'orders' | 'order';


export const AbteilungDetail = (props: AbteilungDetailProps) => {

    const { abteilungSlugOrId, tab } = useParams<AbteilungDetailViewParams>();
    const { isAuthenticated } = useAuth0();
    const navigate = useNavigate();
    const { state } = useLocation();

    const initTab: AbteilungTab = tab as AbteilungTab || 'mat';

    const abteilungenContext = useContext(AbteilungenContext);

    const abteilungen = abteilungenContext.abteilungen;
    const abteilungLoading = abteilungenContext.loading;

    const [abteilung, setAbteilung] = useState<Abteilung | undefined>(undefined);
    const [selectedMenu, setSelectedMenu] = useState<AbteilungTab>(initTab);


    const [members, setMembers] = useState<AbteilungMember[]>([]);
    const [userData, setUserData] = useState<{ [uid: string]: UserData }>({});

    const [membersLoading, setMembersLoading] = useState(false);
    const [userDataLoading, setUserDataLoading] = useState(false);

    const [catLoading, setCatLoading] = useState(false);
    const [categories, setCategories] = useState<Categorie[]>([])

    const [matLoading, setMatLoading] = useState(false);
    const [materials, setMaterials] = useState<Material[]>([]);


    const [cookies] = useCookies();

    const [cartItems, setCartItems] = useState<CartItem[]>(state as CartItem[] || []);

    const canUpdate = ability.can('update', 'Abteilung');
    const canRead = ability.can('read', 'Abteilung');

    //force rerender if cart changed
    const changeCart = (cartToChange: CartItem[]) => {
        setCartItems(cartToChange)
    }

    //fetch cart from cookie, if there
    useEffect(() => {
        if (!abteilung || !cartItems || cartItems.length >= 1) return;

        const cookieName = getCartName(abteilung.id);
        const cookieRaw = cookies[cookieName];
        if (!cookieRaw) return;
        const cookieCart = cookieToCart(cookieRaw, abteilung.id)
        setCartItems(cookieCart)
    }, [])


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

    //update url
    useMemo(() => {
        if (!abteilung) return;
        navigate(`/abteilungen/${abteilung.slug || abteilung.id}/${selectedMenu}`, {
            state: cartItems
        })
    }, [selectedMenu])


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

    //fetch categories
    useEffect(() => {
        if (!isAuthenticated || !abteilung || !canRead) return;
        setCatLoading(true);
        return firestore().collection(abteilungenCollection).doc(abteilung.id).collection(abteilungenCategoryCollection).onSnapshot(snap => {
            setCatLoading(false);
            const categoriesLoaded = snap.docs.flatMap(doc => {
                return {
                    ...doc.data(),
                    __caslSubjectType__: 'Categorie',
                    id: doc.id
                } as Categorie;
            });
            setCategories(categoriesLoaded);
        });
    }, [isAuthenticated]);

    //fetch material
    useEffect(() => {
        if (!isAuthenticated || !abteilung || !canRead) return;
        setMatLoading(true);
        firestore().collection(abteilungenCollection).doc(abteilung.id).collection(abteilungenMaterialsCollection).onSnapshot(snap => {
            setMatLoading(false);
            const materialLoaded = snap.docs.flatMap(doc => {
                return {
                    ...doc.data(),
                    __caslSubjectType__: 'Material',
                    id: doc.id
                } as Material;
            });
            setMaterials(materialLoaded);
        }, (err) => {
            message.error(`Es ist ein Fehler aufgetreten ${err}`)
        });
    }, [isAuthenticated]);



    const navigation = () => {
        if (!abteilung) return;

        if (ability.cannot('read', abteilung)) {
            return <NoAccessToAbteilung abteilung={abteilung} />
        }

        switch (selectedMenu) {
            case 'mat':
                return <AbteilungMaterialView abteilung={abteilung} cartItems={cartItems} changeCart={changeCart} />
            case 'members':
                return <Member abteilungId={abteilung.id} />
            case 'groups':
                return <Group abteilung={abteilung} />
            case 'settings':
                return <AbteilungSettings abteilung={abteilung} />
            case 'cart':
                return <Cart abteilung={abteilung} cartItems={cartItems} changeCart={changeCart} />
            case 'orders':
                return <Orders abteilung={abteilung}/>
            case 'order':
                return <OrderView abteilung={abteilung}/>
        }
    }


    if (abteilungLoading || !abteilung) return <Spin />

    return <div className={classNames(appStyles['flex-grower'])}>
        <MembersContext.Provider value={{ members, loading: membersLoading }}>
            <MembersUserDataContext.Provider value={{ userData, loading: userDataLoading }}>
                <CategorysContext.Provider value={{ categories, loading: catLoading }}>
                    <MaterialsContext.Provider value={{ materials, loading: matLoading }}>
                        {/* <CartContext.Provider value={cart}> */}
                        <PageHeader title={`Abteilung ${abteilung?.name}`}>
                            <Menu onClick={(e) => { setSelectedMenu(e.key as AbteilungTab) }} selectedKeys={[selectedMenu]} mode='horizontal'>
                                <Menu.Item key='mat' icon={<ContainerOutlined />}>
                                    Material
                                </Menu.Item>
                                <Menu.Item key='orders' icon={<UnorderedListOutlined />}>
                                    Bestellungen
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
                                {
                                    // right menu
                                }
                                <Menu.Item key='cart' icon={<ShoppingCartOutlined />} style={{ marginLeft: 'auto' }}>
                                    {
                                        getCartCount(cartItems)
                                    }
                                </Menu.Item>

                            </Menu>
                            <Row gutter={[16, 24]}>
                                <Col span={24}></Col>
                                <Col span={24}>
                                    {
                                        navigation()
                                    }
                                </Col>
                            </Row>


                        </PageHeader>
                        {/* </CartContext.Provider> */}
                    </MaterialsContext.Provider>
                </CategorysContext.Provider>
            </MembersUserDataContext.Provider>
        </MembersContext.Provider>
    </div>

}