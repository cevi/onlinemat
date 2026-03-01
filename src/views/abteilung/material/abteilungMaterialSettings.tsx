import { useContext, useState } from 'react';
import { Button, Card, Col, message, Popconfirm, Row, Space } from 'antd';
import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { Abteilung } from 'types/abteilung.type';
import { MaterialsContext } from 'components/abteilung/AbteilungDetails';
import { ExportMaterialButton } from 'components/material/ExportMaterial';
import { ImportAddMaterialButton } from 'components/material/ImportAddMaterial';
import { DeleteMaterialButton } from 'components/material/DeleteMaterial';
import { setAllOnlyLendInternal } from 'util/MaterialUtil';
import { firestoreOperation } from 'util/firestoreOperation';

export type AbteilungMaterialSettingsViewProps = {
    abteilung: Abteilung;
};

export const AbteilungMaterialSettingsView = (props: AbteilungMaterialSettingsViewProps) => {
    const { abteilung } = props;
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);

    const materialsContext = useContext(MaterialsContext);
    const materials = materialsContext.materials;

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
                    <Space>
                        <ImportAddMaterialButton abteilung={abteilung} />
                        <ExportMaterialButton abteilung={abteilung} />
                    </Space>
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

            <Col xs={24} lg={12}>
                <Card title={t('material:settings.dangerZoneTitle')}>
                    <DeleteMaterialButton abteilung={abteilung} />
                </Card>
            </Col>
        </Row>
    );
};
