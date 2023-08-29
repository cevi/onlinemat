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

export type AbteilungMaterialViewProps = {
    abteilung: Abteilung;
    cartItems: CartItem[]
    changeCart: (cart: CartItem[]) => void
};

export const AbteilungMaterialView = (props: AbteilungMaterialViewProps) => {
    const { abteilung, cartItems, changeCart } = props;

    const { Search } = Input;

    const cookieName = getCartName(abteilung.id);

    const [cookies, setCookie] = useCookies([cookieName]);


    const [query, setQuery] = useState<string | undefined>(undefined);
    const [displayMode, setDisplayMode] = useState<'table' | 'grid'>('table');

    //fetch categories
    const categoriesContext = useContext(CategorysContext);
    const categories = categoriesContext.categories;
    const catLoading = categoriesContext.loading;

    //fetch categories
    const standorteContext = useContext(StandorteContext);
    const standorte = standorteContext.standorte;
    const standortLoading = standorteContext.loading;

    //fetch materials
    const materialsContext = useContext(MaterialsContext);
    const materials = materialsContext.materials;
    const matLoading = materialsContext.loading;


    const addItemToCart = (material: Material) => {

        let localCart = cartItems;

        //check if already added
        const itemAdded = localCart.find(item => item.matId === material.id);
        const maxCount = getAvailableMatCount(material);

        if (itemAdded) {
            //check if max count is already exeeded
            
            const amount = itemAdded.count >= maxCount ? maxCount : (itemAdded.count + 1);
            if (amount >= maxCount) {
                message.info(`Die maximale Stückzahl von ${material.name} befindet sich bereits in deinem Warenkorb.`)
            }
            localCart = [...localCart.filter(item => item.matId !== material.id), {
                __caslSubjectType__: 'CartItem',
                count: amount,
                matId: material.id
            }]
        } else if(maxCount > 0) {
            localCart = [...localCart, {
                __caslSubjectType__: 'CartItem',
                count: 1,
                matId: material.id
            }]
        } else {
            message.warning(`${material.name} ist zur Zeit leider nicht verfügbar.`)
        }

        const expires = moment();
        expires.add(24, 'hours');

        setCookie(cookieName, localCart, {
            path: '/',
            expires: expires.toDate()
        });

        changeCart(localCart)
    }


    if (!abteilung) {
        return <Spin />
    }

    return <Row gutter={[16, 16]}>

        <Col span={4}>
            <Can I={'create'} this={{ __caslSubjectType__: 'Material', abteilungId: abteilung.id } as AbteilungEntityCasl}>
                <AddMaterialButton abteilungId={abteilung.id} />
            </Can>
        </Col>
        <Col span={4}>
            <Can I={'create'} this={{ __caslSubjectType__: 'Categorie', abteilungId: abteilung.id } as AbteilungEntityCasl}>
                <AddCategorieButton abteilungId={abteilung.id} />
            </Can>
        </Col>
        <Col span={4}>
            <Can I={'create'} this={{ __caslSubjectType__: 'Standort', abteilungId: abteilung.id } as AbteilungEntityCasl}>
                <AddStandortButton abteilungId={abteilung.id} />
            </Can>
        </Col>



        {
            matLoading || catLoading ?
                <Spin />
                :
                <>
                    <Col span={20}>
                        <Search
                            placeholder='nach Material suchen'
                            allowClear
                            enterButton='Suchen'
                            size='large'
                            onSearch={(query) => setQuery(query)}
                        />
                    </Col>
                    <Col span={4}>
                        <Radio.Group value={displayMode} onChange={(e) => setDisplayMode(e.target.value as 'table' | 'grid')}>
                            <Radio.Button value='grid' >{<AppstoreOutlined />}</Radio.Button>
                            <Radio.Button value='table'>{<MenuOutlined />}</Radio.Button>
                        </Radio.Group>
                    </Col>
                    <Col span={24}>
                        {
                            displayMode === 'table' && <MaterialTable abteilungId={abteilung.id} categorie={categories} material={query ? materials.filter(mat => mat.name.toLowerCase().includes(query.toLowerCase())) : materials} addToCart={addItemToCart} />
                        }
                        {
                            displayMode === 'grid' && <MaterialGrid categorie={categories} material={query ? materials.filter(mat => mat.name.toLowerCase().includes(query.toLowerCase())) : materials} addToCart={addItemToCart} />
                        }
                    </Col>




                </>
        }
    </Row >
}
