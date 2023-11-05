import { Button, Col, message, Modal, Row, Select, Spin, Popconfirm } from "antd";
import { abteilungenCategoryCollection, abteilungenMaterialsCollection, abteilungenCollection } from "config/firebase/collections";
import { firestore } from "config/firebase/firebase";
import { useContext, useState } from "react";
import { Abteilung } from "types/abteilung.type";
import { Categorie } from "types/categorie.types";
import { ExcelJson } from "types/excel.type";
import { Material } from "types/material.types";
import { massImportMaterial } from "util/MaterialUtil";
import {CategorysContext, StandorteContext} from "components/abteilung/AbteilungDetails";

export interface ExcelImportProps {
    abteilung: Abteilung
    excelData: ExcelJson | undefined
    showModal: boolean
    setShow: (show: boolean) => void
}

export const ExcelImport = (props: ExcelImportProps) => {
    const { abteilung, excelData, showModal, setShow } = props;

    //fetch categories
    const categoriesContext = useContext(CategorysContext);
    const standorteContext = useContext(StandorteContext);

    const categories = categoriesContext.categories;
    const standorte = standorteContext.standorte;
    const catLoading = categoriesContext.loading;

    const [name, setName] = useState<string | undefined>();
    const [comment, setComment] = useState<string | undefined>();
    const [count, setCount] = useState<string | undefined>();
    const [lost, setLost] = useState<string | undefined>();
    const [damaged, setDamaged] = useState<string | undefined>();
    const [location, setLocation] = useState<string | undefined>();
    const [weightInKg, setWeightInKg] = useState<string | undefined>();
    const [consumables, setConsumables] = useState<string | undefined>();
    const [categorieIds, setCategorieIds] = useState<string | undefined>();
    const [standort, setStandort] = useState<string | undefined>();
    const [imageUrls, setImageUrls] = useState<string | undefined>();
    const [onlyLendInternal, setOnlyLendInternal] = useState<string | undefined>();


    const findExampleData = (key: string | undefined): string => {
        if (!excelData || !key) return '';

        const index = excelData.headers.findIndex(h => h === key);

        const res = excelData.data.find(data => data[index] !== null);
        if (res) {
            return res[index] as string;
        }

        return '';
    }

    const replaceMaterial = async () => {
        await firestore().collection(abteilungenCollection).doc(abteilung.id).collection(abteilungenMaterialsCollection).get().then((snapshot) => {
            snapshot.docs.forEach((doc) => {
                doc.ref.delete();
            });
            prepareMaterial()
        }).catch((ex) => {
            message.error(`Es ist ein Fehler aufgetreten: ${ex}`);
        });
    }

    const prepareMaterial = async (): Promise<Material[]> => {
        const material: Material[] = [];

        if (!excelData) return [];

        if (!name) {
            message.error('Du musst den Namen des Materials zuordnen.')
            console.error('Du musst den Namen des Materials zuordnen.')
            return [];
        }

        const indexes: { [key: string]: number } = {};
        excelData.headers.forEach(key => {
            indexes[key] = excelData.headers.findIndex(h => h === key)
        })

        const newCategories: string[] = [];
        const newStandorte: string[] = [];

        for( const dataArray of excelData.data) {
            const matName: string = dataArray[indexes[name]] as string;
            //skip if name is still not found
            if (!matName) continue;
            const matComment: string | null = comment ? dataArray[indexes[comment]] as string : null;
            const matCount: number = count ? dataArray[indexes[count]] as number : 1;
            const matLost: number = lost ? dataArray[indexes[lost]] as number : 0;
            const matDamaged: number = damaged ? dataArray[indexes[damaged]] as number : 0;
            const matWeightInKg: number | null = weightInKg ? dataArray[indexes[weightInKg]] as number : null;
            const matConsumablest: boolean = consumables ? dataArray[indexes[consumables]] as boolean : false;
            const matCategorienRaw: string | null = categorieIds ? dataArray[indexes[categorieIds]] as string : null;
            const matStandorteRaw: string | null = standort ? dataArray[indexes[standort]] as string : null;
            const matImageUrlsRaw: string | null = imageUrls ? dataArray[indexes[imageUrls]] as string : null;
            const matonlyLendInternal: boolean = onlyLendInternal ? dataArray[indexes[onlyLendInternal]] as boolean : false;

            let matCategorieNames: string[] = [];
            let matImageUrls: string[] = [];
            const materialCategorieIds: string[] = [];
            let matStandortNames: string[] = [];
            const matStandortIds: string[] = [];

            //string to array of image urls
            if (matImageUrlsRaw !== null) {
                matImageUrls = matImageUrlsRaw.replaceAll(' ', '').split(',');
            }

            if (matCategorienRaw) {
                matCategorieNames = matCategorienRaw.replaceAll(' ', '').split(',');
            }

            if (matStandorteRaw) {
                matStandortNames = matStandorteRaw.replaceAll(' ', '').split(',');
            }


            //if cat is set loop through and assign category id
            for(const catName of matCategorieNames) {
                const placeholderName = '' + catName;
                //check if cat already exists
                const existingCat = categories.find(cat => cat.name.toLowerCase() === catName.toLowerCase());
                if (existingCat) {
                    materialCategorieIds.push(existingCat.id)
                    continue;
                }
                //check if cat is getting generated
                const newCat = newCategories.find(cat => cat.toLowerCase() === catName.toLowerCase());
                if (newCat) {
                    materialCategorieIds.push(placeholderName);
                    continue;
                }

                //generate new cat
                newCategories.push(catName)

                materialCategorieIds.push(placeholderName);
            }

            //if ort is set loop through and assign ort id
            for(const ortName of matStandortNames) {
                const placeholderName = '' + ortName;
                //check if ort already exists
                const existingOrt = standorte.find(ort => ort.name.toLowerCase() === ortName.toLowerCase());
                if (existingOrt) {
                    matStandortIds.push(existingOrt.id)
                    continue;
                }
                //check if ort is getting generated
                const newOrt = newStandorte.find(ort => ort.toLowerCase() === ortName.toLowerCase());
                if (newOrt) {
                    matStandortIds.push(placeholderName);
                    continue;
                }

                //generate new cat
                newStandorte.push(ortName)

                matStandortIds.push(placeholderName);
            }


            const matToAdd = {
                name: matName,
                comment: matComment,
                count: matCount,
                lost: matLost,
                damaged: matDamaged,
                weightInKg: matWeightInKg,
                consumables: matConsumablest,
                categorieIds: materialCategorieIds,
                imageUrls: matImageUrls,
                standort: matStandortIds,
                onlyLendInternal: matonlyLendInternal
            } as Material

            material.push(matToAdd)

        }

        //create categories
        const promieses = newCategories.map(catName => {
            return firestore().collection(abteilungenCollection).doc(abteilung.id).collection(abteilungenCategoryCollection).add({ name: catName } as Categorie).then(doc => {
                return {
                    id: doc.id,
                    name: catName
                } as Categorie
            })
        })

        const allCategories = await Promise.all(promieses);

        //assign new catId to matCategorieIds
        const materials = material.map(mat => {
            const catIdsToSet: string[] = [];
            if (mat.categorieIds && mat.categorieIds.length > 0) {
                    mat.categorieIds.forEach(catPlaceholder => {
                        const foundCat = allCategories.find(cat => cat.name === catPlaceholder)
                        if (foundCat) {
                            catIdsToSet.push(foundCat.id)
                        } else {
                            catIdsToSet.push(catPlaceholder)
                        }
                    })
                mat.categorieIds = catIdsToSet;
                return mat;
            } else {
                return mat;
            }
        })

        try {
            await massImportMaterial(abteilung.id, materials)
            message.success(`Es wurden erfolgreich ${material.length}/${excelData.data.length} Materialien importiert.`)
            setShow(false)
        } catch(err) {
            message.error(`Es ist ein Fehler aufgetreten ${err}`)
            console.error('Es ist ein Fehler aufgetreten', err)
        }
        

        return materials;
    }

    if (!excelData) {
        return <></>
    }

    return <Modal
        title='Material importieren'
        visible={showModal}
        onCancel={()=>  setShow(false)}
        footer={[
            <Button key='back' onClick={() => { setShow(false) }}>
                Abbrechen
            </Button>,
            <Button key='importAdd' type='primary' disabled={!name || catLoading} onClick={() => { prepareMaterial() }}>
                Importieren hinzufügen
            </Button>,
            <Popconfirm
            title='Möchtest du wirklich alles bestehendes Material dieser Abteilung löschen?'
            onConfirm={() => replaceMaterial()}
            onCancel={() => { }}
            okText='Ja'
            cancelText='Nein'
            >
                <Button key='importReplace' type='primary' disabled={!name || catLoading}>
                    Importieren ersetzen
                </Button>   
            </Popconfirm>  
        ]}
    >
        <Row gutter={[16, 16]}>
            <Col span={12}>
                <p>Name*:</p>
                {
                    name && <p>{`Beispiel: ${findExampleData(name)}`}</p>
                }
            </Col>
            <Col span={12}>
                <ExcelImportSelect options={excelData.headers} selected={name} setSelected={setName} />
            </Col>
            <Col span={12}>
                <p>Bemerkung:</p>
                {
                    comment && <p>{`Beispiel: ${findExampleData(comment)}`}</p>
                }
            </Col>
            <Col span={12}>
                <ExcelImportSelect options={excelData.headers} selected={comment} setSelected={setComment} />
            </Col>
            <Col span={12}>
                <p>Standort:</p>
                {
                    standort && <p>{`Beispiel: ${findExampleData(standort)}`}</p>
                }
            </Col>
            <Col span={12}>
                <ExcelImportSelect options={excelData.headers} selected={standort} setSelected={setStandort} />
            </Col>
            <Col span={12}>
                <p>Anzahl:</p>
                {
                    count && <p>{`Beispiel: ${findExampleData(count)}`}</p>
                }
            </Col>
            <Col span={12}>
                <ExcelImportSelect options={excelData.headers} selected={count} setSelected={setCount} />
            </Col>
            <Col span={12}>
                <p>Verloren:</p>
                {
                    lost && <p>{`Beispiel: ${findExampleData(lost)}`}</p>
                }
            </Col>
            <Col span={12}>
                <ExcelImportSelect options={excelData.headers} selected={lost} setSelected={setLost} />
            </Col>
            <Col span={12}>
                <p>Beschädigt:</p>
                {
                    damaged && <p>{`Beispiel: ${findExampleData(damaged)}`}</p>
                }
            </Col>
            <Col span={12}>
                <ExcelImportSelect options={excelData.headers} selected={damaged} setSelected={setDamaged} />
            </Col>
            <Col span={12}>
                <p>Gewicht in Kg:</p>
                {
                    weightInKg && <p>{`Beispiel: ${findExampleData(weightInKg)}`}</p>
                }
            </Col>
            <Col span={12}>
                <ExcelImportSelect options={excelData.headers} selected={weightInKg} setSelected={setWeightInKg} />
            </Col>
            <Col span={12}>
                <p>Ist Verbrauchsmaterial:</p>
                {
                    consumables && <p>{`Beispiel: ${findExampleData(consumables)}`}</p>
                }
            </Col>
            <Col span={12}>
                <ExcelImportSelect options={excelData.headers} selected={consumables} setSelected={setConsumables} />
            </Col>
            <Col span={12}>
                <p>Katergorien:</p>
                {
                    categorieIds && <p>{`Beispiel: ${findExampleData(categorieIds)}`}</p>
                }
            </Col>
            <Col span={12}>
                <ExcelImportSelect options={excelData.headers} selected={categorieIds} setSelected={setCategorieIds} />
            </Col>
            <Col span={12}>
                <p>Bilder:</p>
                {
                    imageUrls && <p>{`Beispiel: ${findExampleData(imageUrls)}`}</p>
                }
            </Col>
            <Col span={12}>
                <ExcelImportSelect options={excelData.headers} selected={imageUrls} setSelected={setImageUrls} />
            </Col>
            <Col span={12}>
                <p>Nur Intern ausleihbar:</p>
                {
                    onlyLendInternal && <p>{`Beispiel: ${findExampleData(onlyLendInternal)}`}</p>
                }
            </Col>
            <Col span={12}>
                <ExcelImportSelect options={excelData.headers} selected={onlyLendInternal} setSelected={setOnlyLendInternal} />
            </Col>

            {
                catLoading && <Spin />
            }
        </Row>
    </Modal>
}

export interface ExcelImportSelectProps {
    options: string[]
    selected: string | undefined
    setSelected: (option: string) => void
}

const ExcelImportSelect = (props: ExcelImportSelectProps) => {

    const { options, selected, setSelected } = props;

    const { Option } = Select;

    return <Select
        showSearch
        value={selected}
        placeholder='Passendes Feld'
        optionFilterProp='children'
        onChange={setSelected}
        filterOption={(input, option) => {
            if (!option) return false;
            return (option.children as any).toLowerCase().indexOf(input.toLowerCase()) >= 0
        }}
        style={{ width: '100%' }}
    >
        <Option key='none' value={undefined}>Nicht vorhanden</Option>
        {
            options.map(o => <Option key={o} value={o}>{o}</Option>)
        }
    </Select>
}