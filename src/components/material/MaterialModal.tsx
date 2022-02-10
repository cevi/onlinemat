import { ShoppingCartOutlined } from "@ant-design/icons";
import { Can } from "@casl/react";
import { Button, Modal } from "antd";
import { CategorysContext, MaterialsContext } from "components/abteilung/AbteilungDetails";
import { useContext } from "react";
import { Material } from "types/material.types";
import { MaterialView } from "./MaterialView";


export interface MaterialModalProps {
    materialId?: string
    material?: Material
    isModalVisible: boolean
    setModalVisible: (show: boolean) => void
}


export const MaterialModal = (props: MaterialModalProps) => {

    const { material, materialId, isModalVisible, setModalVisible } = props;

    //fetch materials
    const materialsContext = useContext(MaterialsContext);

    const materials = materialsContext.materials;
    const matLoading = materialsContext.loading;

    //fetch categories
    const categoriesContext = useContext(CategorysContext);

    const categories = categoriesContext.categories;
    const catLoading = categoriesContext.loading;

    let materialObj = material;

    if(!materialObj) {
        //fetch material by id
        materialObj = materials.find(mat => mat.id === materialId);
    }

    if(!materialObj) return <></>


    return <Modal 
                title={materialObj.name} 
                visible={isModalVisible} 
                onOk={() => { setModalVisible(false) }} 
                onCancel={() => { setModalVisible(false) }}
                footer={<></>}
            >
        <MaterialView material={materialObj} categories={categories}/>
    </Modal>
}