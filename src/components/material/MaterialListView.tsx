import React, { useContext, useState } from 'react';
import { List, Image, Modal, Button, Tag, Badge, Select, Space, Collapse } from 'antd';
import { FilterOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { Material } from 'types/material.types';
import { Categorie } from 'types/categorie.types';
import { Standort } from 'types/standort.types';
import { getAvailableMatCount } from 'util/MaterialUtil';
import { ViewMaterial } from './ViewMaterial';
import { EditMaterialButton } from './EditMaterial';
import { displayCategorieNames } from './MaterialTable';
import { Can } from 'config/casl/casl';
import ceviLogoImage from 'assets/onlinemat_logo.png';
import { useUser } from 'hooks/use-user';
import { useTranslation } from 'react-i18next';
import styles from './MaterialListView.module.scss';
import classNames from 'classnames';

export interface MaterialListViewProps {
    abteilungId: string;
    material: Material[];
    categorie: Categorie[];
    standort?: Standort[];
    addToCart: (mat: Material) => void;
}

export const MaterialListView: React.FC<MaterialListViewProps> = ({
    abteilungId,
    material,
    categorie,
    standort = [],
    addToCart,
}) => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [activeRecord, setActiveRecord] = useState<Material>();
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedStandorte, setSelectedStandorte] = useState<string[]>([]);
    const [showAvailableOnly, setShowAvailableOnly] = useState(false);
    const userState = useUser();
    const { t } = useTranslation();

    const guestFiltered = (userState.appUser?.userData?.roles || {})[abteilungId]?.includes('guest')
        ? material.filter(m => !m.onlyLendInternal)
        : material;

    const filteredMaterials = guestFiltered.filter(mat => {
        if (selectedCategories.length > 0) {
            if (!mat.categorieIds || !mat.categorieIds.some(cId => selectedCategories.includes(cId))) return false;
        }
        if (selectedStandorte.length > 0) {
            if (!mat.standort || !mat.standort.some(sId => selectedStandorte.includes(sId))) return false;
        }
        if (showAvailableOnly && getAvailableMatCount(mat) <= 0) return false;
        return true;
    });

    const hasActiveFilters = selectedCategories.length > 0 || selectedStandorte.length > 0 || showAvailableOnly;

    const getThumbUrl = (mat: Material): string => {
        return mat.imageUrls && mat.imageUrls.length > 0 ? mat.imageUrls[0] : ceviLogoImage;
    };

    return (
        <>
            <Collapse
                ghost
                size="small"
                style={{ marginBottom: 8 }}
                items={[{
                    key: 'filters',
                    label: <span style={{ fontSize: 13 }}>
                        <FilterOutlined style={{ marginRight: 4 }} />
                        {t('material:filter.title')}
                        {hasActiveFilters && <Badge count={selectedCategories.length + selectedStandorte.length + (showAvailableOnly ? 1 : 0)} size="small" style={{ marginLeft: 6 }} />}
                    </span>,
                    children: <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {categorie.length > 0 && (
                            <Select
                                mode="multiple"
                                allowClear
                                placeholder={t('material:filter.category')}
                                value={selectedCategories}
                                onChange={setSelectedCategories}
                                style={{ width: '100%' }}
                                size="small"
                                options={categorie.map(c => ({ label: c.name, value: c.id }))}
                            />
                        )}
                        {standort.length > 0 && (
                            <Select
                                mode="multiple"
                                allowClear
                                placeholder={t('material:filter.standort')}
                                value={selectedStandorte}
                                onChange={setSelectedStandorte}
                                style={{ width: '100%' }}
                                size="small"
                                options={standort.map(s => ({ label: s.name, value: s.id }))}
                            />
                        )}
                        <Button
                            size="small"
                            type={showAvailableOnly ? 'primary' : 'default'}
                            onClick={() => setShowAvailableOnly(!showAvailableOnly)}
                        >
                            {t('material:filter.availableOnly')}
                        </Button>
                    </div>,
                }]}
            />
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
                footer={
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        <Button key="cart" type="primary" icon={<ShoppingCartOutlined />}
                            onClick={() => { if (activeRecord) addToCart(activeRecord); }}>
                            {t('material:table.cart')}
                        </Button>
                        {activeRecord && (
                            <Can I='update' this={{...activeRecord, abteilungId}}>
                                <EditMaterialButton
                                    abteilungId={abteilungId}
                                    materialId={activeRecord.id}
                                    material={activeRecord}
                                    onSuccess={() => setIsModalVisible(false)}
                                />
                            </Can>
                        )}
                        <Button key="close" onClick={() => setIsModalVisible(false)}>
                            {t('common:buttons.cancel')}
                        </Button>
                    </div>
                }
            >
                <ViewMaterial material={activeRecord} />
            </Modal>
        </>
    );
};
