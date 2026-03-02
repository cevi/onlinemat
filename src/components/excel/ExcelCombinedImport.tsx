import {
    Button,
    Col,
    Input,
    InputNumber,
    message,
    Modal,
    Popconfirm,
    Row,
    Select,
    Switch,
    Tabs,
    Tooltip,
    Typography,
} from 'antd';
import { useTranslation } from 'react-i18next';
import { useContext, useEffect, useState } from 'react';
import { Abteilung } from 'types/abteilung.type';
import { ExcelJson } from 'types/excel.type';
import { Material, MaterialCondition } from 'types/material.types';
import { SammlungItem } from 'types/sammlung.types';
import { Categorie } from 'types/categorie.types';
import { Standort } from 'types/standort.types';
import { CategorysContext, MaterialsContext, StandorteContext } from 'contexts/AbteilungContexts';
import { parseCondition, parseMaintenanceHistory } from 'util/ExcelUtil';
import { massImportMaterial, deleteAllMaterials } from 'util/MaterialUtil';
import { massImportSammlung, deleteAllSammlungen } from 'util/SammlungUtil';
import { massImportCategory, deleteAllCategories } from 'util/CategoryUtil';
import { massImportStandort, deleteAllStandorte } from 'util/StandortUtil';

export interface ExcelCombinedImportProps {
    abteilung: Abteilung;
    allSheets: { [sheetName: string]: ExcelJson } | undefined;
    showModal: boolean;
    setShow: (show: boolean) => void;
}

// Reusable mapping field component
const MappingField = ({
    label,
    headers,
    selected,
    setSelected,
    example,
    defaultInput,
}: {
    label: string;
    headers: string[];
    selected: string | undefined;
    setSelected: (val: string | undefined) => void;
    example?: string;
    defaultInput?: React.ReactNode;
}) => {
    const { t } = useTranslation();
    return (
        <>
            <Col span={12}>
                <p>{label}</p>
                {selected && example && <p>{t('excel:combined.example', { value: example })}</p>}
            </Col>
            <Col span={12}>
                <Select
                    showSearch
                    value={selected}
                    placeholder={t('excel:combined.selectPlaceholder')}
                    optionFilterProp="children"
                    onChange={setSelected}
                    filterOption={(input, option) =>
                        option ? (option.children as any).toLowerCase().indexOf(input.toLowerCase()) >= 0 : false
                    }
                    style={{ width: '100%' }}
                >
                    <Select.Option key="none" value={undefined}>
                        {t('excel:combined.noneOption')}
                    </Select.Option>
                    {headers.map((o) => (
                        <Select.Option key={o} value={o}>
                            {o}
                        </Select.Option>
                    ))}
                </Select>
                {!selected && defaultInput}
            </Col>
        </>
    );
};

const parseMaterialien = (raw: string, allMaterials: Material[]): { items: SammlungItem[]; unmatched: string[] } => {
    if (!raw) return { items: [], unmatched: [] };
    const items: SammlungItem[] = [];
    const unmatched: string[] = [];
    const entries = String(raw).split(',').map(s => s.trim()).filter(Boolean);
    for (const entry of entries) {
        const lastColon = entry.lastIndexOf(':');
        if (lastColon === -1) { unmatched.push(entry); continue; }
        const matName = entry.substring(0, lastColon).trim();
        const count = parseInt(entry.substring(lastColon + 1).trim(), 10);
        if (!matName || isNaN(count) || count <= 0) { unmatched.push(entry); continue; }
        const mat = allMaterials.find(m => m.name.toLowerCase() === matName.toLowerCase());
        if (!mat) { unmatched.push(matName); continue; }
        items.push({ matId: mat.id, count });
    }
    return { items, unmatched };
};

// Auto-match helper
function autoMatch(headers: string[], fieldMappings: { aliases: string[]; setter: (val: string | undefined) => void }[]) {
    const usedHeaders = new Set<string>();
    for (const { aliases, setter } of fieldMappings) {
        const match = headers.find(h => !usedHeaders.has(h) && aliases.includes(h.toLowerCase().trim()));
        if (match) { setter(match); usedHeaders.add(match); }
    }
}

function findExampleData(excelData: ExcelJson, key: string | undefined): string {
    if (!excelData || !key) return '';
    const index = excelData.headers.findIndex(h => h === key);
    const res = excelData.data.find(data => data[index] !== null);
    return res ? String(res[index]) : '';
}

