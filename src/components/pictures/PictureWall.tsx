import { DeleteOutlined } from '@ant-design/icons';
import { Button, Col, Image, Row } from 'antd';
import React from 'react';
import classNames from 'classnames';
import moduleStyles from './PictureWall.module.scss'

export interface PicturesWallProps {
    imageUrls: string[]
    showRemove?: boolean
    remove?: (url: string) => void
}


export const PicturesWall = (props: PicturesWallProps) => {

    const { imageUrls, showRemove, remove } = props;
      
    return <Row gutter={[16, 24]}>
        {
            imageUrls &&  imageUrls.length > 0 ? imageUrls.map((url, index) => <Col key={`img_${index}`} span={4}>
                <div>
                    <Image
                        src={url}
                    />
                    {
                        (showRemove && remove) && <Button className={classNames(moduleStyles['removeButton'])} danger icon={<DeleteOutlined />} onClick={()=> remove(url)}></Button>
                    }
                </div>
            </Col>): <p>Keine Bilder vorhanden</p>
        }
        
    </Row>
}