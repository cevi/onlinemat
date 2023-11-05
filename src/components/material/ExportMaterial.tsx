import { Button} from 'antd';
import {Abteilung} from 'types/abteilung.type';
import { useContext } from 'react';
import { exportMaterialsToXlsx } from 'util/ExcelUtil';
import {CategorysContext, MaterialsContext, StandorteContext} from 'components/abteilung/AbteilungDetails';

export interface ExportMaterialProps {
    abteilung: Abteilung
}

export const ExportMaterialButton = (props: ExportMaterialProps) => {
    const { abteilung} = props;

        //fetch materials
        const materialsContext = useContext(MaterialsContext);
        const materials = materialsContext.materials;
        const matLoading = materialsContext.loading;
    
        //fetch categories
        const categoriesContext = useContext(CategorysContext);
        const categories = categoriesContext.categories;
        const catLoading = categoriesContext.loading;
    
        //fetch categories
        const standorteContext = useContext(StandorteContext);
        const standorte = standorteContext.standorte;
        const standorteLoading = standorteContext.loading;

    
    return <>
         <Button type='primary' onClick={()=> exportMaterialsToXlsx(abteilung, categories, materials, standorte)}>
            Excel export
        </Button>
    </>
}