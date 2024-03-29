import { useState, useContext, useMemo, useEffect, createContext } from 'react';
import { PageHeader, Spin, message, Menu, Row, Col } from 'antd';
import classNames from 'classnames';
import appStyles from 'styles.module.scss';
import { Abteilung, AbteilungMember } from 'types/abteilung.type';
import { firestore } from 'config/firebase/firebase';
import {
    abteilungenCategoryCollection,
    abteilungenCollection,
    abteilungenMaterialsCollection,
    abteilungenMembersCollection,
    abteilungenStandortCollection,
    usersCollection
} from 'config/firebase/collections';
import { useLocation, useNavigate, useParams } from 'react-router';
import {
    ContainerOutlined,
    HomeOutlined, PaperClipOutlined,
    SettingOutlined,
    ShoppingCartOutlined,
    TagsOutlined,
    TeamOutlined,
    UnorderedListOutlined
} from '@ant-design/icons';
import { ability } from 'config/casl/ability';
import { AbteilungenContext } from 'components/navigation/NavigationMenu';
import { useAuth0 } from '@auth0/auth0-react';
import { UserData } from 'types/user.type';
import { AbteilungMaterialView } from 'views/abteilung/material/abteilungMaterials';
import { AbteilungSettings } from './settings/AbteilungSettings';
import { NoAccessToAbteilung } from './AbteilungNoAccess';
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
import {Standort} from "../../types/standort.types";
import {AbteilungStandorteView} from "../../views/abteilung/standort/abteilungStandorte";
import {AbteilungCategoryView} from "../../views/abteilung/category/abteilungCategory";


export interface AbteilungDetailProps {
}

export type AbteilungDetailViewParams = {
    abteilungSlugOrId: string;
    tab: string
};

export const MembersContext = createContext<{ members: AbteilungMember[], loading: boolean }>({ loading: false, members: [] });
export const MembersUserDataContext = createContext<{ userData: { [uid: string]: UserData }, loading: boolean }>({ loading: false, userData: {} });
export const CategorysContext = createContext<{ categories: Categorie[], loading: boolean }>({ loading: false, categories: [] });
export const StandorteContext = createContext<{ standorte: Standort[], loading: boolean }>({ loading: false, standorte: [] });
export const MaterialsContext = createContext<{ materials: Material[], loading: boolean }>({ loading: false, materials: [] });
//export const CartContext = createContext<Cart | undefined>(undefined);


export type AbteilungTab = 'mat' | 'settings' | 'members' | 'groups' | 'cart' | 'orders' | 'order' | 'standort' | 'category';


