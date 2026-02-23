import { message } from 'antd';
import dayjs from 'dayjs';
import { Abteilung } from 'types/abteilung.type';
import { Categorie } from 'types/categorie.types';
import { ExcelJson } from 'types/excel.type';
import { Material, MaterialCondition, MaintenanceHistoryEntry, MaintenanceType } from 'types/material.types';
import * as XLSX from 'xlsx'
import { dateFormat } from './constants';
import {Standort} from "types/standort.types";

const conditionToGerman: Record<string, string> = {
    'new': 'Neu',
    'good': 'Gut',
    'fair': 'Befriedigend',
    'poor': 'Schlecht',
};

const germanToCondition: Record<string, MaterialCondition> = {
    'neu': 'new',
    'gut': 'good',
    'befriedigend': 'fair',
    'schlecht': 'poor',
    'new': 'new',
    'good': 'good',
    'fair': 'fair',
    'poor': 'poor',
};

export const parseCondition = (raw: string): MaterialCondition | undefined => {
    return germanToCondition[raw.toLowerCase().trim()];
};

export const parseMaintenanceHistory = (raw: string): MaintenanceHistoryEntry[] | undefined => {
    if (!raw) return undefined;
    const validTypes: MaintenanceType[] = ['repair', 'control', 'purchase', 'other'];
    const entries = raw.split(';').filter(Boolean);
    return entries.map(entry => {
        const parts = entry.split('|');
        return {
            date: parts[0] || '',
            type: (validTypes.includes(parts[1] as MaintenanceType) ? parts[1] : 'other') as MaintenanceType,
            notes: parts[2] || '',
            user: parts[3] || undefined,
        };
    });
};

export const serializeMaintenanceHistory = (history: MaintenanceHistoryEntry[] | undefined): string => {
    if (!history || history.length === 0) return '';
    return history.map(e =>
        `${e.date}|${e.type}|${e.notes}${e.user ? '|' + e.user : ''}`
    ).join(';');
};


export const excelToJson = async (e: React.ChangeEvent<HTMLInputElement>): Promise<ExcelJson | undefined> => {
    if (!e) return undefined;
    e.preventDefault();
    let excelData: ExcelJson | undefined;
    if (e.target.files) {
        const reader = new FileReader();
        return new Promise((resolve, reject) => {
            reader.onload = (e) => {
                if (!e.target) {
                    message.error('Leider ist ein Fehler beim lesen der Datei aufgetreten');
                    console.error('Leider ist ein Fehler beim lesen der Datei aufgetreten')
                    return;
                }
                const data = e.target.result;
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet, {
                    raw: true,
                    dateNF: 'DD.MM.YYYY',
                    header: 1,
                    defval: null,
                });
                resolve({
                    headers: json[0],
                    data: json.slice(1)
                } as ExcelJson)
            };
            const file = e.target.files;
            if (file !== null && file.length > 0) {
                reader.readAsArrayBuffer(file[0]);
            } else {
                reject()
            }

        })

    }
    return excelData;
}

export const exportMaterialsToXlsx = (abteilung: Abteilung, categories: Categorie[], materials: Material[], standort: Standort[]) => {

    const materialsCleen = materials.sort((a: Material, b: Material) => a.name.localeCompare(b.name)).map(mat => {
        return {
            Name: mat.name,
            Bemerkung: mat.comment,
            Anzahl: mat.count,
            Beschädigt: mat.damaged || 0,
            Verloren: mat.lost || 0,
            Standort: mat.standort?.map(ortId => standort.find(ort => ort.id === ortId)?.name).join(','),
            Gewicht: mat.weightInKg,
            Verbrauchsmaterial: mat.consumables,
            Kategorien: mat.categorieIds?.map(catId => categories.find(cat => cat.id === catId)?.name).join(','),
            Bilder: mat.imageUrls || [].join(','),
            'Nur intern ausleihbar': mat.onlyLendInternal || false,
            Kaufdatum: mat.purchaseDate || '',
            'Lebensdauer (Jahre)': mat.lifespanInYears ?? '',
            'Kaufpreis (CHF)': mat.purchasePrice ?? '',
            Lieferant: mat.supplier || '',
            Inventarnummer: mat.inventoryNumber || '',
            'Marke/Hersteller': mat.brand || '',
            Zustand: mat.condition ? (conditionToGerman[mat.condition] || mat.condition) : '',
            'Garantie bis': mat.warrantyUntil || '',
            'Nächste Kontrolle': mat.nextMaintenanceDue || '',
            Lagerhinweise: mat.storageInstructions || '',
            Wartungshistorie: serializeMaintenanceHistory(mat.maintenanceHistory),
        }
    })

    const materialsWS = XLSX.utils.json_to_sheet(materialsCleen)

    //get second last entry (last one is !ref to get the col char) EX: I1
    const col = Object.keys(materialsWS).slice(-2, -1)[0];

    materialsWS['!autofilter'] = { ref: `A1:${col}` };

    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, materialsWS, 'Material')

    XLSX.writeFile(wb, `${abteilung.name}_Material_${dayjs().format(dateFormat)}.xlsx`)
}