import {
  Button,
  Col,
  Input,
  InputNumber,
  message,
  Modal,
  Row,
  Select,
  Spin,
  Switch,
  Popconfirm,
  Tooltip,
} from "antd";
import { useTranslation } from 'react-i18next';
import {
  abteilungenCategoryCollection,
  abteilungenMaterialsCollection,
  abteilungenCollection,
} from "config/firebase/collections";
import { db } from "config/firebase/firebase";
import { collection, getDocs, deleteDoc, addDoc } from "firebase/firestore";
import { useContext, useEffect, useState } from "react";
import { Abteilung } from "types/abteilung.type";
import { Categorie } from "types/categorie.types";
import { ExcelJson } from "types/excel.type";
import { Material } from "types/material.types";
import { massImportMaterial } from "util/MaterialUtil";
import {
  CategorysContext,
  StandorteContext,
} from "components/abteilung/AbteilungDetails";

export interface ExcelImportProps {
  abteilung: Abteilung;
  excelData: ExcelJson | undefined;
  showModal: boolean;
  setShow: (show: boolean) => void;
}

export const ExcelImport = (props: ExcelImportProps) => {
  const { abteilung, excelData, showModal, setShow } = props;
  const { t } = useTranslation();

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
  const [onlyLendInternal, setOnlyLendInternal] = useState<
    string | undefined
  >();

  // Default values used when no Excel column is matched
  const [defaultComment, setDefaultComment] = useState<string | null>(null);
  const [defaultCount, setDefaultCount] = useState<number>(1);
  const [defaultLost, setDefaultLost] = useState<number>(0);
  const [defaultDamaged, setDefaultDamaged] = useState<number>(0);
  const [defaultWeightInKg, setDefaultWeightInKg] = useState<number | null>(
    null
  );
  const [defaultConsumables, setDefaultConsumables] = useState<boolean>(false);
  const [defaultCategorieIds, setDefaultCategorieIds] = useState<string[]>([]);
  const [defaultStandort, setDefaultStandort] = useState<string[]>([]);
  const [defaultImageUrls, setDefaultImageUrls] = useState<string | null>(null);
  const [defaultOnlyLendInternal, setDefaultOnlyLendInternal] =
    useState<boolean>(false);

  // Auto-match Excel headers to Onlinemat fields when data is loaded
  useEffect(() => {
    if (!excelData) return;

    const headers = excelData.headers;
    const usedHeaders = new Set<string>();

    // Maps each field to known aliases (lowercase) and its setter
    const fieldMappings: {
      aliases: string[];
      setter: (val: string | undefined) => void;
    }[] = [
      { aliases: ["name"], setter: setName },
      { aliases: ["bemerkung", "comment", "kommentar"], setter: setComment },
      { aliases: ["standort", "location", "ort"], setter: setStandort },
      { aliases: ["anzahl", "count", "menge"], setter: setCount },
      { aliases: ["verloren", "lost"], setter: setLost },
      {
        aliases: ["beschädigt", "damaged", "beschaedigt"],
        setter: setDamaged,
      },
      {
        aliases: ["gewicht in kg", "gewicht", "weight", "weightinkg"],
        setter: setWeightInKg,
      },
      {
        aliases: [
          "verbrauchsmaterial",
          "ist verbrauchsmaterial",
          "consumables",
        ],
        setter: setConsumables,
      },
      {
        aliases: ["kategorien", "kategorie", "categories", "category"],
        setter: setCategorieIds,
      },
      { aliases: ["bilder", "images", "bild"], setter: setImageUrls },
      {
        aliases: [
          "nur intern ausleihbar",
          "nur intern",
          "only internal",
          "onlylendinternal",
        ],
        setter: setOnlyLendInternal,
      },
    ];

    for (const { aliases, setter } of fieldMappings) {
      const match = headers.find(
        (h) =>
          !usedHeaders.has(h) &&
          aliases.includes(h.toLowerCase().trim())
      );
      if (match) {
        setter(match);
        usedHeaders.add(match);
      }
    }
  }, [excelData]);

  const findExampleData = (key: string | undefined): string => {
    if (!excelData || !key) return "";

    const index = excelData.headers.findIndex((h) => h === key);

    const res = excelData.data.find((data) => data[index] !== null);
    if (res) {
      return res[index] as string;
    }

    return "";
  };

  const replaceMaterial = async () => {
    await getDocs(collection(db, abteilungenCollection, abteilung.id, abteilungenMaterialsCollection))
      .then((snapshot) => {
        snapshot.docs.forEach((d) => {
          deleteDoc(d.ref);
        });
        prepareMaterial();
      })
      .catch((ex) => {
        message.error(t('common:errors.generic', { error: String(ex) }));
      });
  };

  const prepareMaterial = async (): Promise<Material[]> => {
    const material: Material[] = [];

    if (!excelData) return [];

    if (!name) {
      message.error(t('excel:import.nameRequired'));
      console.error("Du musst den Namen des Materials zuordnen.");
      return [];
    }

    const indexes: { [key: string]: number } = {};
    excelData.headers.forEach((key) => {
      indexes[key] = excelData.headers.findIndex((h) => h === key);
    });

    const newCategories: string[] = [];
    const newStandorte: string[] = [];

    for (const dataArray of excelData.data) {
      const matName: string = dataArray[indexes[name]] as string;
      //skip if name is still not found
      if (!matName) continue;
      const matComment: string | null = comment
        ? (dataArray[indexes[comment]] as string)
        : defaultComment;
      const matCount: number = count
        ? (dataArray[indexes[count]] as number)
        : defaultCount;
      const matLost: number = lost
        ? (dataArray[indexes[lost]] as number)
        : defaultLost;
      const matDamaged: number = damaged
        ? (dataArray[indexes[damaged]] as number)
        : defaultDamaged;
      const matWeightInKg: number | null = weightInKg
        ? (dataArray[indexes[weightInKg]] as number)
        : defaultWeightInKg;
      const matConsumablest: boolean = consumables
        ? (dataArray[indexes[consumables]] as boolean)
        : defaultConsumables;
      const matCategorienRaw: string | null = categorieIds
        ? (dataArray[indexes[categorieIds]] as string)
        : null;
      const matStandorteRaw: string | null = standort
        ? (dataArray[indexes[standort]] as string)
        : null;
      const matImageUrlsRaw: string | null = imageUrls
        ? (dataArray[indexes[imageUrls]] as string)
        : defaultImageUrls;
      const matonlyLendInternal: boolean = onlyLendInternal
        ? (dataArray[indexes[onlyLendInternal]] as boolean)
        : defaultOnlyLendInternal;

      let matCategorieNames: string[] = [];
      let matImageUrls: string[] = [];
      const materialCategorieIds: string[] = [];
      let matStandortNames: string[] = [];
      const matStandortIds: string[] = [];

      //string to array of image urls
      if (matImageUrlsRaw !== null) {
        matImageUrls = matImageUrlsRaw.replaceAll(" ", "").split(",");
      }

      if (matCategorienRaw) {
        matCategorieNames = matCategorienRaw.replaceAll(" ", "").split(",");
      } else if (!categorieIds && defaultCategorieIds.length > 0) {
        materialCategorieIds.push(...defaultCategorieIds);
      }

      if (matStandorteRaw) {
        matStandortNames = matStandorteRaw.replaceAll(" ", "").split(",");
      } else if (!standort && defaultStandort.length > 0) {
        matStandortIds.push(...defaultStandort);
      }

      //if cat is set loop through and assign category id
      for (const catName of matCategorieNames) {
        const placeholderName = "" + catName;
        //check if cat already exists
        const existingCat = categories.find(
          (cat) => cat.name.toLowerCase() === catName.toLowerCase()
        );
        if (existingCat) {
          materialCategorieIds.push(existingCat.id);
          continue;
        }
        //check if cat is getting generated
        const newCat = newCategories.find(
          (cat) => cat.toLowerCase() === catName.toLowerCase()
        );
        if (newCat) {
          materialCategorieIds.push(placeholderName);
          continue;
        }

        //generate new cat
        newCategories.push(catName);

        materialCategorieIds.push(placeholderName);
      }

      //if ort is set loop through and assign ort id
      for (const ortName of matStandortNames) {
        const placeholderName = "" + ortName;
        //check if ort already exists
        const existingOrt = standorte.find(
          (ort) => ort.name.toLowerCase() === ortName.toLowerCase()
        );
        if (existingOrt) {
          matStandortIds.push(existingOrt.id);
          continue;
        }
        //check if ort is getting generated
        const newOrt = newStandorte.find(
          (ort) => ort.toLowerCase() === ortName.toLowerCase()
        );
        if (newOrt) {
          matStandortIds.push(placeholderName);
          continue;
        }

        //generate new cat
        newStandorte.push(ortName);

        matStandortIds.push(placeholderName);
      }

      // Validate and sanitize material data
      const sanitizedName = matName.trim().slice(0, 200);
      if (!sanitizedName) continue;

      const matToAdd = {
        name: sanitizedName,
        comment: matComment ? matComment.trim().slice(0, 1000) : null,
        count: Number.isFinite(matCount) && matCount >= 0 ? Math.floor(matCount) : 1,
        lost: Number.isFinite(matLost) && matLost >= 0 ? Math.floor(matLost) : 0,
        damaged: Number.isFinite(matDamaged) && matDamaged >= 0 ? Math.floor(matDamaged) : 0,
        weightInKg: matWeightInKg !== null && Number.isFinite(matWeightInKg) ? matWeightInKg : null,
        consumables: Boolean(matConsumablest),
        categorieIds: materialCategorieIds,
        imageUrls: matImageUrls.filter(url => url.startsWith('https://') || url.startsWith('http://')),
        standort: matStandortIds,
        onlyLendInternal: Boolean(matonlyLendInternal),
      } as Material;

      material.push(matToAdd);
    }

    //create categories
    const promieses = newCategories.map((catName) => {
      return addDoc(collection(db, abteilungenCollection, abteilung.id, abteilungenCategoryCollection), { name: catName } as Categorie)
        .then((docRef) => {
          return {
            id: docRef.id,
            name: catName,
          } as Categorie;
        });
    });

    const allCategories = await Promise.all(promieses);

    //assign new catId to matCategorieIds
    const materials = material.map((mat) => {
      const catIdsToSet: string[] = [];
      if (mat.categorieIds && mat.categorieIds.length > 0) {
        mat.categorieIds.forEach((catPlaceholder) => {
          const foundCat = allCategories.find(
            (cat) => cat.name === catPlaceholder
          );
          if (foundCat) {
            catIdsToSet.push(foundCat.id);
          } else {
            catIdsToSet.push(catPlaceholder);
          }
        });
        mat.categorieIds = catIdsToSet;
        return mat;
      } else {
        return mat;
      }
    });

    try {
      await massImportMaterial(abteilung.id, materials);
      message.success(
        t('excel:import.success', { imported: material.length, total: excelData.data.length })
      );
      setShow(false);
    } catch (err) {
      message.error(t('common:errors.generic', { error: String(err) }));
      console.error("Es ist ein Fehler aufgetreten", err);
    }

    return materials;
  };

  if (!excelData) {
    return <></>;
  }

  return (
    <Modal
      title={t('excel:import.title')}
      open={showModal}
      onCancel={() => setShow(false)}
      footer={[
        <Button
          key="back"
          onClick={() => {
            setShow(false);
          }}
        >
          {t('common:buttons.cancel')}
        </Button>,
        <Tooltip key="importAdd" title={t('excel:import.importAddTooltip')}>
          <Button
            type="primary"
            disabled={!name || catLoading}
            onClick={() => {
              prepareMaterial();
            }}
          >
            {t('excel:import.importAdd')}
          </Button>
        </Tooltip>,
        <Popconfirm
          key="importReplace"
          title={t('excel:import.importReplaceConfirm')}
          onConfirm={() => replaceMaterial()}
          onCancel={() => {}}
          okText={t('common:confirm.yes')}
          cancelText={t('common:confirm.no')}
        >
          <Tooltip title={t('excel:import.importReplaceTooltip')}>
            <Button
              type="primary"
              disabled={!name || catLoading}
            >
              {t('excel:import.importReplace')}
            </Button>
          </Tooltip>
        </Popconfirm>,
      ]}
    >
      <Row gutter={[16, 16]}>
        {/* Name (required, no default) */}
        <Col span={12}>
          <p>{t('excel:fields.name')}</p>
          {name && <p>{t('excel:import.example', { value: findExampleData(name) })}</p>}
        </Col>
        <Col span={12}>
          <ExcelImportSelect
            options={excelData.headers}
            selected={name}
            setSelected={setName}
          />
        </Col>

        {/* Bemerkung */}
        <Col span={12}>
          <p>{t('excel:fields.comment')}</p>
          {comment && <p>{t('excel:import.example', { value: findExampleData(comment) })}</p>}
        </Col>
        <Col span={12}>
          <ExcelImportSelect
            options={excelData.headers}
            selected={comment}
            setSelected={setComment}
          />
          {!comment && (
            <Input
              placeholder={t('excel:import.defaultValue')}
              value={defaultComment ?? undefined}
              onChange={(e) => setDefaultComment(e.target.value || null)}
              style={{ width: "100%", marginTop: 4 }}
            />
          )}
        </Col>

        {/* Standort */}
        <Col span={12}>
          <p>{t('excel:fields.standort')}</p>
          {standort && <p>{t('excel:import.example', { value: findExampleData(standort) })}</p>}
        </Col>
        <Col span={12}>
          <ExcelImportSelect
            options={excelData.headers}
            selected={standort}
            setSelected={setStandort}
          />
          {!standort && (
            <Select
              mode="multiple"
              placeholder={t('excel:fields.defaultStandort')}
              value={defaultStandort}
              onChange={setDefaultStandort}
              style={{ width: "100%", marginTop: 4 }}
            >
              {standorte.map((s) => (
                <Select.Option key={s.id} value={s.id}>
                  {s.name}
                </Select.Option>
              ))}
            </Select>
          )}
        </Col>

        {/* Anzahl */}
        <Col span={12}>
          <p>{t('excel:fields.count')}</p>
          {count && <p>{t('excel:import.example', { value: findExampleData(count) })}</p>}
        </Col>
        <Col span={12}>
          <ExcelImportSelect
            options={excelData.headers}
            selected={count}
            setSelected={setCount}
          />
          {!count && (
            <InputNumber
              placeholder={t('excel:import.defaultValue')}
              value={defaultCount}
              min={0}
              onChange={(val) => setDefaultCount(val ?? 1)}
              style={{ width: "100%", marginTop: 4 }}
            />
          )}
        </Col>

        {/* Verloren */}
        <Col span={12}>
          <p>{t('excel:fields.lost')}</p>
          {lost && <p>{t('excel:import.example', { value: findExampleData(lost) })}</p>}
        </Col>
        <Col span={12}>
          <ExcelImportSelect
            options={excelData.headers}
            selected={lost}
            setSelected={setLost}
          />
          {!lost && (
            <InputNumber
              placeholder={t('excel:import.defaultValue')}
              value={defaultLost}
              min={0}
              onChange={(val) => setDefaultLost(val ?? 0)}
              style={{ width: "100%", marginTop: 4 }}
            />
          )}
        </Col>

        {/* Beschädigt */}
        <Col span={12}>
          <p>{t('excel:fields.damaged')}</p>
          {damaged && <p>{t('excel:import.example', { value: findExampleData(damaged) })}</p>}
        </Col>
        <Col span={12}>
          <ExcelImportSelect
            options={excelData.headers}
            selected={damaged}
            setSelected={setDamaged}
          />
          {!damaged && (
            <InputNumber
              placeholder={t('excel:import.defaultValue')}
              value={defaultDamaged}
              min={0}
              onChange={(val) => setDefaultDamaged(val ?? 0)}
              style={{ width: "100%", marginTop: 4 }}
            />
          )}
        </Col>

        {/* Gewicht in Kg */}
        <Col span={12}>
          <p>{t('excel:fields.weight')}</p>
          {weightInKg && <p>{t('excel:import.example', { value: findExampleData(weightInKg) })}</p>}
        </Col>
        <Col span={12}>
          <ExcelImportSelect
            options={excelData.headers}
            selected={weightInKg}
            setSelected={setWeightInKg}
          />
          {!weightInKg && (
            <InputNumber
              placeholder={t('excel:import.defaultValue')}
              value={defaultWeightInKg ?? undefined}
              min={0}
              onChange={(val) => setDefaultWeightInKg(val ?? null)}
              style={{ width: "100%", marginTop: 4 }}
            />
          )}
        </Col>

        {/* Ist Verbrauchsmaterial */}
        <Col span={12}>
          <p>{t('excel:fields.consumables')}</p>
          {consumables && <p>{t('excel:import.example', { value: findExampleData(consumables) })}</p>}
        </Col>
        <Col span={12}>
          <ExcelImportSelect
            options={excelData.headers}
            selected={consumables}
            setSelected={setConsumables}
          />
          {!consumables && (
            <div style={{ marginTop: 4 }}>
              <Switch
                checked={defaultConsumables}
                onChange={setDefaultConsumables}
              />{" "}
              <span>{defaultConsumables ? t('common:confirm.yes') : t('common:confirm.no')}</span>
            </div>
          )}
        </Col>

        {/* Kategorien */}
        <Col span={12}>
          <p>{t('excel:fields.categories')}</p>
          {categorieIds && (
            <p>{t('excel:import.example', { value: findExampleData(categorieIds) })}</p>
          )}
        </Col>
        <Col span={12}>
          <ExcelImportSelect
            options={excelData.headers}
            selected={categorieIds}
            setSelected={setCategorieIds}
          />
          {!categorieIds && (
            <Select
              mode="multiple"
              placeholder={t('excel:fields.defaultCategories')}
              value={defaultCategorieIds}
              onChange={setDefaultCategorieIds}
              style={{ width: "100%", marginTop: 4 }}
            >
              {categories.map((c) => (
                <Select.Option key={c.id} value={c.id}>
                  {c.name}
                </Select.Option>
              ))}
            </Select>
          )}
        </Col>

        {/* Bilder */}
        <Col span={12}>
          <p>{t('excel:fields.images')}</p>
          {imageUrls && <p>{t('excel:import.example', { value: findExampleData(imageUrls) })}</p>}
        </Col>
        <Col span={12}>
          <ExcelImportSelect
            options={excelData.headers}
            selected={imageUrls}
            setSelected={setImageUrls}
          />
          {!imageUrls && (
            <Input
              placeholder={t('excel:fields.defaultImageUrls')}
              value={defaultImageUrls ?? undefined}
              onChange={(e) => setDefaultImageUrls(e.target.value || null)}
              style={{ width: "100%", marginTop: 4 }}
            />
          )}
        </Col>

        {/* Nur Intern ausleihbar */}
        <Col span={12}>
          <p>{t('excel:fields.onlyLendInternal')}</p>
          {onlyLendInternal && (
            <p>{t('excel:import.example', { value: findExampleData(onlyLendInternal) })}</p>
          )}
        </Col>
        <Col span={12}>
          <ExcelImportSelect
            options={excelData.headers}
            selected={onlyLendInternal}
            setSelected={setOnlyLendInternal}
          />
          {!onlyLendInternal && (
            <div style={{ marginTop: 4 }}>
              <Switch
                checked={defaultOnlyLendInternal}
                onChange={setDefaultOnlyLendInternal}
              />{" "}
              <span>{defaultOnlyLendInternal ? t('common:confirm.yes') : t('common:confirm.no')}</span>
            </div>
          )}
        </Col>

        {catLoading && <Spin />}
      </Row>
    </Modal>
  );
};

export interface ExcelImportSelectProps {
  options: string[];
  selected: string | undefined;
  setSelected: (option: string) => void;
}

const ExcelImportSelect = (props: ExcelImportSelectProps) => {
  const { options, selected, setSelected } = props;
  const { t } = useTranslation();

  const { Option } = Select;

  return (
    <Select
      showSearch
      value={selected}
      placeholder={t('excel:import.selectPlaceholder')}
      optionFilterProp="children"
      onChange={setSelected}
      filterOption={(input, option) => {
        if (!option) return false;
        return (
          (option.children as any).toLowerCase().indexOf(input.toLowerCase()) >=
          0
        );
      }}
      style={{ width: "100%" }}
    >
      <Option key="none" value={undefined}>
        {t('excel:import.noneOption')}
      </Option>
      {options.map((o) => (
        <Option key={o} value={o}>
          {o}
        </Option>
      ))}
    </Select>
  );
};
