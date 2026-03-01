import {Badge, Button, Card, Carousel, Col, Collapse, Image, List as AntList, Modal, Row} from 'antd';
import React, {useContext, useMemo, useState} from 'react';
import {Categorie} from 'types/categorie.types';
import {Standort} from 'types/standort.types';
import {Material} from 'types/material.types';
import {Sammlung} from 'types/sammlung.types';
import {DisplayItem} from 'types/displayItem.types';
import ceviLogoImage from 'assets/onlinemat_logo.png';
import classNames from 'classnames';
import appStyles from 'styles.module.scss';
import {ViewMaterial} from "./ViewMaterial";
import {EyeOutlined, ShoppingCartOutlined} from "@ant-design/icons";
import {useUser} from "../../hooks/use-user";
import {MaterialFilterBar} from './MaterialFilterBar';
import {MaterialFilterState, applyFilterAndSort, initialFilterState} from 'util/materialFilterSort';
import {MaterialsContext} from 'contexts/AbteilungContexts';
import {useTranslation} from 'react-i18next';


export interface MaterialGridProps {
    abteilungId: string;
    material: Material[]
    sammlungen: Sammlung[]
    categorie: Categorie[]
    standort?: Standort[]
    addToCart: (mat: Material) => void
    addSammlungToCart: (s: Sammlung) => void
}


export const MaterialGrid = (props: MaterialGridProps) => {

    const { abteilungId, material, sammlungen, categorie, standort = [], addToCart, addSammlungToCart } = props;

    const userState = useUser();
    const [filterState, setFilterState] = useState<MaterialFilterState>(initialFilterState);

    const guestFiltered = (userState.appUser?.userData?.roles|| {})[abteilungId]?.includes('guest') ?
        material.filter(material => !material.onlyLendInternal) : material;

    const displayMaterials = applyFilterAndSort(guestFiltered, filterState);

    const displayItems: DisplayItem[] = useMemo(() => {
        const items: DisplayItem[] = [
            ...displayMaterials.map(m => ({ type: 'material' as const, data: m })),
            ...sammlungen.map(s => ({ type: 'sammlung' as const, data: s })),
        ];
        return items.sort((a, b) => a.data.name.normalize().localeCompare(b.data.name.normalize()));
    }, [displayMaterials, sammlungen]);

    return <>
        <MaterialFilterBar
            categories={categorie}
            standorte={standort}
            onFilterChange={setFilterState}
        />
        <Row gutter={[24, 24]}>
            {
                displayItems.map(item =>
                    item.type === 'material'
                        ? <MaterialCard key={`mat_${item.data.id}`} material={item.data} addToCart={addToCart} abteilungId={abteilungId} />
                        : <SammlungCard key={`sam_${item.data.id}`} sammlung={item.data} addSammlungToCart={addSammlungToCart} abteilungId={abteilungId} />
                )
            }
        </Row>

    </>

}

export interface MaterialCardProps {
    material: Material
    addToCart: (mat: Material) => void
    abteilungId: string
}

export const MaterialCard = (props: MaterialCardProps) => {

    const { material, addToCart, abteilungId } = props;

    const createImageCarousel = () => {
        if (!material.imageUrls || material.imageUrls.length <= 0) {
            return <Image
                key={`mat_${material.id}_ceviLogo`}
                height={100}
                width='auto'
                src={ceviLogoImage}
                preview={false}
            />;
        }
        return material.imageUrls.map(url => <Image
            key={`mat_${material.id}_${url}`}
            height={100}
            width='auto'
            src={url}
            preview={false}
        />)
    }


    const [isModalVisible, setIsModalVisible] = useState(false);
    const [activeRecord, setActiveRecord] = useState<Material>();

    function clickCard(event: React.MouseEvent, material: Material) {
        setActiveRecord(material);
        setIsModalVisible(!isModalVisible);
    }

    return <Col xs={24} sm={24} md={12} lg={12} xl={8} xxl={4}>
        <Card
            hoverable
            cover={<div className={classNames(appStyles['cardLogoWrapper'])}>
                <Image.PreviewGroup>
                    <Carousel infinite={false}>
                        {
                            createImageCarousel()
                        }
                    </Carousel>
                </Image.PreviewGroup>
            </div>
            }
            actions={[
                    <EyeOutlined key="view" onClick={(event) => clickCard(event, material)} />,
                    <ShoppingCartOutlined key="cart" onClick={(event) => addToCart(material)} />
            ]}
        >
            <Card.Meta title={material.name} description={material.comment} />
        </Card>
        <Modal
            title={activeRecord?.name}
            open={isModalVisible}
            onCancel={() => {
                setIsModalVisible(false);
            }}
            footer={[
                <Button key='back' onClick={() => {
                    setIsModalVisible(false);
                }}>
                    Abbrechen
                </Button>
            ]}
        >
            <ViewMaterial material={activeRecord} abteilungId={abteilungId}></ViewMaterial>
        </Modal>
    </Col>


}

interface SammlungCardProps {
    sammlung: Sammlung;
    addSammlungToCart: (s: Sammlung) => void;
    abteilungId: string;
}

const SammlungCard = (props: SammlungCardProps) => {
    const { sammlung, addSammlungToCart, abteilungId } = props;
    const { t } = useTranslation();
    const { materials: allMaterials } = useContext(MaterialsContext);
    const [detailVisible, setDetailVisible] = useState(false);

    const createImageCarousel = () => {
        if (!sammlung.imageUrls || sammlung.imageUrls.length <= 0) {
            return <Image
                key={`sam_${sammlung.id}_ceviLogo`}
                height={100}
                width='auto'
                src={ceviLogoImage}
                preview={false}
            />;
        }
        return sammlung.imageUrls.map(url => <Image
            key={`sam_${sammlung.id}_${url}`}
            height={100}
            width='auto'
            src={url}
            preview={false}
        />);
    };

    return <Col xs={24} sm={24} md={12} lg={12} xl={8} xxl={4}>
        <Badge.Ribbon text="Sammlung" color="blue">
            <Card
                hoverable
                cover={<div className={classNames(appStyles['cardLogoWrapper'])}>
                    <Image.PreviewGroup>
                        <Carousel infinite={false}>
                            {createImageCarousel()}
                        </Carousel>
                    </Image.PreviewGroup>
                </div>}
                actions={[
                    <EyeOutlined key="view" onClick={() => setDetailVisible(true)} />,
                    <ShoppingCartOutlined key="cart" onClick={() => addSammlungToCart(sammlung)} />,
                ]}
            >
                <Card.Meta title={sammlung.name} description={sammlung.description} />
            </Card>
        </Badge.Ribbon>
        <Modal
            title={sammlung.name}
            open={detailVisible}
            onCancel={() => setDetailVisible(false)}
            footer={[
                <Button key="close" onClick={() => setDetailVisible(false)}>
                    {t('common:buttons.cancel')}
                </Button>,
            ]}
        >
            <Collapse
                items={[{
                    key: 'items',
                    label: t('sammlung:table.itemCount', { count: sammlung.items.length }),
                    children: (
                        <AntList
                            size="small"
                            dataSource={sammlung.items}
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
            {sammlung.description && <p style={{ marginTop: 12 }}>{sammlung.description}</p>}
        </Modal>
    </Col>;
};
