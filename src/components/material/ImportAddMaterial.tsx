import { message,Button } from 'antd';
import {Abteilung} from 'types/abteilung.type';
import { useState } from 'react';
import { ExcelJson } from 'types/excel.type';
import { ExcelImport } from './ExcelImport';
import { excelToJson } from 'util/ExcelUtil';
import React from 'react'

export interface importAddMaterialProps {
    abteilung: Abteilung
}

export const ImportAddMaterialButton = (props: importAddMaterialProps) => {
    const { abteilung} = props;
    const [excelData, setExcelData] = useState<ExcelJson | undefined>();
    const [showImportModal, setShowImportModal] = useState<boolean>(false);
    const [updateLoading] = useState(false);
    let excelInput = React.useRef<HTMLInputElement>(null);

    return <>
       <input
        style={{ display: 'none' }} 
            type='file'
            name='excelFile'
            id='uploadExcel'
            ref = {excelInput}
            onChange={async (e) => {
                const res = await excelToJson(e);
                if(res) {
                    setExcelData(res)
                    setShowImportModal(true)
                } else {
                    message.error('Leider ist ein Fehler beim lesen der Datei aufgetreten 2');
                }
            }}
        />
        <Button type='primary' disabled={updateLoading} onClick={() => excelInput?.current?.click()}>
            Excel Import
        </Button>     
        <ExcelImport abteilung={abteilung} excelData={excelData} showModal={showImportModal} setShow={setShowImportModal}/>
    </>
}