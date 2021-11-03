import { Col, Image, Row } from 'antd';
import React from 'react';

export interface PicturesWallProps {
    imageUrls: string[]
}


export const PicturesWall = (props: PicturesWallProps) => {

    const { imageUrls } = props;
      
    return <Row gutter={[16, 24]}>
        {
            imageUrls.map(url => <Col span={4}> 
                <Image
                    src={url}
                />
            </Col>)
        }
        
    </Row>
}