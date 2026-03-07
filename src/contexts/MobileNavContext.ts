import { createContext } from 'react';
import type { MenuProps } from 'antd';

interface MobileNavContextType {
    abteilungMenuItems: MenuProps['items'];
    abteilungSelectedKey: string;
    abteilungName: string;
    cartCount: number;
    setAbteilungMenuItems: (items: MenuProps['items']) => void;
    setAbteilungSelectedKey: (key: string) => void;
    setAbteilungName: (name: string) => void;
    setCartCount: (count: number) => void;
}

export const MobileNavContext = createContext<MobileNavContextType>({
    abteilungMenuItems: [],
    abteilungSelectedKey: '',
    abteilungName: '',
    cartCount: 0,
    setAbteilungMenuItems: () => {},
    setAbteilungSelectedKey: () => {},
    setAbteilungName: () => {},
    setCartCount: () => {},
});
