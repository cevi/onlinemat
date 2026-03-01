import { useContext, useState } from 'react';
import { Button, Card, Col, Popconfirm, Row, Space, Spin } from 'antd';
import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { Abteilung } from 'types/abteilung.type';
import { MaterialsContext, CategorysContext, StandorteContext } from 'components/abteilung/AbteilungDetails';
import { ImportExportButtons } from 'components/excel/ImportExportButtons';
import { DeleteMaterialButton } from 'components/material/DeleteMaterial';
import { setAllOnlyLendInternal } from 'util/MaterialUtil';
import { firestoreOperation } from 'util/firestoreOperation';
import { Can } from 'config/casl/casl';
import { AbteilungEntityCasl } from 'config/casl/ability';
import { AddCategorieButton } from 'components/categorie/AddCategorie';
import { CategoryTable } from 'components/categorie/CategoryTable';
import { AddStandortButton } from 'components/standort/AddStandort';
import { StandortTable } from 'components/standort/StandortTable';

export type AbteilungMaterialSettingsViewProps = {
    abteilung: Abteilung;
};

export const AbteilungMaterialSettingsView = (props: AbteilungMaterialSettingsViewProps) => {
    const { abteilung } = props;
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);

    const materialsContext = useContext(MaterialsContext);
    const materials = materialsContext.materials;

    const { categories, loading: categoryLoading } = useContext(CategorysContext);
    const { standorte, loading: standortLoading } = useContext(StandorteContext);

    const handleSetAllInternal = async () => {
        setLoading(true);
        await firestoreOperation(
            () => setAllOnlyLendInternal(abteilung.id, materials, true),
            t('material:settings.setAllInternalSuccess'),
        );
        setLoading(false);
    };

    const handleSetAllPublic = async () => {
        setLoading(true);
        await firestoreOperation(
            () => setAllOnlyLendInternal(abteilung.id, materials, false),
            t('material:settings.setAllPublicSuccess'),
        );
        setLoading(false);
    };

    return (
        <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
                <Card title={t('material:settings.excelTitle')}>
                    <ImportExportButtons abteilung={abteilung} />
                </Card>
            </Col>

            <Col xs={24} lg={12}>
                <Card title={t('material:settings.visibilityTitle')}>
                    <Space>
                        <Popconfirm
                            title={t('material:settings.setAllInternalConfirm')}
                            onConfirm={handleSetAllInternal}
                            okText={t('common:confirm.yes')}
                            cancelText={t('common:confirm.no')}
                        >
                            <Button icon={<EyeInvisibleOutlined />} loading={loading}>
                                {t('material:settings.setAllInternal')}
                            </Button>
                        </Popconfirm>
                        <Popconfirm
                            title={t('material:settings.setAllPublicConfirm')}
                            onConfirm={handleSetAllPublic}
                            okText={t('common:confirm.yes')}
                            cancelText={t('common:confirm.no')}
                        >
                            <Button icon={<EyeOutlined />} loading={loading}>
                                {t('material:settings.setAllPublic')}
                            </Button>
                        </Popconfirm>
                    </Space>
                </Card>
            </Col>

            <Col xs={24}>
                <Card title={t('abteilung:tabs.kategorien')}>
                    <Can I={'create'} this={{ __caslSubjectType__: 'Categorie', abteilungId: abteilung.id } as AbteilungEntityCasl}>
                        <div style={{ marginBottom: 16 }}>
                            <AddCategorieButton abteilungId={abteilung.id} />
                        </div>
                    </Can>
                    {categoryLoading ? <Spin /> : <CategoryTable abteilungId={abteilung.id} category={categories} />}
                </Card>
            </Col>

            <Col xs={24}>
                <Card title={t('abteilung:tabs.standorte')}>
                    <Can I={'create'} this={{ __caslSubjectType__: 'Standort', abteilungId: abteilung.id } as AbteilungEntityCasl}>
                        <div style={{ marginBottom: 16 }}>
                            <AddStandortButton abteilungId={abteilung.id} />
                        </div>
                    </Can>
                    {standortLoading ? <Spin /> : <StandortTable abteilungId={abteilung.id} standort={standorte} />}
                </Card>
            </Col>

            <Col xs={24} lg={12}>
                <Card title={t('material:settings.dangerZoneTitle')}>
                    <DeleteMaterialButton abteilung={abteilung} />
                </Card>
            </Col>
        </Row>
    );
};
