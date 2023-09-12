import { useContext } from 'react';
import { Spin, Row, Col } from 'antd';
import { Abteilung } from 'types/abteilung.type';
import { Can } from 'config/casl/casl';
import { AbteilungEntityCasl } from 'config/casl/ability';
import {StandorteContext} from 'components/abteilung/AbteilungDetails';
import {AddStandortButton} from "components/standort/AddStandort";
import {StandortTable} from "../../../components/standort/StandortTable";
import {Standort} from "../../../types/standort.types";

export type AbteilungStandorteViewProps = {
    abteilung: Abteilung;
};

export const AbteilungStandorteView = (props: AbteilungStandorteViewProps) => {
    const { abteilung } = props;

    //fetch standort
    const standorteContext = useContext(StandorteContext);
    const standorte = standorteContext.standorte;
    const standortLoading = standorteContext.loading;

    if (!abteilung) {
        return <Spin />
    }

    return <Row gutter={[16, 16]}>

        <Col span={12}>
            <Can I={'create'} this={{ __caslSubjectType__: 'Standort', abteilungId: abteilung.id } as AbteilungEntityCasl}>
                <AddStandortButton abteilungId={abteilung.id} />
            </Can>
        </Col>

        <Col span={24}>
            {
                standortLoading ?
                    <Spin />
                    :
                    <>

                        <StandortTable abteilungId={abteilung.id} standort={standorte} />

                    </>
            }

        </Col>

    </Row >
}
