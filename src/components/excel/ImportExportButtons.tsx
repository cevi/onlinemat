import { Button, message, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import { useContext, useRef, useState } from 'react';
import { Abteilung } from 'types/abteilung.type';
import { ExcelJson } from 'types/excel.type';
import { exportAbteilungToXlsx, excelToJsonAllSheets, SPREADSHEET_ACCEPT, isSupportedSpreadsheetFile } from 'util/ExcelUtil';
import { CategorysContext, MaterialsContext, StandorteContext } from 'contexts/AbteilungContexts';
import { SammlungenContext } from 'contexts/AbteilungContexts';
import { ExcelCombinedImport } from './ExcelCombinedImport';
import { logExportAuditEntry } from 'util/AuditLogUtil';
import { useUser } from 'hooks/use-user';

export interface ImportExportButtonsProps {
    abteilung: Abteilung;
}

export const ImportExportButtons = (props: ImportExportButtonsProps) => {
    const { abteilung } = props;
    const { t } = useTranslation();
    const user = useUser();

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
        const file = e.target.files?.[0];
        if (file && !isSupportedSpreadsheetFile(file.name)) {
            message.error(t('excel:combined.invalidFileType'));
            clearFileInput();
            return;
        }
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
        const actorId = user.appUser?.userData?.id;
        if (actorId) {
            logExportAuditEntry(abteilung.id, { id: actorId, name: user.appUser?.userData?.displayName || actorId }, {
                materials: materials.length,
                sammlungen: sammlungen.length,
                kategorien: categories.length,
                standorte: standorte.length,
            }, t);
        }
    };

    return (
        <>
            <input
                style={{ display: 'none' }}
                type="file"
                accept={SPREADSHEET_ACCEPT}
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
