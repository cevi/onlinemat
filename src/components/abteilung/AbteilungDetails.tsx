import { useState, useContext, useMemo, useEffect } from 'react';
import { Alert, Badge, Spin, message, Menu, Row, Col, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import type { MenuProps } from 'antd';
import classNames from 'classnames';
import appStyles from 'styles.module.scss';
import { Abteilung } from 'types/abteilung.type';
import { CartItem } from 'types/cart.types';
import { cookieToCart, getCartCount, getCartName } from 'util/CartUtil';
import { useCookies } from 'react-cookie';
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
import { httpsCallable } from 'firebase/functions';
import { db, functions } from 'config/firebase/firebase';
import { collection, query as firestoreQuery, where } from 'firebase/firestore';
import { abteilungenCollection, abteilungenOrdersCollection } from 'config/firebase/collections';
import { useFirestoreCollection } from 'hooks/useFirestoreCollection';
import { useAuth0 } from '@auth0/auth0-react';
import { Order } from 'types/order.types';
import { AbteilungenContext } from 'components/navigation/NavigationMenu';
import { useUser } from 'hooks/use-user';
import { useIsMobile } from 'hooks/useIsMobile';
import { MobileNavContext } from 'contexts/MobileNavContext';

import { AbteilungMaterialView } from 'views/abteilung/material/abteilungMaterials';
import { AbteilungSettings } from './settings/AbteilungSettings';
import { NoAccessToAbteilung } from './AbteilungNoAccess';
import { JoinAbteilungButton } from './join/JoinAbteilung';
import { Cart } from './cart/Cart';
import { Group } from './group/Group';
import { Member } from './members/Member';
import { Orders } from './order/Orders';
import { OrderView } from './order/OrderView';
import { AbteilungStandorteView } from '../../views/abteilung/standort/abteilungStandorte';
import { AbteilungCategoryView } from '../../views/abteilung/category/abteilungCategory';
import { AbteilungDataProvider } from './AbteilungDataProvider';

// Re-export contexts for backward compatibility
export {
    MembersContext,
    MembersUserDataContext,
    CategorysContext,
    StandorteContext,
    MaterialsContext,
    InvitationsContext,
} from 'contexts/AbteilungContexts';
import { MembersContext } from 'contexts/AbteilungContexts';

/** Rendered inside AbteilungDataProvider to consume MembersContext for the badge count. */
const MembersTabLabel = () => {
    const { t } = useTranslation();
    const { members } = useContext(MembersContext);
    const pendingCount = members.filter(m => !m.approved && !m.banned).length;
    return (
        <Badge count={pendingCount} size="small" offset={[6, -2]}>
            <span>{t('abteilung:tabs.mitglieder')}</span>
        </Badge>
    );
};

/** Rendered inside AbteilungDataProvider. Shows badge with pending order count for admin/matchef. */
const PendingOrdersBadge = ({ abteilungId }: { abteilungId: string }) => {
    const { t } = useTranslation();
    const { isAuthenticated } = useAuth0();

    const pendingQuery = useMemo(() => {
        if (!abteilungId) return null;
        return firestoreQuery(
            collection(db, abteilungenCollection, abteilungId, abteilungenOrdersCollection),
            where('status', '==', 'pending')
        );
    }, [abteilungId]);

    const { data: pendingOrders } = useFirestoreCollection<Order>({
        ref: pendingQuery,
        enabled: isAuthenticated && !!pendingQuery,
        transform: (data, id) => ({ ...data, id } as Order),
        deps: [isAuthenticated, pendingQuery],
    });

    return (
        <Badge count={pendingOrders.length} size="small" offset={[6, -2]}>
            <span>{t('abteilung:tabs.bestellungen')}</span>
        </Badge>
    );
};

export type AbteilungDetailViewParams = {
    abteilungSlugOrId: string;
    tab: string
};

export type AbteilungTab = 'mat' | 'settings' | 'members' | 'groups' | 'cart' | 'orders' | 'order' | 'standort' | 'category';


export const AbteilungDetail = () => {

    const { t } = useTranslation();
    const { abteilungSlugOrId, tab } = useParams<AbteilungDetailViewParams>();
    const navigate = useNavigate();
    const { state } = useLocation();

    const validTabs: AbteilungTab[] = ['mat', 'settings', 'members', 'groups', 'cart', 'orders', 'order', 'standort', 'category'];
    const selectedMenu: AbteilungTab = validTabs.includes(tab as AbteilungTab) ? (tab as AbteilungTab) : 'mat';

    const abteilungenContext = useContext(AbteilungenContext);
    const abteilungen = abteilungenContext.abteilungen;
    const abteilungLoading = abteilungenContext.loading;

    const isMobile = useIsMobile();
    const { setAbteilungMenuItems, setAbteilungSelectedKey, setAbteilungName, setCartCount } = useContext(MobileNavContext);

    const [abteilung, setAbteilung] = useState<Abteilung | undefined>(undefined);

    const [cookies] = useCookies();
    const [cartItems, setCartItems] = useState<CartItem[]>([]);

    // Auto-join as guest for searchVisible Abteilungen
    const [autoJoinLoading, setAutoJoinLoading] = useState(false);
    const [autoJoinError, setAutoJoinError] = useState(false);

    const canUpdate = useMemo(() => ability.can('update', { __caslSubjectType__: 'Abteilung', id: abteilung?.id } as Abteilung), [abteilung]);

    const userState = useUser();
    const isGuest = useMemo(() => {
        if (!abteilung) return false;
        return userState.appUser?.userData?.roles?.[abteilung.id] === 'guest';
    }, [abteilung, userState.appUser?.userData]);

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
        if (cookieCart.length === 0) return;
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
                    message.error(t('abteilung:errors.unknown', { id: abteilungSlugOrId }))
                }

            } else {
                message.error(t('abteilung:errors.unknown', { id: abteilungSlugOrId }))
            }
        }
    }, [abteilungen, abteilungLoading, abteilungSlugOrId])

    // Auto-join as guest when navigating to a searchVisible Abteilung without access
    useEffect(() => {
        if (!abteilung) return;
        if (ability.can('read', abteilung)) return;
        if (abteilung.searchVisible === false) return;
        if (autoJoinLoading || autoJoinError) return;

        const doJoin = async () => {
            setAutoJoinLoading(true);
            try {
                const result = await httpsCallable(functions, 'joinAsGuest')({ abteilungId: abteilung.id });
                const data = result.data as { alreadyMember?: boolean; joined?: boolean };
                if (data.alreadyMember) {
                    // Already a member but can't read (e.g. pending) — fall back to no-access
                    setAutoJoinError(true);
                }
                // If joined, the onSnapshot cascade will update CASL and re-render
            } catch (err) {
                console.error('Auto-join as guest failed', err);
                setAutoJoinError(true);
            }
            setAutoJoinLoading(false);
        };
        doJoin();
    }, [abteilung]);

    const navigateToMenu = (selectedMenu: AbteilungTab) => {
        if (!abteilung) return;
        navigate(`/abteilungen/${abteilung.slug || abteilung.id}/${selectedMenu}`, {
            state: cartItems
        })
    }

    //set Page title
    useEffect(() => {
        if (!abteilung) return;
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
            // SearchVisible Abteilungen: show spinner while auto-join is in progress
            if (abteilung.searchVisible !== false && !autoJoinError) {
                return <Spin />;
            }
            return <NoAccessToAbteilung abteilung={abteilung} />
        }

        switch (selectedMenu) {
            case 'mat':
                return <AbteilungMaterialView abteilung={abteilung} cartItems={cartItems} changeCart={changeCart} />
            case 'members':
                return <Member abteilung={abteilung} />
            case 'groups':
                return <Group abteilung={abteilung} />
            case 'settings':
                return <AbteilungSettings abteilung={abteilung} />
            case 'cart':
                return <Cart abteilung={abteilung} cartItems={cartItems} changeCart={changeCart} />
            case 'orders':
                return <Orders abteilung={abteilung} cartItems={cartItems} changeCart={changeCart} />
            case 'order':
                return <OrderView abteilung={abteilung} cartItems={cartItems} changeCart={changeCart} />
            case 'standort':
                return <AbteilungStandorteView abteilung={abteilung} />
            case 'category':
                return <AbteilungCategoryView abteilung={abteilung} />
        }
    }


    // Sync cart count to mobile nav context
    useEffect(() => {
        setCartCount(getCartCount(cartItems));
    }, [cartItems, setCartCount]);

    // Populate mobile drawer with abteilung-specific tabs
    useEffect(() => {
        if (!abteilung || !isMobile) {
            setAbteilungMenuItems([]);
            setAbteilungSelectedKey('');
            return;
        }

        const items: MenuProps['items'] = [
            ...(!isGuest ? [
                { key: 'standort', icon: <HomeOutlined />, label: t('abteilung:tabs.standorte'), onClick: () => navigateToMenu('standort') },
                { key: 'category', icon: <PaperClipOutlined />, label: t('abteilung:tabs.kategorien'), onClick: () => navigateToMenu('category') },
            ] : []),
            { key: 'orders', icon: <UnorderedListOutlined />, label: canUpdate ? <PendingOrdersBadge abteilungId={abteilung.id} /> : t('abteilung:tabs.bestellungen'), onClick: () => navigateToMenu('orders') },
            ...(!isGuest ? [
                { key: 'groups', icon: <TagsOutlined />, label: t('abteilung:tabs.gruppen'), onClick: () => navigateToMenu('groups') },
            ] : []),
            ...(canUpdate ? [
                { key: 'members', icon: <TeamOutlined />, label: t('abteilung:tabs.mitglieder'), onClick: () => navigateToMenu('members') },
                { key: 'settings', icon: <SettingOutlined />, label: t('abteilung:tabs.einstellungen'), onClick: () => navigateToMenu('settings') },
            ] : []),
        ];

        setAbteilungMenuItems(items);
        setAbteilungSelectedKey(selectedMenu);
        setAbteilungName(abteilung.name);

        return () => {
            setAbteilungMenuItems([]);
            setAbteilungSelectedKey('');
            setAbteilungName('');
        };
    }, [abteilung, isMobile, canUpdate, isGuest, selectedMenu, t]);

    if (abteilungLoading || !abteilung) return <Spin />

    return <div className={classNames(appStyles['flex-grower'])}>
        <AbteilungDataProvider abteilung={abteilung}>
            <Typography.Title level={3}>{t('abteilung:detailTitle', { name: abteilung?.name })}</Typography.Title>
            {isGuest && (
                <Alert
                    type="info"
                    showIcon
                    message={t('abteilung:guestBanner')}
                    action={<JoinAbteilungButton abteilungId={abteilung.id} abteilungName={abteilung.name} />}
                    style={{ marginBottom: 16 }}
                />
            )}
            <Menu
                onClick={(e) => { navigateToMenu(e.key as AbteilungTab) }}
                selectedKeys={[selectedMenu]}
                mode='horizontal'
                items={[
                    { key: 'mat', icon: <ContainerOutlined />, label: t('abteilung:tabs.material') },
                    ...(!isMobile ? [
                        ...(!isGuest ? [
                            { key: 'standort', icon: <HomeOutlined />, label: t('abteilung:tabs.standorte') },
                            { key: 'category', icon: <PaperClipOutlined />, label: t('abteilung:tabs.kategorien') },
                        ] : []),
                        { key: 'orders', icon: <UnorderedListOutlined />, label: canUpdate ? <PendingOrdersBadge abteilungId={abteilung.id} /> : t('abteilung:tabs.bestellungen') },
                        ...(!isGuest ? [
                            { key: 'groups', icon: <TagsOutlined />, label: t('abteilung:tabs.gruppen') },
                        ] : []),
                        ...(canUpdate ? [
                            { key: 'members', icon: <TeamOutlined />, label: <MembersTabLabel /> },
                            { key: 'settings', icon: <SettingOutlined />, label: t('abteilung:tabs.einstellungen') },
                        ] : []),
                    ] : []),
                    { key: 'cart', icon: <ShoppingCartOutlined />, label: getCartCount(cartItems), style: { marginLeft: 'auto' } },
                ] as MenuProps['items']}
            />
            <Row gutter={[16, 24]}>
                <Col span={24}></Col>
                <Col span={24}>
                    {
                        navigation()
                    }
                </Col>
            </Row>
        </AbteilungDataProvider>
    </div>

}
