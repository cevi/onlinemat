import { Col, Row } from 'antd';
import { useParams } from 'react-router';
import { Abteilung } from 'types/abteilung.type';

export interface OrderProps {
    abteilung: Abteilung
}

export type OrderViewParams = {
    abteilungSlugOrId: string;
    orderId: string
};

export const Order = (props: OrderProps) => {

    const { abteilung } = props;

    const { abteilungSlugOrId, orderId } = useParams<OrderViewParams>();

    return <Row gutter={[16, 16]}>
        <Col span={24}>
        </Col>
        <Col span={24}>
            <p>{orderId}</p>
        </Col>
    </Row>


}