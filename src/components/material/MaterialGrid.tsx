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
                material.map(mat => <MaterialCard material={mat} />)
            }
        </Row>

    </>

}

export interface MaterialCardProps {
    material: Material
}

export const MaterialCard = (props: MaterialCardProps) => {

    const { material } = props;

    const createImageCarousel = () => {
        if (!material.imageUrls || material.imageUrls.length <= 0) {
            return <Image
                height={100}
                width='auto'
                src={ceviLogoImage}
                preview={false}
            />;
        }
        return material.imageUrls.map(url => <Image
            height={100}
            width='auto'
            src={url}
            preview={false}
        />)
    }


    const [isModalVisible, setIsModalVisible] = useState(false);
    const [activeRecord, setActiveRecord] = useState<Material>();

    function clickCard(event: React.MouseEvent<HTMLDivElement, MouseEvent>, material: Material) {
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
            onClick = {(event) => clickCard(event, material)}
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