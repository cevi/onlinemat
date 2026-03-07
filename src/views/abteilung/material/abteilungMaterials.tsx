import { useContext, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Button,
  Col,
  Input,
  List,
  message,
  Modal,
  Radio,
  Row,
  Spin,
} from "antd";
import { AddMaterialButton } from "components/material/AddMaterial";
import {
  AppstoreOutlined,
  MenuOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { AddCategorieButton } from "components/categorie/AddCategorie";
import { Abteilung } from "types/abteilung.type";
import { MaterialTable } from "components/material/MaterialTable";
import { MaterialGrid } from "components/material/MaterialGrid";
import { MaterialListView } from "components/material/MaterialListView";
import { Can } from "config/casl/casl";
import { AbteilungEntityCasl } from "config/casl/ability";
import {
  CategorysContext,
  MaterialsContext,
  SammlungenContext,
  StandorteContext,
} from "components/abteilung/AbteilungDetails";
import { useCookies } from "react-cookie";
import { CartItem } from "types/cart.types";
import {
  getCartName,
  prepareSammlungForCart,
  UnavailableItem,
} from "util/CartUtil";
import dayjs from "dayjs";
import { Material } from "types/material.types";
import { Sammlung } from "types/sammlung.types";
import { getAvailableMatCount } from "util/MaterialUtil";
import { AddStandortButton } from "components/standort/AddStandort";
import { useIsMobile } from "hooks/useIsMobile";
import { useTranslation } from "react-i18next";

export type AbteilungMaterialViewProps = {
  abteilung: Abteilung;
  cartItems: CartItem[];
  changeCart: (cart: CartItem[]) => void;
};

export const AbteilungMaterialView = (props: AbteilungMaterialViewProps) => {
  const { abteilung, cartItems, changeCart } = props;

  const { Search } = Input;
  const [searchParams] = useSearchParams();

  const cookieName = getCartName(abteilung.id);

  const [cookies, setCookie] = useCookies([cookieName]);

  const isMobile = useIsMobile();
  const { t } = useTranslation();

  function getInitialMode(): "table" | "grid" | "list" {
    return isMobile ? "list" : "table";
  }
  const initQuery = searchParams.get("q") || undefined;
  const [query, setQuery] = useState<string | undefined>(initQuery);
  const [displayMode, setDisplayMode] = useState<"table" | "grid" | "list">(
    () => getInitialMode(),
  );

  //fetch categories
  const categoriesContext = useContext(CategorysContext);
  const categories = categoriesContext.categories;
  const catLoading = categoriesContext.loading;

  //fetch standort
  const standorteContext = useContext(StandorteContext);
  const standorte = standorteContext.standorte;
  const standortLoading = standorteContext.loading;

  //fetch materials
  const materialsContext = useContext(MaterialsContext);
  const materials = materialsContext.materials;
  const matLoading = materialsContext.loading;

  //fetch sammlungen
  const sammlungenContext = useContext(SammlungenContext);
  const sammlungen = sammlungenContext.sammlungen;

  const [warningVisible, setWarningVisible] = useState(false);
  const [unavailableItems, setUnavailableItems] = useState<UnavailableItem[]>(
    [],
  );
  const [pendingCartItems, setPendingCartItems] = useState<CartItem[]>([]);
  const [pendingSammlungName, setPendingSammlungName] = useState("");
  const [pendingSammlungId, setPendingSammlungId] = useState("");

  const addItemToCart = (material: Material) => {
    let localCart = cartItems;

    //check if already added
    const itemAdded = localCart.find((item) => item.matId === material.id);
    const maxCount = getAvailableMatCount(material);

    if (itemAdded) {
      //check if max count is already exeeded

      const amount =
        itemAdded.count >= maxCount ? maxCount : itemAdded.count + 1;
      if (amount >= maxCount) {
        message.info(
          `Die maximale Stückzahl von ${material.name} befindet sich bereits in deinem Warenkorb.`,
        );
      }
      localCart = [
        ...localCart.filter((item) => item.matId !== material.id),
        {
          __caslSubjectType__: "CartItem",
          count: amount,
          matId: material.id,
        },
      ];
    } else if (maxCount > 0) {
      localCart = [
        ...localCart,
        {
          __caslSubjectType__: "CartItem",
          count: 1,
          matId: material.id,
        },
      ];
    } else {
      message.warning(`${material.name} ist zur Zeit leider nicht verfügbar.`);
    }

    const expires = dayjs().add(24, "hours");

    setCookie(cookieName, localCart, {
      path: "/",
      expires: expires.toDate(),
      secure: true,
      sameSite: "strict",
    });

    changeCart(localCart);
  };

  const addSammlungToCart = (sammlung: Sammlung) => {
    // Check if Sammlung already in cart
    if (cartItems.some((c) => c.sammlungId === sammlung.id)) {
      message.info(t("sammlung:cart.alreadyInCart"));
      return;
    }

    const { availableItems, unavailableItems: unavailable } =
      prepareSammlungForCart(sammlung.items, materials, cartItems);

    if (unavailable.length === 0) {
      applySammlungToCart(availableItems, sammlung.name, sammlung.id);
    } else {
      setUnavailableItems(unavailable);
      setPendingCartItems(availableItems);
      setPendingSammlungName(sammlung.name);
      setPendingSammlungId(sammlung.id);
      setWarningVisible(true);
    }
  };

  const applySammlungToCart = (
    itemsToAdd: CartItem[],
    sammlungName: string,
    sammlungId: string,
  ) => {
    const taggedItems = itemsToAdd.map((item) => ({
      ...item,
      sammlungId,
    }));
    const localCart = [...cartItems, ...taggedItems];

    const expires = dayjs().add(24, "hours");
    setCookie(cookieName, localCart, {
      path: "/",
      expires: expires.toDate(),
      secure: true,
      sameSite: "strict",
    });
    changeCart(localCart);
    message.success(t("sammlung:cart.added", { name: sammlungName }));
  };

  const confirmAddAvailable = () => {
    applySammlungToCart(
      pendingCartItems,
      pendingSammlungName,
      pendingSammlungId,
    );
    setWarningVisible(false);
  };

  if (!abteilung) {
    return <Spin />;
  }

  const filteredMaterials = query
    ? materials.filter((mat) =>
        mat.name.toLowerCase().includes(query.toLowerCase()),
      )
    : materials;
  const filteredSammlungen = query
    ? sammlungen.filter((s) =>
        s.name.toLowerCase().includes(query.toLowerCase()),
      )
    : sammlungen;

  return (
    <Row gutter={[16, 16]}>
      {matLoading || catLoading ? (
        <Spin />
      ) : (
        <>
          <Col xl={16} md={16} xs={24}>
            <Search
              placeholder="nach Material suchen"
              allowClear
              size="large"
              defaultValue={initQuery}
              onSearch={(query) => setQuery(query)}
            />
          </Col>
          <Col xl={4} md={4} xs={0}>
            <Radio.Group
              value={displayMode}
              onChange={(e) =>
                setDisplayMode(e.target.value as "table" | "grid" | "list")
              }
            >
              {isMobile ? (
                <>
                  <Radio.Button value="list">
                    <UnorderedListOutlined />
                  </Radio.Button>
                  <Radio.Button value="grid">
                    <AppstoreOutlined />
                  </Radio.Button>
                </>
              ) : (
                <>
                  <Radio.Button value="grid">
                    <AppstoreOutlined />
                  </Radio.Button>
                  <Radio.Button value="table">
                    <MenuOutlined />
                  </Radio.Button>
                </>
              )}
            </Radio.Group>
          </Col>
          <Can
            I={"create"}
            this={
              {
                __caslSubjectType__: "Material",
                abteilungId: abteilung.id,
              } as AbteilungEntityCasl
            }
          >
            <Col xl={4}>
              <AddMaterialButton abteilungId={abteilung.id} defaultStandortId={abteilung.defaultStandortId} />
            </Col>
            <Col xl={8}></Col>
          </Can>
          <Col span={24}>
            {displayMode === "table" && (
              <MaterialTable
                abteilungId={abteilung.id}
                categorie={categories}
                standort={standorte}
                material={filteredMaterials}
                sammlungen={filteredSammlungen}
                addToCart={addItemToCart}
                addSammlungToCart={addSammlungToCart}
              />
            )}
            {displayMode === "grid" && (
              <MaterialGrid
                abteilungId={abteilung.id}
                categorie={categories}
                standort={standorte}
                material={filteredMaterials}
                sammlungen={filteredSammlungen}
                addToCart={addItemToCart}
                addSammlungToCart={addSammlungToCart}
              />
            )}
            {displayMode === "list" && (
              <MaterialListView
                abteilungId={abteilung.id}
                categorie={categories}
                standort={standorte}
                material={filteredMaterials}
                sammlungen={filteredSammlungen}
                addToCart={addItemToCart}
                addSammlungToCart={addSammlungToCart}
              />
            )}
          </Col>
        </>
      )}

      <Modal
        title={t("sammlung:cart.unavailableTitle")}
        open={warningVisible}
        onCancel={() => setWarningVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setWarningVisible(false)}>
            {t("sammlung:cart.cancel")}
          </Button>,
          <Button
            key="add"
            type="primary"
            disabled={pendingCartItems.length === 0}
            onClick={confirmAddAvailable}
          >
            {t("sammlung:cart.addAvailable")}
          </Button>,
        ]}
      >
        <p>{t("sammlung:cart.unavailableMessage")}</p>
        <List
          size="small"
          dataSource={unavailableItems}
          renderItem={(item) => (
            <List.Item>
              {t("sammlung:cart.unavailableItem", {
                name: item.name,
                available: item.available,
                requested: item.requested,
              })}
            </List.Item>
          )}
        />
      </Modal>
    </Row>
  );
};
