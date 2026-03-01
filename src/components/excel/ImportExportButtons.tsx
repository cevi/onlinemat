import { Button, message, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import { useContext, useRef, useState } from 'react';
import { Abteilung } from 'types/abteilung.type';
import { ExcelJson } from 'types/excel.type';
import { exportAbteilungToXlsx, excelToJsonAllSheets } from 'util/ExcelUtil';
import { CategorysContext, MaterialsContext, StandorteContext } from 'contexts/AbteilungContexts';
import { SammlungenContext } from 'contexts/AbteilungContexts';
import { ExcelCombinedImport } from './ExcelCombinedImport';

export interface ImportExportButtonsProps {
    abteilung: Abteilung;
}

export const ImportExportButtons = (props: ImportExportButtonsProps) => {
    const { abteilung } = props;
    const { t } = useTranslation();

    const { materials } = useContext(MaterialsContext);
    const { categories } = useContext(CategorysContext);
    const { standorte } = useContext(StandorteContext);
    const { sammlungen } = useContext(SammlungenContext);

    const [allSheets, setAllSheets] = useState<{ [sheetName: string]: ExcelJson } | undefined>();
    const [showImportModal, setShowImportModal] = useState(false);
    const excelInput = useRef<HTMLInputElement>(null);

    const clearFileInput = () => {
        if (excelInput.current?.value) {
            excelInput.current.value = '';
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const res = await excelToJsonAllSheets(e);
        if (res) {
            setAllSheets(res);
            setShowImportModal(true);
        } else {
            message.error(t('excel:combined.noSheets'));
        }
    };

    const handleExport = () => {
        exportAbteilungToXlsx(abteilung, materials, sammlungen, categories, standorte);
    };

    return (
        <>
            <input
                style={{ display: 'none' }}
                type="file"
                name="excelFile"
                ref={excelInput}
                onChange={handleFileChange}
                onClick={clearFileInput}
            />
            <Space>
                <Button type="primary" onClick={() => excelInput.current?.click()}>
                    Excel Import
                </Button>
                <Button type="primary" onClick={handleExport}>
                    {t('excel:combined.exportButton')}
                </Button>
            </Space>
            <ExcelCombinedImport
                abteilung={abteilung}
                allSheets={allSheets}
                showModal={showImportModal}
                setShow={setShowImportModal}
            />
        </>
    );
};
