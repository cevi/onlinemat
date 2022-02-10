import { Carousel, Col, Image, Row, Tooltip } from "antd"
import { Material } from "types/material.types";
import ceviLogoImage from 'assets/onlinemat_logo.png';
import { showAvailableCountString } from "util/MaterialUtil";
import { displayCategorieNames } from "./MaterialTable";
import { Categorie } from "types/categorie.types";


export interface MaterialViewProps {
    material: Material
    categories: Categorie[]
}

export const MaterialView = (props: MaterialViewProps) => {

    const { material, categories } = props;

    const createImageCarousel = () => {
        if (!material.imageUrls || material.imageUrls.length <= 0) {
            return <Image
                height='auto'
                width={200}
                src={ceviLogoImage}
                preview={false}
            />;
        }
        return material.imageUrls.map(url => <Image
            height='auto'
            width={200}
            src={url}
        />)
    }


    return  <Row gutter={[16, 16]}>
    <Col span={12}>
        <Image.PreviewGroup>
            <Carousel infinite={false}>
                {
                    createImageCarousel()
                }
            </Carousel>
        </Image.PreviewGroup>
    </Col>
    <Col span={12}>
        <p>{material.comment}</p>
        <Tooltip title='Kaputtes und verlorenes Material werden als nicht verfügbar angezeigt.'>
            <p>Verfügbar: {showAvailableCountString(material)}</p>
        </Tooltip>
        <p>Gewicht {material.weightInKg ? `${material.weightInKg} Kg` : 'unbekannt'}</p>
        <p>Kategorien: {displayCategorieNames(categories, material.categorieIds || [])}</p>
        
    </Col>
</Row>
}