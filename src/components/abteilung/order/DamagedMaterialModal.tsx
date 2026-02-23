import { Button, Modal } from "antd";
import { useUser } from "hooks/use-user";
import { useIsMobile } from "hooks/useIsMobile";
import { useContext, useEffect, useState } from "react";
import { Abteilung } from "types/abteilung.type";
import { DetailedCartItem } from "types/cart.types";
import { DamagedMaterial, DamagedMaterialDetails } from "types/material.types";
import { Order } from "types/order.types";
import { completeLostOrder } from "util/OrderUtil";
import { MaterialsContext } from "../AbteilungDetails";
import { OrderItemsDamaged } from "./OrderItemsDamaged";
import { useTranslation } from 'react-i18next';

export interface DamagedMaterialModalProps {
    abteilung: Abteilung
    damagedMaterial: DetailedCartItem[]
    showDamageModal: boolean
    order: Order
    setShowDamageModal: (showDamageModal: boolean) => void
}

export const DamagedMaterialModal = (props: DamagedMaterialModalProps) => {

    const { abteilung, order, damagedMaterial, showDamageModal, setShowDamageModal } = props;

    const [damagedMaterialDetails, setDamagedMaterialDetails] = useState<DamagedMaterialDetails[]>([]);

    const user = useUser();
    const { t } = useTranslation();
    const isMobile = useIsMobile();

    //fetch materials
    const materialsContext = useContext(MaterialsContext);

    const materials = materialsContext.materials;
    const matLoading = materialsContext.loading;

    useEffect(() => {
        setDamagedMaterialDetails(damagedMaterial.map(mat => {
            return {
                id: mat.matId,
                count: mat.count,
                type: 'damaged',
                name: mat.name,
                imageUrls: mat.imageUrls
            } as DamagedMaterialDetails
        }))
    }, [damagedMaterial])


    const updateDamagedMaterial = (mat: DamagedMaterialDetails) => {
        const filtered = damagedMaterialDetails.filter(d => d.id !== mat.id)
        filtered.push(mat)
        setDamagedMaterialDetails(filtered)
    }

    return <Modal
        open={showDamageModal}
        title={t('order:damagedModal.title')}
        width={isMobile ? '95vw' : 700}
        onOk={() => { }}
        onCancel={() => { }}
        footer={[
            <Button key='back' onClick={() => { setShowDamageModal(!showDamageModal) }}>
                {t('common:buttons.cancel')}
            </Button>,
            <Button key='submit' type='primary' onClick={async () => {
                const success = await completeLostOrder(abteilung.id, order, (!user || !user.appUser || !user.appUser.userData) ? 'Unbekannt' : user.appUser.userData.displayName, damagedMaterialDetails, materials)
                if(success) {
                    setShowDamageModal(!showDamageModal)
                }
                }}>
                {t('order:damagedModal.submit')}
            </Button>
        ]}
    >
        <OrderItemsDamaged items={damagedMaterialDetails.sort((a: DamagedMaterialDetails, b: DamagedMaterialDetails) => a.name.localeCompare(b.name))} updateDamagedMaterial={updateDamagedMaterial} isMobile={isMobile} />
    </Modal>

}