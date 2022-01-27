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

export type AbteilungMaterialViewProps = {
    abteilung: Abteilung;
};

export const AbteilungMaterialView = (props: AbteilungMaterialViewProps) => {
    const { abteilung } = props;

    const { Search } = Input;


    const [abteilungLoading, setAbteilungLoading] = useState(false);
  

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


    const addToBasket = (materialId: string) => {

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
                matLoading || catLoading || abteilungLoading ?
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
                            displayMode === 'table' && <MaterialTable abteilungId={abteilung.id} categorie={categories} material={query ? materials.filter(mat => mat.name.toLowerCase().includes(query.toLowerCase())) : materials} addToBasket={addToBasket} />
                        }
                        {
                            displayMode === 'grid' && <MaterialGrid categorie={categories} material={query ? materials.filter(mat => mat.name.toLowerCase().includes(query.toLowerCase())) : materials} addToBasket={addToBasket} />
                        }
                    </>
            }
        </div>
    </div>
}