export const AbteilungDetail = (props: AbteilungDetailProps) => {

    const { abteilungSlugOrId, tab } = useParams<AbteilungDetailViewParams>();
    const { isAuthenticated } = useAuth0();
    const navigate = useNavigate();
    const { state } = useLocation();

    const initTab: AbteilungTab = tab as AbteilungTab || 'mat';

    const abteilungenContext = useContext(AbteilungenContext);
    const abteilungen = abteilungenContext.abteilungen;
    const abteilungLoading = abteilungenContext.loading;

    const [windowSize] = useState([
        window.innerWidth,
        window.innerHeight,
    ]);

    const [abteilung, setAbteilung] = useState<Abteilung | undefined>(undefined);
    const [selectedMenu] = useState<AbteilungTab>(initTab);

    const [members, setMembers] = useState<AbteilungMember[]>([]);
    const [userData, setUserData] = useState<{ [uid: string]: UserData }>({});

    const [membersLoading, setMembersLoading] = useState(false);
    const [userDataLoading, setUserDataLoading] = useState(false);

    const [catLoading, setCatLoading] = useState(false);
    const [categories, setCategories] = useState<Categorie[]>([])

    const [matLoading, setMatLoading] = useState(false);
    const [materials, setMaterials] = useState<Material[]>([]);

    const [standorteLoading, setStandorteLoading] = useState(false);
    const [standorte, setStandorte] = useState<Standort[]>([]);

    const [cookies] = useCookies();
    const [cartItems, setCartItems] = useState<CartItem[]>(state as CartItem[] || []);


    const canUpdate = useMemo(()=> ability.can('update', {__caslSubjectType__: 'Abteilung', id: abteilung?.id} as Abteilung), [abteilung]);
    const canRead = useMemo(()=> ability.can('read', {__caslSubjectType__: 'Abteilung', id: abteilung?.id} as Abteilung), [abteilung]);

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
    }, [abteilung, cartItems, cookies])


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
    }, [abteilungen, abteilungLoading, abteilungSlugOrId])

    //update url
    // useMemo(() => {
    //     if (!abteilung) return;
    //     navigate(`/abteilungen/${abteilung.slug || abteilung.id}/${selectedMenu}`, {
    //         state: cartItems
    //     })
    // }, [selectedMenu])

    const navigateToMenu = (selectedMenu: AbteilungTab) => {
        if (!abteilung) return;
        navigate(`/abteilungen/${abteilung.slug || abteilung.id}/${selectedMenu}`, {
            state: cartItems
        })
    }


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
            console.error('Es ist ein Fehler aufgetreten', err)
        });
    }, [isAuthenticated, abteilung, canUpdate]);

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
        }, (err) => {
            message.error(`Es ist ein Fehler aufgetreten ${err}`)
            console.error('Es ist ein Fehler aufgetreten', err)
        });
    }, [isAuthenticated]);

    //fetch standorte
    useEffect(() => {
        if (!isAuthenticated || !abteilung || !canRead) return;
        setStandorteLoading(true);
        return firestore().collection(abteilungenCollection).doc(abteilung.id).collection(abteilungenStandortCollection).onSnapshot(snap => {
            setStandorteLoading(false);
            const standorteLoaded = snap.docs.flatMap(doc => {
                return {
                    ...doc.data(),
                    __caslSubjectType__: 'Standort',
                    id: doc.id
                } as Standort;
            });
            setStandorte(standorteLoaded);
        }, (err) => {
            message.error(`Es ist ein Fehler aufgetreten ${err}`)
            console.error('Es ist ein Fehler aufgetreten', err)
        });
    }, [isAuthenticated]);

    //fetch material
    useEffect(() => {
        if (!isAuthenticated || !abteilung || !canRead) return;
        setMatLoading(true);
        return firestore().collection(abteilungenCollection).doc(abteilung.id).collection(abteilungenMaterialsCollection).onSnapshot(snap => {
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
            console.error('Es ist ein Fehler aufgetreten', err)
        });
    }, [isAuthenticated]);

    //set Page title
    useEffect(() => {
        if(!abteilung) return;
        document.title = `Onlinemat | ${abteilung.name}`

    }, [abteilung])

    //unset the title on umount
    useEffect(() => {
        return () => {
            document.title = 'Onlinemat';
          };
    }, [])


    const navigation = () => {
        if (!abteilung) return;

        if (ability.cannot('read', abteilung)) {
            return <NoAccessToAbteilung abteilung={abteilung} />
        }

        if (windowSize[0] > 768) {
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
                case 'standort':
                    return <AbteilungStandorteView abteilung={abteilung} />
                case 'category':
                    return <AbteilungCategoryView abteilung={abteilung} />
            }
        } else {
            switch (selectedMenu) {
                case 'mat':
                    return <AbteilungMaterialView abteilung={abteilung} cartItems={cartItems} changeCart={changeCart}/>
                case 'cart':
                    return <Cart abteilung={abteilung} cartItems={cartItems} changeCart={changeCart}/>
            }
        }

    }


    if (abteilungLoading || !abteilung) return <Spin />

    return <div className={classNames(appStyles['flex-grower'])}>
        <MembersContext.Provider value={{ members, loading: membersLoading }}>
            <MembersUserDataContext.Provider value={{ userData, loading: userDataLoading }}>
                <CategorysContext.Provider value={{ categories, loading: catLoading }}>
                    <MaterialsContext.Provider value={{ materials, loading: matLoading }}>
                        <StandorteContext.Provider value={{ standorte, loading: standorteLoading}}>
                            {/* <CartContext.Provider value={cart}> */}
                            <PageHeader title={`Abteilung ${abteilung?.name}`}>
                                <Menu onClick={(e) => { navigateToMenu(e.key as AbteilungTab) }} selectedKeys={[selectedMenu]} mode='horizontal'>
                                    <Menu.Item key='mat' icon={<ContainerOutlined />}>
                                        Material
                                    </Menu.Item>
                                    { windowSize[0] > 768 &&
                                        <>
                                            <Menu.Item key='standort' icon={<HomeOutlined />}>
                                                Standorte
                                            </Menu.Item>
                                            <Menu.Item key='category' icon={<PaperClipOutlined />}>
                                                Kategorien
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
                                        </>
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
                        </StandorteContext.Provider>
                    </MaterialsContext.Provider>
                </CategorysContext.Provider>
            </MembersUserDataContext.Provider>
        </MembersContext.Provider>
    </div>

}