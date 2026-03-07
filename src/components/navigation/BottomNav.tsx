import React, { useContext, useMemo } from 'react';
import {
    ContainerOutlined,
    ShoppingCartOutlined,
    UnorderedListOutlined,
    SearchOutlined,
    MenuOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router';
import { useUser } from 'hooks/use-user';
import { useTranslation } from 'react-i18next';
import { MobileNavContext } from 'contexts/MobileNavContext';
import styles from './BottomNav.module.scss';
import classNames from 'classnames';

export const BOTTOM_NAV_HEIGHT = 56;

interface BottomNavProps {
    onMenuClick: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onMenuClick }) => {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const { t } = useTranslation();
    const userState = useUser();
    const { cartCount } = useContext(MobileNavContext);

    const currentAbteilungSlug = useMemo(() => {
        const match = pathname.match(/^\/abteilungen\/([^/]+)/);
        if (match) return match[1];
        return userState.appUser?.userData?.defaultAbteilung;
    }, [pathname, userState.appUser?.userData?.defaultAbteilung]);

    const navigateToAbteilungTab = (tab: string) => {
        if (currentAbteilungSlug) {
            navigate(`/abteilungen/${currentAbteilungSlug}/${tab}`);
        } else {
            navigate('/abteilungen');
        }
    };

    const getActiveKey = (): string => {
        if (pathname.includes('/suche')) return 'search';
        if (pathname.match(/\/abteilungen\/[^/]+\/cart/)) return 'cart';
        if (pathname.match(/\/abteilungen\/[^/]+\/orders/) ||
            pathname.match(/\/abteilungen\/[^/]+\/order/)) return 'orders';
        if (pathname.match(/\/abteilungen\/[^/]+\/mat/) ||
            pathname.match(/\/abteilungen\/[^/]+$/)) return 'materials';
        return '';
    };

    const activeKey = getActiveKey();

    const items = [
        {
            key: 'menu',
            icon: <MenuOutlined />,
            label: t('navigation:bottomNav.menu', 'Menu'),
            onClick: onMenuClick,
        },
        {
            key: 'materials',
            icon: <ContainerOutlined />,
            label: t('abteilung:tabs.material'),
            onClick: () => navigateToAbteilungTab('mat'),
        },
        {
            key: 'cart',
            icon: (
                <span className={styles['cart-icon-wrapper']}>
                    <ShoppingCartOutlined />
                    {cartCount > 0 && (
                        <span className={styles['cart-badge']}>{cartCount}</span>
                    )}
                </span>
            ),
            label: t('abteilung:tabs.cart', 'Warenkorb'),
            onClick: () => navigateToAbteilungTab('cart'),
        },
        {
            key: 'orders',
            icon: <UnorderedListOutlined />,
            label: t('abteilung:tabs.bestellungen'),
            onClick: () => navigateToAbteilungTab('orders'),
        },
        {
            key: 'search',
            icon: <SearchOutlined />,
            label: t('navigation:routes.search'),
            onClick: () => navigate('/suche'),
        },
    ];

    return (
        <nav className={classNames(styles['bottom-nav'])}>
            {items.map(item => (
                <button
                    key={item.key}
                    className={classNames(
                        styles['bottom-nav-item'],
                        { [styles['active']]: activeKey === item.key }
                    )}
                    onClick={item.onClick}
                >
                    <span className={styles['bottom-nav-icon']}>{item.icon}</span>
                    <span className={styles['bottom-nav-label']}>{item.label}</span>
                </button>
            ))}
        </nav>
    );
};
