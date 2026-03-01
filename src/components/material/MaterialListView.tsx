import React, { useContext, useMemo, useState } from 'react';
import { List, Image, Modal, Button, Tag, Badge, Collapse, List as AntList } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';
import { Material } from 'types/material.types';
import { Sammlung } from 'types/sammlung.types';
import { DisplayItem } from 'types/displayItem.types';
import { Categorie } from 'types/categorie.types';
import { Standort } from 'types/standort.types';
import { getAvailableMatCount } from 'util/MaterialUtil';
import { MaterialFilterState, applyFilterAndSort, initialFilterState } from 'util/materialFilterSort';
import { MaterialFilterBar } from './MaterialFilterBar';
import { ViewMaterial } from './ViewMaterial';
import { EditMaterialButton } from './EditMaterial';
import { displayCategorieNames } from './MaterialTable';
import { Can } from 'config/casl/casl';
import ceviLogoImage from 'assets/onlinemat_logo.png';
import { useUser } from 'hooks/use-user';
import { useTranslation } from 'react-i18next';
import styles from './MaterialListView.module.scss';
import classNames from 'classnames';
import { MaterialsContext } from 'contexts/AbteilungContexts';

export interface MaterialListViewProps {
    abteilungId: string;
    material: Material[];
    sammlungen: Sammlung[];
    categorie: Categorie[];
    standort?: Standort[];
    addToCart: (mat: Material) => void;
    addSammlungToCart: (s: Sammlung) => void;
}

export const MaterialListView: React.FC<MaterialListViewProps> = ({
    abteilungId,
    material,
    sammlungen,
    categorie,
    standort = [],
    addToCart,
    addSammlungToCart,
}) => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [activeRecord, setActiveRecord] = useState<Material>();
    const [sammlungDetailVisible, setSammlungDetailVisible] = useState(false);
    const [activeSammlung, setActiveSammlung] = useState<Sammlung>();
    const [filterState, setFilterState] = useState<MaterialFilterState>(initialFilterState);
    const userState = useUser();
    const { t } = useTranslation();
    const { materials: allMaterials } = useContext(MaterialsContext);

    const guestFiltered = (userState.appUser?.userData?.roles || {})[abteilungId]?.includes('guest')
        ? material.filter(m => !m.onlyLendInternal)
        : material;

    const filteredMaterials = applyFilterAndSort(guestFiltered, filterState);

    const displayItems: DisplayItem[] = useMemo(() => {
        const items: DisplayItem[] = [
            ...filteredMaterials.map(m => ({ type: 'material' as const, data: m })),
            ...sammlungen.map(s => ({ type: 'sammlung' as const, data: s })),
        ];
        return items.sort((a, b) => a.data.name.normalize().localeCompare(b.data.name.normalize()));
    }, [filteredMaterials, sammlungen]);

    const getThumbUrl = (imageUrls?: string[]): string => {
        return imageUrls && imageUrls.length > 0 ? imageUrls[0] : ceviLogoImage;
    };

    return (
        <>
            <MaterialFilterBar
                categories={categorie}
                standorte={standort}
                onFilterChange={setFilterState}
            />
            <List
                dataSource={displayItems}
                renderItem={(item) => {
                    if (item.type === 'sammlung') {
                        const sammlung = item.data;
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
                                            addSammlungToCart(sammlung);
                                        }}
                                    />,
                                ]}
                                onClick={() => {
                                    setActiveSammlung(sammlung);
                                    setSammlungDetailVisible(true);
                                }}
                            >
                                <List.Item.Meta
                                    avatar={
                                        <Image
                                            src={getThumbUrl(sammlung.imageUrls)}
                                            width={48}
                                            height={48}
                                            preview={false}
                                            style={{ objectFit: 'cover', borderRadius: 4 }}
                                        />
                                    }
                                    title={
                                        <span className={styles['item-title']}>
                                            <Tag color="blue">Sammlung</Tag>
                                            {sammlung.name}
                                        </span>
                                    }
                                    description={sammlung.description || t('sammlung:table.itemCount', { count: sammlung.items.length })}
                                />
                            </List.Item>
                        );
                    }

                    const mat = item.data;
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
                                        src={getThumbUrl(mat.imageUrls)}
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
                <ViewMaterial material={activeRecord} abteilungId={abteilungId} />
            </Modal>
            <Modal
                title={activeSammlung?.name}
                open={sammlungDetailVisible}
                onCancel={() => setSammlungDetailVisible(false)}
                footer={[
                    <Button key="cart" type="primary" icon={<ShoppingCartOutlined />}
                        onClick={() => { if (activeSammlung) addSammlungToCart(activeSammlung); }}>
                        {t('material:table.cart')}
                    </Button>,
                    <Button key="close" onClick={() => setSammlungDetailVisible(false)}>
                        {t('common:buttons.cancel')}
                    </Button>,
                ]}
            >
                {activeSammlung && (
                    <>
                        {activeSammlung.description && <p>{activeSammlung.description}</p>}
                        <Collapse
                            items={[{
                                key: 'items',
                                label: t('sammlung:table.itemCount', { count: activeSammlung.items.length }),
                                children: (
                                    <AntList
                                        size="small"
                                        dataSource={activeSammlung.items}
                                        renderItem={(item) => {
                                            const mat = allMaterials.find(m => m.id === item.matId);
                                            return (
                                                <AntList.Item>
                                                    {mat?.name || item.matId} × {item.count}
                                                </AntList.Item>
                                            );
                                        }}
                                    />
                                ),
                            }]}
                            defaultActiveKey={['items']}
                        />
                    </>
                )}
            </Modal>
        </>
    );
};