export const ExcelCombinedImport = (props: ExcelCombinedImportProps) => {
    const { abteilung, allSheets, showModal, setShow } = props;
    const { t } = useTranslation();

    const { categories } = useContext(CategorysContext);
    const { standorte } = useContext(StandorteContext);
    const { materials } = useContext(MaterialsContext);

    const materialData = allSheets?.['Material'];
    const sammlungData = allSheets?.['Sammlungen'];
    const kategorienData = allSheets?.['Kategorien'];
    const standorteData = allSheets?.['Standorte'];

    // ========== Material column mappings ==========
    const [matName, setMatName] = useState<string | undefined>();
    const [matComment, setMatComment] = useState<string | undefined>();
    const [matCount, setMatCount] = useState<string | undefined>();
    const [matLost, setMatLost] = useState<string | undefined>();
    const [matDamaged, setMatDamaged] = useState<string | undefined>();
    const [matStandort, setMatStandort] = useState<string | undefined>();
    const [matWeight, setMatWeight] = useState<string | undefined>();
    const [matConsumables, setMatConsumables] = useState<string | undefined>();
    const [matCategories, setMatCategories] = useState<string | undefined>();
    const [matImages, setMatImages] = useState<string | undefined>();
    const [matOnlyInternal, setMatOnlyInternal] = useState<string | undefined>();
    const [matPurchaseDate, setMatPurchaseDate] = useState<string | undefined>();
    const [matLifespan, setMatLifespan] = useState<string | undefined>();
    const [matPurchasePrice, setMatPurchasePrice] = useState<string | undefined>();
    const [matSupplier, setMatSupplier] = useState<string | undefined>();
    const [matInventoryNumber, setMatInventoryNumber] = useState<string | undefined>();
    const [matBrand, setMatBrand] = useState<string | undefined>();
    const [matCondition, setMatCondition] = useState<string | undefined>();
    const [matWarranty, setMatWarranty] = useState<string | undefined>();
    const [matNextMaintenance, setMatNextMaintenance] = useState<string | undefined>();
    const [matStorageInstructions, setMatStorageInstructions] = useState<string | undefined>();
    const [matMaintenanceHistory, setMatMaintenanceHistory] = useState<string | undefined>();

    // Material defaults
    const [defaultComment, setDefaultComment] = useState<string | null>(null);
    const [defaultCount, setDefaultCount] = useState<number>(1);
    const [defaultLost, setDefaultLost] = useState<number>(0);
    const [defaultDamaged, setDefaultDamaged] = useState<number>(0);
    const [defaultWeight, setDefaultWeight] = useState<number | null>(null);
    const [defaultConsumables, setDefaultConsumables] = useState<boolean>(false);
    const [defaultCategorieIds, setDefaultCategorieIds] = useState<string[]>([]);
    const [defaultStandort, setDefaultStandort] = useState<string[]>([]);
    const [defaultImages, setDefaultImages] = useState<string | null>(null);
    const [defaultOnlyInternal, setDefaultOnlyInternal] = useState<boolean>(false);
    const [defaultSupplier, setDefaultSupplier] = useState<string | null>(null);
    const [defaultBrand, setDefaultBrand] = useState<string | null>(null);
    const [defaultCondition, setDefaultCondition] = useState<MaterialCondition | null>(null);

    // ========== Sammlung column mappings ==========
    const [samName, setSamName] = useState<string | undefined>();
    const [samDescription, setSamDescription] = useState<string | undefined>();
    const [samImages, setSamImages] = useState<string | undefined>();
    const [samMaterialien, setSamMaterialien] = useState<string | undefined>();
    const [defaultSamDescription, setDefaultSamDescription] = useState<string | null>(null);

    // ========== Kategorie column mappings ==========
    const [katName, setKatName] = useState<string | undefined>();

    // ========== Standort column mappings ==========
    const [ortName, setOrtName] = useState<string | undefined>();
    const [ortStreet, setOrtStreet] = useState<string | undefined>();
    const [ortCity, setOrtCity] = useState<string | undefined>();
    const [ortCoordinates, setOrtCoordinates] = useState<string | undefined>();

    // Auto-match all sheets
    useEffect(() => {
        if (materialData) {
            autoMatch(materialData.headers, [
                { aliases: ['name'], setter: setMatName },
                { aliases: ['bemerkung', 'comment', 'kommentar'], setter: setMatComment },
                { aliases: ['standort', 'location', 'ort'], setter: setMatStandort },
                { aliases: ['anzahl', 'count', 'menge'], setter: setMatCount },
                { aliases: ['verloren', 'lost'], setter: setMatLost },
                { aliases: ['beschädigt', 'damaged', 'beschaedigt'], setter: setMatDamaged },
                { aliases: ['gewicht in kg', 'gewicht', 'weight', 'weightinkg'], setter: setMatWeight },
                { aliases: ['verbrauchsmaterial', 'ist verbrauchsmaterial', 'consumables'], setter: setMatConsumables },
                { aliases: ['kategorien', 'kategorie', 'categories', 'category'], setter: setMatCategories },
                { aliases: ['bilder', 'images', 'bild'], setter: setMatImages },
                { aliases: ['nur intern ausleihbar', 'nur intern', 'only internal', 'onlylendinternal'], setter: setMatOnlyInternal },
                { aliases: ['kaufdatum', 'purchase date', 'purchasedate'], setter: setMatPurchaseDate },
                { aliases: ['lebensdauer', 'lebensdauer (jahre)', 'lifespan', 'lifespaninyears'], setter: setMatLifespan },
                { aliases: ['kaufpreis', 'kaufpreis (chf)', 'purchase price', 'purchaseprice'], setter: setMatPurchasePrice },
                { aliases: ['lieferant', 'supplier'], setter: setMatSupplier },
                { aliases: ['inventarnummer', 'inventory number', 'inventorynumber'], setter: setMatInventoryNumber },
                { aliases: ['marke', 'marke/hersteller', 'brand', 'hersteller'], setter: setMatBrand },
                { aliases: ['zustand', 'condition'], setter: setMatCondition },
                { aliases: ['garantie bis', 'garantie', 'warranty', 'warrantyuntil'], setter: setMatWarranty },
                { aliases: ['nächste kontrolle', 'naechste kontrolle', 'next maintenance', 'nextmaintenancedue'], setter: setMatNextMaintenance },
                { aliases: ['lagerhinweise', 'storage instructions', 'storageinstructions'], setter: setMatStorageInstructions },
                { aliases: ['wartungshistorie', 'maintenance history', 'maintenancehistory'], setter: setMatMaintenanceHistory },
            ]);
        }
        if (sammlungData) {
            autoMatch(sammlungData.headers, [
                { aliases: ['name', 'sammlung', 'collection'], setter: setSamName },
                { aliases: ['beschreibung', 'description', 'bemerkung'], setter: setSamDescription },
                { aliases: ['bilder', 'images', 'bild', 'image urls'], setter: setSamImages },
                { aliases: ['materialien', 'materials', 'items', 'material'], setter: setSamMaterialien },
            ]);
        }
        if (kategorienData) {
            autoMatch(kategorienData.headers, [
                { aliases: ['name', 'kategorie', 'category'], setter: setKatName },
            ]);
        }
        if (standorteData) {
            autoMatch(standorteData.headers, [
                { aliases: ['name', 'standort', 'location'], setter: setOrtName },
                { aliases: ['strasse', 'street', 'str'], setter: setOrtStreet },
                { aliases: ['stadt', 'city', 'ort'], setter: setOrtCity },
                { aliases: ['koordinaten', 'coordinates', 'coords'], setter: setOrtCoordinates },
            ]);
        }
    }, [allSheets]);

    const importAll = async (mode: 'add' | 'replace') => {
        if (!allSheets) return;

        try {
            // 1. Delete all if replace mode
            if (mode === 'replace') {
                await deleteAllCategories(abteilung.id);
                await deleteAllStandorte(abteilung.id);
                await deleteAllMaterials(abteilung.id);
                await deleteAllSammlungen(abteilung.id);
            }

            let importedKategorien = 0;
            let importedStandorte = 0;
            let importedMaterials = 0;
            let importedSammlungen = 0;

            // Collect all available categories and standorte (context + newly imported)
            let allCategories = mode === 'replace' ? [] : [...categories];
            let allStandorte = mode === 'replace' ? [] : [...standorte];
            let allMaterials = mode === 'replace' ? [] : [...materials];

            // 2. Import Kategorien
            if (kategorienData && katName) {
                const idx = kategorienData.headers.indexOf(katName);
                const names: string[] = [];
                for (const row of kategorienData.data) {
                    const name = String(row[idx] || '').trim();
                    if (name && !allCategories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
                        names.push(name);
                    }
                }
                if (names.length > 0) {
                    const created = await massImportCategory(abteilung.id, names);
                    allCategories = [...allCategories, ...created];
                    importedKategorien = created.length;
                }
            }

            // 3. Import Standorte
            if (standorteData && ortName) {
                const indexes: { [key: string]: number } = {};
                standorteData.headers.forEach((key) => {
                    indexes[key] = standorteData.headers.indexOf(key);
                });
                const orte: Omit<Standort, 'id' | '__caslSubjectType__'>[] = [];
                for (const row of standorteData.data) {
                    const name = String(row[indexes[ortName]] || '').trim();
                    if (!name) continue;
                    if (allStandorte.some(s => s.name.toLowerCase() === name.toLowerCase())) continue;
                    const ort: any = { name };
                    if (ortStreet) { const v = String(row[indexes[ortStreet]] || '').trim(); if (v) ort.street = v; }
                    if (ortCity) { const v = String(row[indexes[ortCity]] || '').trim(); if (v) ort.city = v; }
                    if (ortCoordinates) { const v = String(row[indexes[ortCoordinates]] || '').trim(); if (v) ort.coordinates = v; }
                    orte.push(ort);
                }
                if (orte.length > 0) {
                    const created = await massImportStandort(abteilung.id, orte);
                    allStandorte = [...allStandorte, ...created];
                    importedStandorte = created.length;
                }
            }

            // 4. Import Materials
            if (materialData && matName) {
                const indexes: { [key: string]: number } = {};
                materialData.headers.forEach((key) => {
                    indexes[key] = materialData.headers.indexOf(key);
                });

                const newCategoriesToCreate: string[] = [];
                const newStandorteToCreate: string[] = [];
                const materialList: Material[] = [];

                for (const row of materialData.data) {
                    const rawName = row[indexes[matName]] as string;
                    if (!rawName) continue;
                    const sanitizedName = String(rawName).trim().slice(0, 200);
                    if (!sanitizedName) continue;

                    const comment: string | null = matComment ? (row[indexes[matComment]] as string) : defaultComment;
                    const count: number = matCount ? (row[indexes[matCount]] as number) : defaultCount;
                    const lost: number = matLost ? (row[indexes[matLost]] as number) : defaultLost;
                    const damaged: number = matDamaged ? (row[indexes[matDamaged]] as number) : defaultDamaged;
                    const weight: number | null = matWeight ? (row[indexes[matWeight]] as number) : defaultWeight;
                    const consumables: boolean = matConsumables ? (row[indexes[matConsumables]] as boolean) : defaultConsumables;
                    const onlyInternal: boolean = matOnlyInternal ? (row[indexes[matOnlyInternal]] as boolean) : defaultOnlyInternal;

                    // Resolve categories
                    const matCatIdsRaw: string | null = matCategories ? (row[indexes[matCategories]] as string) : null;
                    const materialCategorieIds: string[] = [];
                    if (matCatIdsRaw) {
                        const catNames = matCatIdsRaw.replaceAll(' ', '').split(',').filter(Boolean);
                        for (const catName of catNames) {
                            const existing = allCategories.find(c => c.name.toLowerCase() === catName.toLowerCase());
                            if (existing) { materialCategorieIds.push(existing.id); continue; }
                            const pending = newCategoriesToCreate.find(c => c.toLowerCase() === catName.toLowerCase());
                            if (pending) { materialCategorieIds.push(catName); continue; }
                            newCategoriesToCreate.push(catName);
                            materialCategorieIds.push(catName);
                        }
                    } else if (!matCategories && defaultCategorieIds.length > 0) {
                        materialCategorieIds.push(...defaultCategorieIds);
                    }

                    // Resolve standorte
                    const matOrtRaw: string | null = matStandort ? (row[indexes[matStandort]] as string) : null;
                    const matStandortIds: string[] = [];
                    if (matOrtRaw) {
                        const ortNames = matOrtRaw.replaceAll(' ', '').split(',').filter(Boolean);
                        for (const ortName of ortNames) {
                            const existing = allStandorte.find(s => s.name.toLowerCase() === ortName.toLowerCase());
                            if (existing) { matStandortIds.push(existing.id); continue; }
                            const pending = newStandorteToCreate.find(s => s.toLowerCase() === ortName.toLowerCase());
                            if (pending) { matStandortIds.push(ortName); continue; }
                            newStandorteToCreate.push(ortName);
                            matStandortIds.push(ortName);
                        }
                    } else if (!matStandort && defaultStandort.length > 0) {
                        matStandortIds.push(...defaultStandort);
                    }

                    // Images
                    const matImagesRaw: string | null = matImages ? (row[indexes[matImages]] as string) : defaultImages;
                    const imageUrls = matImagesRaw
                        ? String(matImagesRaw).replaceAll(' ', '').split(',').filter(u => u.startsWith('https://') || u.startsWith('http://'))
                        : [];

                    // Metadata
                    const purchaseDate = matPurchaseDate ? (String(row[indexes[matPurchaseDate]] || '')) || undefined : undefined;
                    const lifespanInYears = matLifespan ? (Number(row[indexes[matLifespan]]) || undefined) : undefined;
                    const purchasePrice = matPurchasePrice ? (Number(row[indexes[matPurchasePrice]]) || undefined) : undefined;
                    const supplier = matSupplier ? (String(row[indexes[matSupplier]] || '')) || defaultSupplier || undefined : defaultSupplier || undefined;
                    const inventoryNumber = matInventoryNumber ? (String(row[indexes[matInventoryNumber]] || '')) || undefined : undefined;
                    const brand = matBrand ? (String(row[indexes[matBrand]] || '')) || defaultBrand || undefined : defaultBrand || undefined;
                    const condition = matCondition ? parseCondition(String(row[indexes[matCondition]] || '')) || undefined : defaultCondition || undefined;
                    const warrantyUntil = matWarranty ? (String(row[indexes[matWarranty]] || '')) || undefined : undefined;
                    const nextMaintenanceDue = matNextMaintenance ? (String(row[indexes[matNextMaintenance]] || '')) || undefined : undefined;
                    const storageInstructions = matStorageInstructions ? (String(row[indexes[matStorageInstructions]] || '')) || undefined : undefined;
                    const maintenanceHistory = matMaintenanceHistory ? parseMaintenanceHistory(String(row[indexes[matMaintenanceHistory]] || '')) : undefined;

                    materialList.push({
                        name: sanitizedName,
                        comment: comment ? comment.toString().trim().slice(0, 1000) : null,
                        count: Number.isFinite(count) && count >= 0 ? Math.floor(count) : 1,
                        lost: Number.isFinite(lost) && lost >= 0 ? Math.floor(lost) : 0,
                        damaged: Number.isFinite(damaged) && damaged >= 0 ? Math.floor(damaged) : 0,
                        weightInKg: weight !== null && Number.isFinite(weight) ? weight : null,
                        consumables: Boolean(consumables),
                        categorieIds: materialCategorieIds,
                        imageUrls,
                        standort: matStandortIds,
                        onlyLendInternal: Boolean(onlyInternal),
                        ...(purchaseDate && { purchaseDate }),
                        ...(lifespanInYears != null && { lifespanInYears }),
                        ...(purchasePrice != null && { purchasePrice }),
                        ...(supplier && { supplier }),
                        ...(inventoryNumber && { inventoryNumber }),
                        ...(brand && { brand }),
                        ...(condition && { condition }),
                        ...(warrantyUntil && { warrantyUntil }),
                        ...(nextMaintenanceDue && { nextMaintenanceDue }),
                        ...(storageInstructions && { storageInstructions }),
                        ...(maintenanceHistory && maintenanceHistory.length > 0 && { maintenanceHistory }),
                    } as Material);
                }

                // Create missing categories from material data
                if (newCategoriesToCreate.length > 0) {
                    const createdCats = await massImportCategory(abteilung.id, newCategoriesToCreate);
                    allCategories = [...allCategories, ...createdCats];
                    // Replace placeholder names with IDs
                    for (const mat of materialList) {
                        if (mat.categorieIds) {
                            mat.categorieIds = mat.categorieIds.map(id => {
                                const found = createdCats.find(c => c.name === id);
                                return found ? found.id : id;
                            });
                        }
                    }
                }

                // Create missing standorte from material data
                if (newStandorteToCreate.length > 0) {
                    const createdOrte = await massImportStandort(
                        abteilung.id,
                        newStandorteToCreate.map(name => ({ name }))
                    );
                    allStandorte = [...allStandorte, ...createdOrte];
                    // Replace placeholder names with IDs
                    for (const mat of materialList) {
                        if (mat.standort) {
                            mat.standort = mat.standort.map(id => {
                                const found = createdOrte.find(s => s.name === id);
                                return found ? found.id : id;
                            });
                        }
                    }
                }

                if (materialList.length > 0) {
                    const createdMaterials = await massImportMaterial(abteilung.id, materialList);
                    allMaterials = [...allMaterials, ...createdMaterials];
                    importedMaterials = materialList.length;
                }
            }

            // 5. Import Sammlungen
            if (sammlungData && samName && samMaterialien) {
                const indexes: { [key: string]: number } = {};
                sammlungData.headers.forEach((key) => {
                    indexes[key] = sammlungData.headers.indexOf(key);
                });

                const sammlungen: { name: string; description?: string; imageUrls?: string[]; items: SammlungItem[] }[] = [];
                const allUnmatched: string[] = [];
                let skippedCount = 0;

                for (const row of sammlungData.data) {
                    const rawName = row[indexes[samName]] as string;
                    if (!rawName) continue;
                    const sanitizedName = String(rawName).trim().slice(0, 200);
                    if (!sanitizedName) continue;

                    const description = samDescription
                        ? (String(row[indexes[samDescription]] || '')) || defaultSamDescription || undefined
                        : defaultSamDescription || undefined;
                    const imagesRaw = samImages ? (String(row[indexes[samImages]] || '')) || null : null;
                    const parsedImages = imagesRaw
                        ? imagesRaw.split(',').map(u => u.trim()).filter(u => u.startsWith('https://') || u.startsWith('http://'))
                        : undefined;

                    const materialienRaw = String(row[indexes[samMaterialien]] || '');
                    const { items, unmatched } = parseMaterialien(materialienRaw, allMaterials);
                    allUnmatched.push(...unmatched);

                    if (items.length === 0) { skippedCount++; continue; }

                    sammlungen.push({
                        name: sanitizedName,
                        ...(description && { description }),
                        ...(parsedImages && parsedImages.length > 0 && { imageUrls: parsedImages }),
                        items,
                    });
                }

                if (allUnmatched.length > 0) {
                    const unique = [...new Set(allUnmatched)];
                    message.warning(t('excel:combined.materialWarning', {
                        count: unique.length,
                        names: unique.slice(0, 10).join(', '),
                    }));
                }
                if (skippedCount > 0) {
                    message.warning(t('excel:combined.skippedEmpty', { count: skippedCount }));
                }

                if (sammlungen.length > 0) {
                    await massImportSammlung(abteilung.id, sammlungen);
                    importedSammlungen = sammlungen.length;
                }
            }

            message.success(t('excel:combined.success', {
                materials: importedMaterials,
                sammlungen: importedSammlungen,
                kategorien: importedKategorien,
                standorte: importedStandorte,
            }));
            setShow(false);
        } catch (err) {
            message.error(t('common:errors.generic', { error: String(err) }));
            console.error('Import error:', err);
        }
    };

    if (!allSheets) return <></>;

    const hasAnySheet = materialData || sammlungData || kategorienData || standorteData;
    if (!hasAnySheet) {
        message.warning(t('excel:combined.noSheets'));
        return <></>;
    }

    const tabItems = [];

    // Material tab
    if (materialData) {
        const h = materialData.headers;
        const ex = (key: string | undefined) => findExampleData(materialData, key);
        tabItems.push({
            key: 'material',
            label: `${t('excel:combined.tabMaterial')} ${t('excel:combined.rowCount', { count: materialData.data.length })}`,
            children: (
                <Row gutter={[16, 16]}>
                    <MappingField label={t('excel:fields.name')} headers={h} selected={matName} setSelected={setMatName} example={ex(matName)} />
                    <MappingField label={t('excel:fields.comment')} headers={h} selected={matComment} setSelected={setMatComment} example={ex(matComment)}
                        defaultInput={<Input placeholder={t('excel:combined.defaultValue')} value={defaultComment ?? undefined} onChange={e => setDefaultComment(e.target.value || null)} style={{ width: '100%', marginTop: 4 }} />}
                    />
                    <MappingField label={t('excel:fields.standort')} headers={h} selected={matStandort} setSelected={setMatStandort} example={ex(matStandort)}
                        defaultInput={<Select mode="multiple" placeholder={t('excel:fields.defaultStandort')} value={defaultStandort} onChange={setDefaultStandort} style={{ width: '100%', marginTop: 4 }}>
                            {standorte.map(s => <Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>)}
                        </Select>}
                    />
                    <MappingField label={t('excel:fields.count')} headers={h} selected={matCount} setSelected={setMatCount} example={ex(matCount)}
                        defaultInput={<InputNumber placeholder={t('excel:combined.defaultValue')} value={defaultCount} min={0} onChange={val => setDefaultCount(val ?? 1)} style={{ width: '100%', marginTop: 4 }} />}
                    />
                    <MappingField label={t('excel:fields.lost')} headers={h} selected={matLost} setSelected={setMatLost} example={ex(matLost)}
                        defaultInput={<InputNumber placeholder={t('excel:combined.defaultValue')} value={defaultLost} min={0} onChange={val => setDefaultLost(val ?? 0)} style={{ width: '100%', marginTop: 4 }} />}
                    />
                    <MappingField label={t('excel:fields.damaged')} headers={h} selected={matDamaged} setSelected={setMatDamaged} example={ex(matDamaged)}
                        defaultInput={<InputNumber placeholder={t('excel:combined.defaultValue')} value={defaultDamaged} min={0} onChange={val => setDefaultDamaged(val ?? 0)} style={{ width: '100%', marginTop: 4 }} />}
                    />
                    <MappingField label={t('excel:fields.weight')} headers={h} selected={matWeight} setSelected={setMatWeight} example={ex(matWeight)}
                        defaultInput={<InputNumber placeholder={t('excel:combined.defaultValue')} value={defaultWeight ?? undefined} min={0} onChange={val => setDefaultWeight(val ?? null)} style={{ width: '100%', marginTop: 4 }} />}
                    />
                    <MappingField label={t('excel:fields.consumables')} headers={h} selected={matConsumables} setSelected={setMatConsumables} example={ex(matConsumables)}
                        defaultInput={<div style={{ marginTop: 4 }}><Switch checked={defaultConsumables} onChange={setDefaultConsumables} /> <span>{defaultConsumables ? t('common:confirm.yes') : t('common:confirm.no')}</span></div>}
                    />
                    <MappingField label={t('excel:fields.categories')} headers={h} selected={matCategories} setSelected={setMatCategories} example={ex(matCategories)}
                        defaultInput={<Select mode="multiple" placeholder={t('excel:fields.defaultCategories')} value={defaultCategorieIds} onChange={setDefaultCategorieIds} style={{ width: '100%', marginTop: 4 }}>
                            {categories.map(c => <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>)}
                        </Select>}
                    />
                    <MappingField label={t('excel:fields.images')} headers={h} selected={matImages} setSelected={setMatImages} example={ex(matImages)}
                        defaultInput={<Input placeholder={t('excel:fields.defaultImageUrls')} value={defaultImages ?? undefined} onChange={e => setDefaultImages(e.target.value || null)} style={{ width: '100%', marginTop: 4 }} />}
                    />
                    <MappingField label={t('excel:fields.onlyLendInternal')} headers={h} selected={matOnlyInternal} setSelected={setMatOnlyInternal} example={ex(matOnlyInternal)}
                        defaultInput={<div style={{ marginTop: 4 }}><Switch checked={defaultOnlyInternal} onChange={setDefaultOnlyInternal} /> <span>{defaultOnlyInternal ? t('common:confirm.yes') : t('common:confirm.no')}</span></div>}
                    />
                    <MappingField label={t('excel:fields.purchaseDate')} headers={h} selected={matPurchaseDate} setSelected={setMatPurchaseDate} example={ex(matPurchaseDate)} />
                    <MappingField label={t('excel:fields.lifespanInYears')} headers={h} selected={matLifespan} setSelected={setMatLifespan} example={ex(matLifespan)} />
                    <MappingField label={t('excel:fields.purchasePrice')} headers={h} selected={matPurchasePrice} setSelected={setMatPurchasePrice} example={ex(matPurchasePrice)} />
                    <MappingField label={t('excel:fields.supplier')} headers={h} selected={matSupplier} setSelected={setMatSupplier} example={ex(matSupplier)}
                        defaultInput={<Input placeholder={t('excel:combined.defaultValue')} value={defaultSupplier ?? undefined} onChange={e => setDefaultSupplier(e.target.value || null)} style={{ width: '100%', marginTop: 4 }} />}
                    />
                    <MappingField label={t('excel:fields.inventoryNumber')} headers={h} selected={matInventoryNumber} setSelected={setMatInventoryNumber} example={ex(matInventoryNumber)} />
                    <MappingField label={t('excel:fields.brand')} headers={h} selected={matBrand} setSelected={setMatBrand} example={ex(matBrand)}
                        defaultInput={<Input placeholder={t('excel:combined.defaultValue')} value={defaultBrand ?? undefined} onChange={e => setDefaultBrand(e.target.value || null)} style={{ width: '100%', marginTop: 4 }} />}
                    />
                    <MappingField label={t('excel:fields.condition')} headers={h} selected={matCondition} setSelected={setMatCondition} example={ex(matCondition)}
                        defaultInput={<Select allowClear placeholder={t('excel:combined.defaultValue')} value={defaultCondition ?? undefined} onChange={val => setDefaultCondition(val || null)} style={{ width: '100%', marginTop: 4 }}>
                            <Select.Option value="new">{t('material:form.conditionNew')}</Select.Option>
                            <Select.Option value="good">{t('material:form.conditionGood')}</Select.Option>
                            <Select.Option value="fair">{t('material:form.conditionFair')}</Select.Option>
                            <Select.Option value="poor">{t('material:form.conditionPoor')}</Select.Option>
                        </Select>}
                    />
                    <MappingField label={t('excel:fields.warrantyUntil')} headers={h} selected={matWarranty} setSelected={setMatWarranty} example={ex(matWarranty)} />
                    <MappingField label={t('excel:fields.nextMaintenanceDue')} headers={h} selected={matNextMaintenance} setSelected={setMatNextMaintenance} example={ex(matNextMaintenance)} />
                    <MappingField label={t('excel:fields.storageInstructions')} headers={h} selected={matStorageInstructions} setSelected={setMatStorageInstructions} example={ex(matStorageInstructions)} />
                    <MappingField label={t('excel:fields.maintenanceHistory')} headers={h} selected={matMaintenanceHistory} setSelected={setMatMaintenanceHistory} example={ex(matMaintenanceHistory)} />
                </Row>
            ),
        });
    }

    // Sammlungen tab
    if (sammlungData) {
        const h = sammlungData.headers;
        const ex = (key: string | undefined) => findExampleData(sammlungData, key);
        tabItems.push({
            key: 'sammlungen',
            label: `${t('excel:combined.tabSammlungen')} ${t('excel:combined.rowCount', { count: sammlungData.data.length })}`,
            children: (
                <Row gutter={[16, 16]}>
                    <MappingField label={t('excel:sammlungFields.name')} headers={h} selected={samName} setSelected={setSamName} example={ex(samName)} />
                    <MappingField label={t('excel:sammlungFields.description')} headers={h} selected={samDescription} setSelected={setSamDescription} example={ex(samDescription)}
                        defaultInput={<Input placeholder={t('excel:combined.defaultValue')} value={defaultSamDescription ?? undefined} onChange={e => setDefaultSamDescription(e.target.value || null)} style={{ width: '100%', marginTop: 4 }} />}
                    />
                    <MappingField label={t('excel:sammlungFields.imageUrls')} headers={h} selected={samImages} setSelected={setSamImages} example={ex(samImages)} />
                    <Col span={12}>
                        <p>{t('excel:sammlungFields.materialien')}</p>
                        {samMaterialien && <p>{t('excel:combined.example', { value: ex(samMaterialien) })}</p>}
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            {t('excel:sammlungFields.materialienHelp')}
                        </Typography.Text>
                    </Col>
                    <Col span={12}>
                        <Select
                            showSearch
                            value={samMaterialien}
                            placeholder={t('excel:combined.selectPlaceholder')}
                            optionFilterProp="children"
                            onChange={setSamMaterialien}
                            filterOption={(input, option) => option ? (option.children as any).toLowerCase().indexOf(input.toLowerCase()) >= 0 : false}
                            style={{ width: '100%' }}
                        >
                            <Select.Option key="none" value={undefined}>{t('excel:combined.noneOption')}</Select.Option>
                            {h.map(o => <Select.Option key={o} value={o}>{o}</Select.Option>)}
                        </Select>
                    </Col>
                </Row>
            ),
        });
    }

    // Kategorien tab
    if (kategorienData) {
        const h = kategorienData.headers;
        const ex = (key: string | undefined) => findExampleData(kategorienData, key);
        tabItems.push({
            key: 'kategorien',
            label: `${t('excel:combined.tabKategorien')} ${t('excel:combined.rowCount', { count: kategorienData.data.length })}`,
            children: (
                <Row gutter={[16, 16]}>
                    <MappingField label={t('excel:kategorieFields.name')} headers={h} selected={katName} setSelected={setKatName} example={ex(katName)} />
                </Row>
            ),
        });
    }

    // Standorte tab
    if (standorteData) {
        const h = standorteData.headers;
        const ex = (key: string | undefined) => findExampleData(standorteData, key);
        tabItems.push({
            key: 'standorte',
            label: `${t('excel:combined.tabStandorte')} ${t('excel:combined.rowCount', { count: standorteData.data.length })}`,
            children: (
                <Row gutter={[16, 16]}>
                    <MappingField label={t('excel:standortFields.name')} headers={h} selected={ortName} setSelected={setOrtName} example={ex(ortName)} />
                    <MappingField label={t('excel:standortFields.street')} headers={h} selected={ortStreet} setSelected={setOrtStreet} example={ex(ortStreet)} />
                    <MappingField label={t('excel:standortFields.city')} headers={h} selected={ortCity} setSelected={setOrtCity} example={ex(ortCity)} />
                    <MappingField label={t('excel:standortFields.coordinates')} headers={h} selected={ortCoordinates} setSelected={setOrtCoordinates} example={ex(ortCoordinates)} />
                </Row>
            ),
        });
    }

    // Determine if import is valid (at least one sheet has required fields mapped)
    const isValid = (materialData ? !!matName : true) &&
        (sammlungData ? !!(samName && samMaterialien) : true) &&
        (kategorienData ? !!katName : true) &&
        (standorteData ? !!ortName : true);

    return (
        <Modal
            title={t('excel:combined.title')}
            open={showModal}
            onCancel={() => setShow(false)}
            width={700}
            footer={[
                <Button key="back" onClick={() => setShow(false)}>
                    {t('common:buttons.cancel')}
                </Button>,
                <Tooltip key="importAdd" title={t('excel:combined.importAddTooltip')}>
                    <Button type="primary" disabled={!isValid} onClick={() => importAll('add')}>
                        {t('excel:combined.importAdd')}
                    </Button>
                </Tooltip>,
                <Popconfirm
                    key="importReplace"
                    title={t('excel:combined.importReplaceConfirm')}
                    onConfirm={() => importAll('replace')}
                    okText={t('common:confirm.yes')}
                    cancelText={t('common:confirm.no')}
                >
                    <Tooltip title={t('excel:combined.importReplaceTooltip')}>
                        <Button type="primary" disabled={!isValid}>
                            {t('excel:combined.importReplace')}
                        </Button>
                    </Tooltip>
                </Popconfirm>,
            ]}
        >
            <Tabs items={tabItems} />
        </Modal>
    );
};
