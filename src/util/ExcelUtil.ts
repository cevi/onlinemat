import { message } from 'antd';
import dayjs from 'dayjs';
import { Abteilung } from 'types/abteilung.type';
import { Categorie } from 'types/categorie.types';
import { ExcelJson } from 'types/excel.type';
import { Material, MaterialCondition, MaintenanceHistoryEntry, MaintenanceType } from 'types/material.types';
import { Sammlung } from 'types/sammlung.types';
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


export const exportAbteilungToXlsx = (abteilung: Abteilung, materials: Material[], sammlungen: Sammlung[], categories: Categorie[], standorte: Standort[]) => {
    const wb = XLSX.utils.book_new();

    // Material sheet
    const materialRows = materials.sort((a, b) => a.name.localeCompare(b.name)).map(mat => ({
        Name: mat.name,
        Bemerkung: mat.comment,
        Anzahl: mat.count,
        Beschädigt: mat.damaged || 0,
        Verloren: mat.lost || 0,
        Standort: mat.standort?.map(ortId => standorte.find(ort => ort.id === ortId)?.name).join(','),
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
    }));
    const materialWS = XLSX.utils.json_to_sheet(materialRows);
    if (materialRows.length > 0) {
        const col = Object.keys(materialWS).slice(-2, -1)[0];
        materialWS['!autofilter'] = { ref: `A1:${col}` };
    }
    XLSX.utils.book_append_sheet(wb, materialWS, 'Material');

    // Sammlungen sheet
    const sammlungRows = sammlungen.sort((a, b) => a.name.localeCompare(b.name)).map(sammlung => ({
        Name: sammlung.name,
        Beschreibung: sammlung.description || '',
        Bilder: (sammlung.imageUrls || []).join(','),
        Materialien: sammlung.items.map(item => {
            const mat = materials.find(m => m.id === item.matId);
            return `${mat?.name || item.matId}:${item.count}`;
        }).join(','),
    }));
    const sammlungWS = XLSX.utils.json_to_sheet(sammlungRows);
    if (sammlungRows.length > 0) {
        const col = Object.keys(sammlungWS).slice(-2, -1)[0];
        sammlungWS['!autofilter'] = { ref: `A1:${col}` };
    }
    XLSX.utils.book_append_sheet(wb, sammlungWS, 'Sammlungen');

    // Kategorien sheet
    const kategorieRows = categories.sort((a, b) => a.name.localeCompare(b.name)).map(cat => ({
        Name: cat.name,
    }));
    const kategorieWS = XLSX.utils.json_to_sheet(kategorieRows);
    XLSX.utils.book_append_sheet(wb, kategorieWS, 'Kategorien');

    // Standorte sheet
    const standortRows = standorte.sort((a, b) => a.name.localeCompare(b.name)).map(ort => ({
        Name: ort.name,
        Strasse: ort.street || '',
        Stadt: ort.city || '',
        Koordinaten: ort.coordinates || '',
    }));
    const standortWS = XLSX.utils.json_to_sheet(standortRows);
    XLSX.utils.book_append_sheet(wb, standortWS, 'Standorte');

    XLSX.writeFile(wb, `${abteilung.name}_Export_${dayjs().format(dateFormat)}.xlsx`);
}

export const excelToJsonAllSheets = async (e: React.ChangeEvent<HTMLInputElement>): Promise<{ [sheetName: string]: ExcelJson } | undefined> => {
    if (!e) return undefined;
    e.preventDefault();
    if (e.target.files) {
        const reader = new FileReader();
        return new Promise((resolve, reject) => {
            reader.onload = (ev) => {
                if (!ev.target) {
                    message.error('Leider ist ein Fehler beim lesen der Datei aufgetreten');
                    return;
                }
                const data = ev.target.result;
                const workbook = XLSX.read(data, { type: 'array' });
                const result: { [sheetName: string]: ExcelJson } = {};

                for (const sheetName of workbook.SheetNames) {
                    const worksheet = workbook.Sheets[sheetName];
                    const json = XLSX.utils.sheet_to_json(worksheet, {
                        raw: true,
                        dateNF: 'DD.MM.YYYY',
                        header: 1,
                        defval: null,
                    }) as unknown[][];
                    if (json.length > 0) {
                        result[sheetName] = {
                            headers: json[0] as string[],
                            data: json.slice(1),
                        };
                    }
                }
                resolve(result);
            };
            const file = e.target.files;
            if (file !== null && file.length > 0) {
                reader.readAsArrayBuffer(file[0]);
            } else {
                reject();
            }
        });
    }
    return undefined;
}