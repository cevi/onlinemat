import { useState, useContext, useMemo, useEffect } from 'react';
import { Spin, message, Menu, Row, Col, Typography } from 'antd';
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
import { AbteilungenContext } from 'components/navigation/NavigationMenu';

import { AbteilungMaterialView } from 'views/abteilung/material/abteilungMaterials';
import { AbteilungSettings } from './settings/AbteilungSettings';
import { NoAccessToAbteilung } from './AbteilungNoAccess';
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
} from 'contexts/AbteilungContexts';

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
    const initTab: AbteilungTab = validTabs.includes(tab as AbteilungTab) ? (tab as AbteilungTab) : 'mat';

    const abteilungenContext = useContext(AbteilungenContext);
    const abteilungen = abteilungenContext.abteilungen;
    const abteilungLoading = abteilungenContext.loading;

    const [windowSize] = useState([
        window.innerWidth,
        window.innerHeight,
    ]);

    const [abteilung, setAbteilung] = useState<Abteilung | undefined>(undefined);
    const [selectedMenu] = useState<AbteilungTab>(initTab);

    const [cookies] = useCookies();
    const [cartItems, setCartItems] = useState<CartItem[]>([]);

    const canUpdate = useMemo(() => ability.can('update', { __caslSubjectType__: 'Abteilung', id: abteilung?.id } as Abteilung), [abteilung]);

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
                    message.error(t('abteilung:errors.unknown', { id: abteilungSlugOrId }))
                }

            } else {
                message.error(t('abteilung:errors.unknown', { id: abteilungSlugOrId }))
            }
        }
    }, [abteilungen, abteilungLoading, abteilungSlugOrId])

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
                    return <Orders abteilung={abteilung} cartItems={cartItems} changeCart={changeCart} />
                case 'order':
                    return <OrderView abteilung={abteilung} cartItems={cartItems} changeCart={changeCart} />
                case 'standort':
                    return <AbteilungStandorteView abteilung={abteilung} />
                case 'category':
                    return <AbteilungCategoryView abteilung={abteilung} />
            }
        } else {
            switch (selectedMenu) {
                case 'mat':
                    return <AbteilungMaterialView abteilung={abteilung} cartItems={cartItems} changeCart={changeCart} />
                case 'cart':
                    return <Cart abteilung={abteilung} cartItems={cartItems} changeCart={changeCart} />
            }
        }

    }


    if (abteilungLoading || !abteilung) return <Spin />

    return <div className={classNames(appStyles['flex-grower'])}>
        <AbteilungDataProvider abteilung={abteilung}>
            <Typography.Title level={3}>{t('abteilung:detailTitle', { name: abteilung?.name })}</Typography.Title>
            <Menu
                onClick={(e) => { navigateToMenu(e.key as AbteilungTab) }}
                selectedKeys={[selectedMenu]}
                mode='horizontal'
                items={[
                    { key: 'mat', icon: <ContainerOutlined />, label: t('abteilung:tabs.material') },
                    ...(windowSize[0] > 768 ? [
                        { key: 'standort', icon: <HomeOutlined />, label: t('abteilung:tabs.standorte') },
                        { key: 'category', icon: <PaperClipOutlined />, label: t('abteilung:tabs.kategorien') },
                        { key: 'orders', icon: <UnorderedListOutlined />, label: t('abteilung:tabs.bestellungen') },
                        { key: 'groups', icon: <TagsOutlined />, label: t('abteilung:tabs.gruppen') },
                        ...(canUpdate ? [
                            { key: 'members', icon: <TeamOutlined />, label: t('abteilung:tabs.mitglieder') },
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
