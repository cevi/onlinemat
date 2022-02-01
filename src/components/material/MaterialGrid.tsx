import { Button, Card, Carousel, Col, Image, Row } from 'antd';
import Meta from 'antd/lib/card/Meta';
import React, { useRef } from 'react';
import { Categorie } from 'types/categorie.types';
import { Material } from 'types/material.types';
import ceviLogoImage from 'assets/onlinemat_logo.png';
import classNames from 'classnames';
import appStyles from 'styles.module.scss';



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
        />)
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
        >
            <Meta title={material.name} description={material.comment} />
        </Card>
    </Col>
}