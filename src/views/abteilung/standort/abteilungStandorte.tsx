import { useContext, useState } from 'react';
import classNames from 'classnames';
import appStyles from 'styles.module.scss';
import { Spin, Input, Radio, message, Row, Col } from 'antd';
import { AddMaterialButton } from 'components/material/AddMaterial';
import { AppstoreOutlined, MenuOutlined } from '@ant-design/icons';
import { AddCategorieButton } from 'components/categorie/AddCategorie';
import { Abteilung } from 'types/abteilung.type';
import { MaterialTable } from 'components/material/MaterialTable';
import { MaterialGrid } from 'components/material/MaterialGrid';
import { Can } from 'config/casl/casl';
import { AbteilungEntityCasl } from 'config/casl/ability';
import {CategorysContext, MaterialsContext, StandorteContext} from 'components/abteilung/AbteilungDetails';
import { useCookies } from 'react-cookie';
import { CartItem } from 'types/cart.types';
import { cookieToCart, getCartName } from 'util/CartUtil';
import moment from 'moment';
import { Material } from 'types/material.types';
import { getAvailableMatCount } from 'util/MaterialUtil';
import {AddStandortButton} from "components/standort/AddStandort";
import {StandortTable} from "../../../components/standort/StandortTable";

export type AbteilungStandorteViewProps = {
    abteilung: Abteilung;
    cartItems: CartItem[]
    changeCart: (cart: CartItem[]) => void
};

export const AbteilungStandorteView = (props: AbteilungStandorteViewProps) => {
    const { abteilung, cartItems, changeCart } = props;

    const { Search } = Input;

    const cookieName = getCartName(abteilung.id);

    const [cookies, setCookie] = useCookies([cookieName]);


    const [query, setQuery] = useState<string | undefined>(undefined);
    const [displayMode, setDisplayMode] = useState<'table' | 'grid'>('table');

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

        <Col span={20}>
            <Search
                placeholder='nach Standort suchen'
                allowClear
                enterButton='Suchen'
                size='large'
                onSearch={(query) => setQuery(query)}
            />
        </Col>

        <Col span={24}>
            {
                <StandortTable abteilungId={abteilung.id} standort={standorte} />
            }

        </Col>

    </Row >
}
