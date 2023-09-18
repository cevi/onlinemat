import { Button, Card, Carousel, Col, Image, Row } from 'antd';
import Meta from 'antd/lib/card/Meta';
import React, {useRef, useState} from 'react';
import { Categorie } from 'types/categorie.types';
import { Material } from 'types/material.types';
import ceviLogoImage from 'assets/onlinemat_logo.png';
import classNames from 'classnames';
import appStyles from 'styles.module.scss';
import {ViewMaterial} from "./ViewMaterial";
import Modal from "antd/lib/modal/Modal";
import {
    DeleteOutlined,
    EditOutlined,
    EllipsisOutlined,
    EyeOutlined,
    SettingOutlined,
    ShoppingCartOutlined
} from "@ant-design/icons";
import {deleteMaterial} from "../../util/MaterialUtil";



export interface MaterialGridProps {
    material: Material[]
    categorie: Categorie[]
    addToCart: (mat: Material) => void
}


export const MaterialGrid = (props: MaterialGridProps) => {

    const { material, categorie, addToCart } = props;

    return <>

        <Row gutter={[24, 24]}>
            {
                material.map(mat => <MaterialCard key={Math.random()} material={mat} addToCart={addToCart} />)
            }
        </Row>

    </>

}

export interface MaterialCardProps {
    material: Material
    addToCart: (mat: Material) => void
}

export const MaterialCard = (props: MaterialCardProps) => {

    const { material , addToCart} = props;

    const createImageCarousel = () => {
        if (!material.imageUrls || material.imageUrls.length <= 0) {
            return <Image
                key={Math.random()}
                height={100}
                width='auto'
                src={ceviLogoImage}
                preview={false}
            />;
        }
        return material.imageUrls.map(url => <Image
            key={Math.random()}
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
            <Meta title={material.name} description={material.comment} />
        </Card>
        <Modal
            title={activeRecord?.name}
            visible={isModalVisible}
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
            <ViewMaterial material={activeRecord}></ViewMaterial>
        </Modal>
    </Col>


}