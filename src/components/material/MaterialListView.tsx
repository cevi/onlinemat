import React, { useState } from 'react';
import { List, Image, Modal, Button, Tag, Badge } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';
import { Material } from 'types/material.types';
import { Categorie } from 'types/categorie.types';
import { getAvailableMatCount } from 'util/MaterialUtil';
import { ViewMaterial } from './ViewMaterial';
import { displayCategorieNames } from './MaterialTable';
import ceviLogoImage from 'assets/onlinemat_logo.png';
import { useUser } from 'hooks/use-user';
import { useTranslation } from 'react-i18next';
import styles from './MaterialListView.module.scss';
import classNames from 'classnames';

export interface MaterialListViewProps {
    abteilungId: string;
    material: Material[];
    categorie: Categorie[];
    addToCart: (mat: Material) => void;
}

export const MaterialListView: React.FC<MaterialListViewProps> = ({
    abteilungId,
    material,
    categorie,
    addToCart,
}) => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [activeRecord, setActiveRecord] = useState<Material>();
    const userState = useUser();
    const { t } = useTranslation();

    const filteredMaterials = (userState.appUser?.userData?.roles || {})[abteilungId]?.includes('guest')
        ? material.filter(m => !m.onlyLendInternal)
        : material;

    const getThumbUrl = (mat: Material): string => {
        return mat.imageUrls && mat.imageUrls.length > 0 ? mat.imageUrls[0] : ceviLogoImage;
    };

    return (
        <>
            <List
                dataSource={filteredMaterials}
                renderItem={(mat) => {
                    const available = getAvailableMatCount(mat);
                    const categoryText = displayCategorieNames(categorie, mat.categorieIds || []);
                    return (
                        <List.Item
                            className={classNames(styles['list-item'])}
                            actions={[
                                <Button
                                    key="cart"
                                    type="primary"
                                    size="small"
                                    icon={<ShoppingCartOutlined />}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        addToCart(mat);
                                    }}
                                />,
                            ]}
                            onClick={() => {
                                setActiveRecord(mat);
                                setIsModalVisible(true);
                            }}
                        >
                            <List.Item.Meta
                                avatar={
                                    <Image
                                        src={getThumbUrl(mat)}
                                        width={48}
                                        height={48}
                                        preview={false}
                                        style={{ objectFit: 'cover', borderRadius: 4 }}
                                    />
                                }
                                title={
                                    <span className={styles['item-title']}>
                                        {mat.name}
                                        <Badge
                                            count={available}
                                            showZero
                                            style={{
                                                backgroundColor: available > 0 ? '#52c41a' : '#f5222d',
                                                marginLeft: 8,
                                                fontSize: 11,
                                            }}
                                        />
                                    </span>
                                }
                                description={
                                    categoryText !== '-' ? (
                                        <Tag style={{ fontSize: 11 }}>{categoryText}</Tag>
                                    ) : undefined
                                }
                            />
                        </List.Item>
                    );
                }}
            />
            <Modal
                title={activeRecord?.name}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={[
                    <Button key="cart" type="primary" icon={<ShoppingCartOutlined />}
                        onClick={() => { if (activeRecord) addToCart(activeRecord); }}>
                        {t('material:table.cart')}
                    </Button>,
                    <Button key="close" onClick={() => setIsModalVisible(false)}>
                        {t('common:buttons.cancel')}
                    </Button>,
                ]}
            >
                <ViewMaterial material={activeRecord} />
            </Modal>
        </>
    );
};
