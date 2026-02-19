import {useContext, useState} from 'react';
import {useSearchParams} from 'react-router-dom';
import {Col, Input, message, Radio, Row, Spin} from 'antd';
import {AddMaterialButton} from 'components/material/AddMaterial';
import {AppstoreOutlined, MenuOutlined, UnorderedListOutlined} from '@ant-design/icons';
import {AddCategorieButton} from 'components/categorie/AddCategorie';
import {Abteilung} from 'types/abteilung.type';
import {MaterialTable} from 'components/material/MaterialTable';
import {MaterialGrid} from 'components/material/MaterialGrid';
import {MaterialListView} from 'components/material/MaterialListView';
import {Can} from 'config/casl/casl';
import {AbteilungEntityCasl} from 'config/casl/ability';
import {CategorysContext, MaterialsContext, StandorteContext} from 'components/abteilung/AbteilungDetails';
import {useCookies} from 'react-cookie';
import {CartItem} from 'types/cart.types';
import {getCartName} from 'util/CartUtil';
import dayjs from 'dayjs';
import {Material} from 'types/material.types';
import {getAvailableMatCount} from 'util/MaterialUtil';
import {AddStandortButton} from "components/standort/AddStandort";
import {ImportAddMaterialButton} from 'components/material/ImportAddMaterial';
import {DeleteMaterialButton} from 'components/material/DeleteMaterial';
import {ExportMaterialButton} from 'components/material/ExportMaterial';
import {useIsMobile} from 'hooks/useIsMobile';

export type AbteilungMaterialViewProps = {
    abteilung: Abteilung;
    cartItems: CartItem[]
    changeCart: (cart: CartItem[]) => void
};



export const AbteilungMaterialView = (props: AbteilungMaterialViewProps) => {
    const { abteilung, cartItems, changeCart } = props;

    const { Search } = Input;
    const [searchParams] = useSearchParams();

    const cookieName = getCartName(abteilung.id);

    const [cookies, setCookie] = useCookies([cookieName]);

    const isMobile = useIsMobile();

    function getInitialMode(): 'table' | 'grid' | 'list' {
        return isMobile ? 'list' : 'table';
    }
    const initQuery = searchParams.get('q') || undefined;
    const [query, setQuery] = useState<string | undefined>(initQuery);
    const [displayMode, setDisplayMode] = useState<'table' | 'grid' | 'list'>(() => getInitialMode());

    //fetch categories
    const categoriesContext = useContext(CategorysContext);
    const categories = categoriesContext.categories;
    const catLoading = categoriesContext.loading;

    //fetch standort
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

        const expires = dayjs().add(24, 'hours');

        setCookie(cookieName, localCart, {
            path: '/',
            expires: expires.toDate(),
            secure: true,
            sameSite: 'strict',
        });

        changeCart(localCart)
    }


    if (!abteilung) {
        return <Spin />
    }


    const filteredMaterials = query ? materials.filter(mat => mat.name.toLowerCase().includes(query.toLowerCase())) : materials;

    return <Row gutter={[16, 16]}>

        <Col xl={4}>
            <Can I={'create'} this={{ __caslSubjectType__: 'Material', abteilungId: abteilung.id } as AbteilungEntityCasl}>
                <AddMaterialButton abteilungId={abteilung.id} />
            </Can>
        </Col>
        <Col hidden={isMobile} xl={4}>
            <Can I={'create'} this={{ __caslSubjectType__: 'Categorie', abteilungId: abteilung.id } as AbteilungEntityCasl}>
                <AddCategorieButton abteilungId={abteilung.id} />
            </Can>
        </Col>
        <Col hidden={isMobile} xl={4}>
            <Can I={'create'} this={{ __caslSubjectType__: 'Standort', abteilungId: abteilung.id } as AbteilungEntityCasl}>
                <AddStandortButton abteilungId={abteilung.id} />
            </Can>
        </Col>
        <Can I={'delete'} this={{ __caslSubjectType__: 'Material', abteilungId: abteilung.id } as AbteilungEntityCasl}>
            <Col hidden={isMobile} xl={4}>
                    <ImportAddMaterialButton abteilung={abteilung} />
            </Col>
            <Col hidden={isMobile} xl={4}>
                <ExportMaterialButton abteilung={abteilung} />
            </Col>
            <Col hidden={isMobile} xl={4}>
                <DeleteMaterialButton abteilung={abteilung} />
            </Col>
        </Can>


        {
            matLoading || catLoading ?

                <Spin />
                :
                <>
                    <Col xl={20} md={20} xs={24} >
                        <Search
                            placeholder='nach Material suchen'
                            allowClear
                            size='large'
                            defaultValue={initQuery}
                            onSearch={(query) => setQuery(query)}
                        />
                    </Col>
                    <Col xl={4} md={4} xs={0}>
                        <Radio.Group value={displayMode} onChange={(e) => setDisplayMode(e.target.value as 'table' | 'grid' | 'list')}>
                            {isMobile ? (
                                <>
                                    <Radio.Button value='list'><UnorderedListOutlined /></Radio.Button>
                                    <Radio.Button value='grid'><AppstoreOutlined /></Radio.Button>
                                </>
                            ) : (
                                <>
                                    <Radio.Button value='grid'><AppstoreOutlined /></Radio.Button>
                                    <Radio.Button value='table'><MenuOutlined /></Radio.Button>
                                </>
                            )}
                        </Radio.Group>
                    </Col>
                    <Col span={24}>
                        {
                            displayMode === 'table' && <MaterialTable abteilungId={abteilung.id} categorie={categories} standort={standorte} material={filteredMaterials} addToCart={addItemToCart} />
                        }
                        {
                            displayMode === 'grid' && <MaterialGrid abteilungId={abteilung.id} categorie={categories} material={filteredMaterials} addToCart={addItemToCart} />
                        }
                        {
                            displayMode === 'list' && <MaterialListView abteilungId={abteilung.id} categorie={categories} standort={standorte} material={filteredMaterials} addToCart={addItemToCart} />
                        }
                    </Col>
                </>
        }
    </Row >
}
