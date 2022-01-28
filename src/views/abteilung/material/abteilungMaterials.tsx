import { useContext, useState } from 'react';
import classNames from 'classnames';
import appStyles from 'styles.module.scss';
import { Spin, Input, Radio } from 'antd';
import { AddMaterialButton } from 'components/material/AddMaterial';
import { AppstoreOutlined, MenuOutlined } from '@ant-design/icons';
import { AddCategorieButton } from 'components/categorie/AddCategorie';
import { Abteilung } from 'types/abteilung.type';
import { MaterialTable } from 'components/material/MaterialTable';
import { MaterialGrid } from 'components/material/MaterialGrid';
import { Can } from 'config/casl/casl';
import { AbteilungEntityCasl } from 'config/casl/ability';
import { CategorysContext, MaterialsContext } from 'components/abteilung/AbteilungDetails';
import { useCookies } from 'react-cookie';
import { CartItem } from 'types/cart.types';
import { cookieToCart, getCartName } from 'util/CartUtil';

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

    //fetch materials
    const materialsContext = useContext(MaterialsContext);

    const materials = materialsContext.materials;
    const matLoading = materialsContext.loading;


    const addItemToCart = (materialId: string) => {
        const cookieRaw = cookies[cookieName];
       
        let localCart = cartItems;
        if(!localCart) {
            localCart = []
        }

        //check if already added
        const itemAdded = localCart.find(item => item.matId === materialId);

        if(itemAdded) {
            localCart = [...localCart.filter(item => item.matId !== materialId), {
                __caslSubjectType__: 'CartItem',
                count: (itemAdded.count + 1),
                matId: materialId
            }]
        } else {
            localCart = [...localCart, {
                __caslSubjectType__: 'CartItem',
                count: 1,
                matId: materialId
            }]
        }

        setCookie(cookieName, localCart, {
            path: '/',
        });

        changeCart(localCart)
    }


    if(!abteilung) {
        return <Spin/>
    }

    return <div className={classNames(appStyles['flex-grower'])}>

        <div className={classNames(appStyles['flex-grower'])}>
            <Can I={'create'} this={{ __caslSubjectType__: 'Material', abteilungId: abteilung.id } as AbteilungEntityCasl}>
                <AddMaterialButton abteilungId={abteilung.id} />
            </Can>

            <Can I={'create'} this={{ __caslSubjectType__: 'Categorie', abteilungId: abteilung.id } as AbteilungEntityCasl}>
                <AddCategorieButton abteilungId={abteilung.id} />
            </Can>

            {
                matLoading || catLoading ?
                    <Spin />
                    :
                    <>
                        <Search
                            placeholder='nach Material suchen'
                            allowClear
                            enterButton='Suchen'
                            size='large'
                            onSearch={(query) => setQuery(query)}
                        />
                        <Radio.Group value={displayMode} onChange={(e) => setDisplayMode(e.target.value as 'table' | 'grid')}>
                            <Radio.Button value='grid' >{<AppstoreOutlined />}</Radio.Button>
                            <Radio.Button value='table'>{<MenuOutlined />}</Radio.Button>
                        </Radio.Group>

                        {
                            displayMode === 'table' && <MaterialTable abteilungId={abteilung.id} categorie={categories} material={query ? materials.filter(mat => mat.name.toLowerCase().includes(query.toLowerCase())) : materials} addToBasket={addItemToCart} />
                        }
                        {
                            displayMode === 'grid' && <MaterialGrid categorie={categories} material={query ? materials.filter(mat => mat.name.toLowerCase().includes(query.toLowerCase())) : materials} addToBasket={addItemToCart} />
                        }
                    </>
            }
        </div>
    </div>
}
