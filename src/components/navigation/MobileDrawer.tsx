import React from 'react';
import { Drawer, Menu, Typography } from 'antd';
import type { MenuProps } from 'antd';
import { LanguagePicker } from 'config/i18n/LanguagePicker';
import styles from './MobileDrawer.module.scss';
import classNames from 'classnames';

interface MobileDrawerProps {
    open: boolean;
    onClose: () => void;
    menuItems: MenuProps['items'];
    selectedKeys: string[];
    abteilungMenuItems?: MenuProps['items'];
    abteilungSelectedKey?: string;
    abteilungName?: string;
    footerContent?: React.ReactNode;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
    open,
    onClose,
    menuItems,
    selectedKeys,
    abteilungMenuItems,
    abteilungSelectedKey,
    abteilungName,
    footerContent,
}) => {
    return (
        <Drawer
            placement="left"
            open={open}
            onClose={onClose}
            width={280}
            styles={{
                body: { padding: 0, backgroundColor: '#001529' },
                header: { backgroundColor: '#001529', borderBottom: '1px solid rgba(255,255,255,0.1)' },
            }}
            title={
                <Typography.Title
                    level={4}
                    style={{ color: 'rgba(255,255,255,0.9)', margin: 0 }}
                >
                    Onlinemat
                </Typography.Title>
            }
            closable
            closeIcon={<span style={{ color: 'rgba(255,255,255,0.65)' }}>✕</span>}
        >
            <div className={classNames(styles['drawer-content'])}>
                <Menu
                    mode="inline"
                    theme="dark"
                    selectedKeys={selectedKeys}
                    selectable={false}
                    items={menuItems}
                    onClick={() => onClose()}
                />
                {abteilungMenuItems && abteilungMenuItems.length > 0 && (
                    <>
                        <div className={styles['drawer-divider']} />
                        {abteilungName && (
                            <Typography.Text
                                style={{
                                    color: 'rgba(255,255,255,0.45)',
                                    fontSize: 12,
                                    padding: '8px 24px 4px',
                                    display: 'block',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                }}
                            >
                                {abteilungName}
                            </Typography.Text>
                        )}
                        <Menu
                            mode="inline"
                            theme="dark"
                            selectedKeys={abteilungSelectedKey ? [abteilungSelectedKey] : []}
                            selectable={false}
                            items={abteilungMenuItems}
                            onClick={() => onClose()}
                        />
                    </>
                )}
                <div className={styles['drawer-footer']}>
                    <LanguagePicker collapsed={false} />
                    {footerContent && (
                        <div className={styles['drawer-footer-content']}>
                            {footerContent}
                        </div>
                    )}
                </div>
            </div>
        </Drawer>
    );
};
