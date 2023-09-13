import React, {forwardRef, useContext, useState} from 'react';
import {Spin} from 'antd';
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

    const {  material } = props;

    //fetch categories
    const categoriesContext = useContext(CategorysContext);
    const categories = categoriesContext.categories;
    const catLoading = categoriesContext.loading;

    //fetch Standorte
    const standorteContext = useContext(StandorteContext);
    const standorte = standorteContext.standorte;
    const standorteLoading = standorteContext.loading;

    const [renderMatImages, setRenderMatImages] = useState(material?.imageUrls || []);

    const [availCount, setAvailCount] = useState<number>(getAvailableMatCount(material));

    // @ts-ignore
    return <>
        {
            catLoading && standorteLoading ? <Spin /> : <>

                <p className={classNames(styles['display-linebreak'])}>
                    <b>Bemerkung:</b> {material?.comment}
                </p>
                <p>
                    <b>Standort:</b> {displayStandortNames(standorte, material?.standort || [])}
                </p>
                <p>
                    <b>Verfügbar:</b> {availCount}
                </p>
                <p>
                    <b>Gewicht in Kg:</b> {material?.weightInKg}
                </p>
                <p>
                    <b>Kategorien:</b> {displayCategorieNames(categories, material?.categorieIds || [])}
                </p>
                <p>
                    <PicturesWall showRemove={false} imageUrls={renderMatImages} />
                </p>

            </>
        }
        </>
})