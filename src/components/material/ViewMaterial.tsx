import React, {forwardRef, useContext} from 'react';
import {Divider, Spin, Timeline} from 'antd';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import {Material} from 'types/material.types';
import {getAvailableMatCount} from 'util/MaterialUtil';
import {CategorysContext, StandorteContext} from 'components/abteilung/AbteilungDetails';
import styles from './Material.module.scss';
import classNames from "classnames";
import { PicturesWall } from 'components/pictures/PictureWall';
import {displayCategorieNames, displayStandortNames} from "./MaterialTable";
import { Can } from 'config/casl/casl';

const conditionKey: Record<string, string> = {
    'new': 'conditionNew',
    'good': 'conditionGood',
    'fair': 'conditionFair',
    'poor': 'conditionPoor',
};

const maintenanceTypeKey: Record<string, string> = {
    'repair': 'maintenanceTypeRepair',
    'control': 'maintenanceTypeControl',
    'purchase': 'maintenanceTypePurchase',
    'other': 'maintenanceTypeOther',
};

export interface ViewMaterialProps {
    material?: Material
    abteilungId?: string
}

export const ViewMaterial = forwardRef((props: ViewMaterialProps, ref) => {
    const { t } = useTranslation();

    const { material, abteilungId } = props;

    //fetch categories
    const categoriesContext = useContext(CategorysContext);
    const categories = categoriesContext.categories;
    const catLoading = categoriesContext.loading;

    //fetch Standorte
    const standorteContext = useContext(StandorteContext);
    const standorte = standorteContext.standorte;
    const standorteLoading = standorteContext.loading;

    const hasMetadata = material && (
        material.purchaseDate || material.lifespanInYears != null || material.purchasePrice != null ||
        material.supplier || material.inventoryNumber || material.brand || material.condition ||
        material.warrantyUntil || material.nextMaintenanceDue || material.storageInstructions ||
        (material.maintenanceHistory && material.maintenanceHistory.length > 0)
    );

    // @ts-ignore
    return <>
        {
            catLoading && standorteLoading ? <Spin /> : <>

                <p className={classNames(styles['display-linebreak'])}>
                    <b>{t('material:view.comment')}</b> {material?.comment}
                </p>
                <p>
                    <b>{t('material:view.standort')}</b> {displayStandortNames(standorte, material?.standort || [])}
                </p>
                <p>
                    <b>{t('material:view.available')}</b> {getAvailableMatCount(material)}
                </p>
                <p>
                    <b>{t('material:view.weight')}</b> {material?.weightInKg}
                </p>
                <p>
                    <b>{t('material:view.categories')}</b> {displayCategorieNames(categories, material?.categorieIds || [])}
                </p>
                <div>
                    <PicturesWall showRemove={false} imageUrls={material?.imageUrls ? material.imageUrls : []} />
                </div>

                {abteilungId && material && hasMetadata && (
                    <Can I='update' this={{ __caslSubjectType__: 'Material' as const, abteilungId }}>
                        <Divider />
                        <h4>{t('material:form.metadataSection')}</h4>
                        {material.purchaseDate && (
                            <p><b>{t('material:view.purchaseDate')}</b> {dayjs(material.purchaseDate).format('DD.MM.YYYY')}</p>
                        )}
                        {material.lifespanInYears != null && (
                            <p><b>{t('material:view.lifespanInYears')}</b> {t('material:view.lifespanUnit', { count: material.lifespanInYears })}</p>
                        )}
                        {material.purchasePrice != null && (
                            <p><b>{t('material:view.purchasePrice')}</b> {t('material:view.priceUnit', { price: material.purchasePrice.toFixed(2) })}</p>
                        )}
                        {material.supplier && (
                            <p><b>{t('material:view.supplier')}</b> {material.supplier}</p>
                        )}
                        {material.inventoryNumber && (
                            <p><b>{t('material:view.inventoryNumber')}</b> {material.inventoryNumber}</p>
                        )}
                        {material.brand && (
                            <p><b>{t('material:view.brand')}</b> {material.brand}</p>
                        )}
                        {material.condition && (
                            <p><b>{t('material:view.condition')}</b> {t(`material:form.${conditionKey[material.condition]}`)}</p>
                        )}
                        {material.warrantyUntil && (
                            <p><b>{t('material:view.warrantyUntil')}</b> {dayjs(material.warrantyUntil).format('DD.MM.YYYY')}</p>
                        )}
                        {material.nextMaintenanceDue && (
                            <p><b>{t('material:view.nextMaintenanceDue')}</b> {dayjs(material.nextMaintenanceDue).format('DD.MM.YYYY')}</p>
                        )}
                        {material.storageInstructions && (
                            <p className={classNames(styles['display-linebreak'])}>
                                <b>{t('material:view.storageInstructions')}</b> {material.storageInstructions}
                            </p>
                        )}
                        {material.maintenanceHistory && material.maintenanceHistory.length > 0 && (
                            <>
                                <p><b>{t('material:view.maintenanceHistory')}</b></p>
                                <Timeline
                                    items={material.maintenanceHistory.map((entry, idx) => ({
                                        children: (
                                            <span key={idx}>
                                                {dayjs(entry.date).format('DD.MM.YYYY')} — {t(`material:form.${maintenanceTypeKey[entry.type]}`)} — {entry.notes}
                                                {entry.user && ` (${entry.user})`}
                                            </span>
                                        ),
                                    }))}
                                />
                            </>
                        )}
                    </Can>
                )}

            </>
        }
        </>
})