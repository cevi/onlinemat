import React, {forwardRef, useContext, useState} from 'react';
import {Spin} from 'antd';
import { useTranslation } from 'react-i18next';
import {Material} from 'types/material.types';
import {getAvailableMatCount} from 'util/MaterialUtil';
import {CategorysContext, StandorteContext} from 'components/abteilung/AbteilungDetails';
import styles from './Material.module.scss';
import classNames from "classnames";
import { PicturesWall } from 'components/pictures/PictureWall';
import {displayCategorieNames, displayStandortNames} from "./MaterialTable";

export interface ViewMaterialProps {
    material?: Material
}

export const ViewMaterial = forwardRef((props: ViewMaterialProps, ref) => {
    const { t } = useTranslation();

    const {  material } = props;

    //fetch categories
    const categoriesContext = useContext(CategorysContext);
    const categories = categoriesContext.categories;
    const catLoading = categoriesContext.loading;

    //fetch Standorte
    const standorteContext = useContext(StandorteContext);
    const standorte = standorteContext.standorte;
    const standorteLoading = standorteContext.loading;

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
                <p>
                    <PicturesWall showRemove={false} imageUrls={material?.imageUrls ? material.imageUrls : []} />
                </p>

            </>
        }
        </>
})