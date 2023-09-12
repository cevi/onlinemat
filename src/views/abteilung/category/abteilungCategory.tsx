import {useContext} from 'react';
import {Col, Row, Spin} from 'antd';
import {Abteilung} from 'types/abteilung.type';
import {Can} from 'config/casl/casl';
import {AbteilungEntityCasl} from 'config/casl/ability';
import {CategorysContext} from 'components/abteilung/AbteilungDetails';
import {AddCategorieButton} from "../../../components/categorie/AddCategorie";
import {CategoryTable} from "../../../components/categorie/CategoryTable";

export type AbteilungCategoryViewProps = {
    abteilung: Abteilung;
};

export const AbteilungCategoryView = (props: AbteilungCategoryViewProps) => {
    const { abteilung } = props;

    //fetch standort
    const categoryContext = useContext(CategorysContext);
    const categories = categoryContext.categories;
    const categoryLoading = categoryContext.loading;

    if (!abteilung) {
        return <Spin />
    }

    return <Row gutter={[16, 16]}>

        <Col span={12}>
            <Can I={'create'} this={{ __caslSubjectType__: 'Categorie', abteilungId: abteilung.id } as AbteilungEntityCasl}>
                <AddCategorieButton abteilungId={abteilung.id} />
            </Can>
        </Col>

        <Col span={24}>
            {
                categoryLoading ?
                    <Spin />
                    :
                    <>

                        <CategoryTable abteilungId={abteilung.id} category={categories} />

                    </>
            }

        </Col>

    </Row >
}
