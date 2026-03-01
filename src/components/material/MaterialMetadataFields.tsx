import { Collapse, DatePicker, Form, Input, InputNumber, Select, Button, Row, Col } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

const { TextArea } = Input;

export const MaterialMetadataFields = () => {
    const { t } = useTranslation();

    return (
        <Collapse
            ghost
            style={{ marginTop: 16 }}
            items={[{
                key: 'metadata',
                label: t('material:form.metadataSection'),
                children: (
                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                label={t('material:form.purchaseDate')}
                                name="purchaseDate"
                                layout="vertical"
                                getValueProps={(value) => ({ value: value ? dayjs(value) : null })}
                                normalize={(value) => value ? value.format('YYYY-MM-DD') : null}
                            >
                                <DatePicker
                                    format="DD.MM.YYYY"
                                    style={{ width: '100%' }}
                                    placeholder={t('material:form.purchaseDatePlaceholder')}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                label={t('material:form.purchasePrice')}
                                name="purchasePrice"
                                layout="vertical"
                                rules={[{ required: false }]}
                            >
                                <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                label={t('material:form.lifespanInYears')}
                                name="lifespanInYears"
                                layout="vertical"
                                rules={[{ required: false }]}
                            >
                                <InputNumber min={0} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                label={t('material:form.warrantyUntil')}
                                name="warrantyUntil"
                                layout="vertical"
                                getValueProps={(value) => ({ value: value ? dayjs(value) : null })}
                                normalize={(value) => value ? value.format('YYYY-MM-DD') : null}
                            >
                                <DatePicker
                                    format="DD.MM.YYYY"
                                    style={{ width: '100%' }}
                                    placeholder={t('material:form.warrantyUntilPlaceholder')}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                label={t('material:form.supplier')}
                                name="supplier"
                                layout="vertical"
                                rules={[{ required: false }]}
                            >
                                <Input placeholder={t('material:form.supplierPlaceholder')} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                label={t('material:form.brand')}
                                name="brand"
                                layout="vertical"
                                rules={[{ required: false }]}
                            >
                                <Input placeholder={t('material:form.brandPlaceholder')} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                label={t('material:form.inventoryNumber')}
                                name="inventoryNumber"
                                layout="vertical"
                                rules={[{ required: false }]}
                            >
                                <Input placeholder={t('material:form.inventoryNumberPlaceholder')} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                label={t('material:form.condition')}
                                name="condition"
                                layout="vertical"
                                rules={[{ required: false }]}
                            >
                                <Select
                                    allowClear
                                    placeholder={t('material:form.conditionPlaceholder')}
                                >
                                    <Select.Option value="new">{t('material:form.conditionNew')}</Select.Option>
                                    <Select.Option value="good">{t('material:form.conditionGood')}</Select.Option>
                                    <Select.Option value="fair">{t('material:form.conditionFair')}</Select.Option>
                                    <Select.Option value="poor">{t('material:form.conditionPoor')}</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                label={t('material:form.nextMaintenanceDue')}
                                name="nextMaintenanceDue"
                                layout="vertical"
                                getValueProps={(value) => ({ value: value ? dayjs(value) : null })}
                                normalize={(value) => value ? value.format('YYYY-MM-DD') : null}
                            >
                                <DatePicker
                                    format="DD.MM.YYYY"
                                    style={{ width: '100%' }}
                                    placeholder={t('material:form.nextMaintenanceDuePlaceholder')}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item
                                label={t('material:form.storageInstructions')}
                                name="storageInstructions"
                                layout="vertical"
                                rules={[{ required: false }]}
                            >
                                <TextArea
                                    placeholder={t('material:form.storageInstructionsPlaceholder')}
                                    rows={2}
                                />
                            </Form.Item>
                        </Col>

                        <Col span={24}>
                            <Form.Item
                                label={t('material:form.maintenanceHistory')}
                                layout="vertical"
                            >
                                <Form.List name="maintenanceHistory">
                                    {(fields, { add, remove }) => (
                                        <>
                                            {fields.map((field) => {
                                                const { key, ...restField } = field;
                                                return (
                                                    <div key={key} style={{ border: '1px solid #f0f0f0', borderRadius: 8, padding: 12, marginBottom: 12, position: 'relative' }}>
                                                        <MinusCircleOutlined
                                                            onClick={() => remove(field.name)}
                                                            style={{ position: 'absolute', top: 12, right: 12, color: '#ff4d4f' }}
                                                        />
                                                        <Row gutter={12}>
                                                            <Col xs={24} sm={12}>
                                                                <Form.Item
                                                                    {...restField}
                                                                    name={[field.name, 'date']}
                                                                    label={t('material:form.maintenanceDate')}
                                                                    layout="vertical"
                                                                    getValueProps={(value) => ({ value: value ? dayjs(value) : null })}
                                                                    normalize={(value) => value ? value.format('YYYY-MM-DD') : null}
                                                                    style={{ marginBottom: 8 }}
                                                                >
                                                                    <DatePicker
                                                                        format="DD.MM.YYYY"
                                                                        style={{ width: '100%' }}
                                                                        placeholder={t('material:form.maintenanceDate')}
                                                                    />
                                                                </Form.Item>
                                                            </Col>
                                                            <Col xs={24} sm={12}>
                                                                <Form.Item
                                                                    {...restField}
                                                                    name={[field.name, 'type']}
                                                                    label={t('material:form.maintenanceType')}
                                                                    layout="vertical"
                                                                    style={{ marginBottom: 8 }}
                                                                >
                                                                    <Select
                                                                        placeholder={t('material:form.maintenanceType')}
                                                                        style={{ width: '100%' }}
                                                                    >
                                                                        <Select.Option value="repair">{t('material:form.maintenanceTypeRepair')}</Select.Option>
                                                                        <Select.Option value="control">{t('material:form.maintenanceTypeControl')}</Select.Option>
                                                                        <Select.Option value="purchase">{t('material:form.maintenanceTypePurchase')}</Select.Option>
                                                                        <Select.Option value="other">{t('material:form.maintenanceTypeOther')}</Select.Option>
                                                                    </Select>
                                                                </Form.Item>
                                                            </Col>
                                                            <Col xs={24} sm={12}>
                                                                <Form.Item
                                                                    {...restField}
                                                                    name={[field.name, 'notes']}
                                                                    label={t('material:form.maintenanceNotes')}
                                                                    layout="vertical"
                                                                    style={{ marginBottom: 8 }}
                                                                >
                                                                    <Input placeholder={t('material:form.maintenanceNotes')} />
                                                                </Form.Item>
                                                            </Col>
                                                            <Col xs={24} sm={12}>
                                                                <Form.Item
                                                                    {...restField}
                                                                    name={[field.name, 'user']}
                                                                    label={t('material:form.maintenanceUser')}
                                                                    layout="vertical"
                                                                    style={{ marginBottom: 8 }}
                                                                >
                                                                    <Input placeholder={t('material:form.maintenanceUser')} />
                                                                </Form.Item>
                                                            </Col>
                                                        </Row>
                                                    </div>
                                                );
                                            })}
                                            <Button
                                                type="dashed"
                                                onClick={() => add()}
                                                style={{ width: '100%' }}
                                                icon={<PlusOutlined />}
                                            >
                                                {t('material:form.addMaintenanceEntry')}
                                            </Button>
                                        </>
                                    )}
                                </Form.List>
                            </Form.Item>
                        </Col>
                    </Row>
                ),
            }]}
        />
    );
};
