import { useContext } from 'react';
import { Button, Input, InputNumber, Select, Switch, Form } from 'antd';
import { useTranslation } from 'react-i18next';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { PicturesWall } from 'components/pictures/PictureWall';
import { CategorysContext, StandorteContext } from 'components/abteilung/AbteilungDetails';

const { TextArea } = Input;
const { Option } = Select;

const formItemLayout = {
    labelCol: {
        xs: { span: 24 },
        sm: { span: 4 },
    },
    wrapperCol: {
        xs: { span: 24 },
        sm: { span: 20 },
    },
};

const formItemLayoutWithOutLabel = {
    wrapperCol: {
        xs: { span: 24, offset: 0 },
        sm: { span: 20, offset: 4 },
    },
};

interface MaterialFormFieldsProps {
    maxCount: { damaged: number; lost: number };
    availCount: number;
    renderMatImages: string[];
}

export const MaterialFormFields = ({ maxCount, availCount, renderMatImages }: MaterialFormFieldsProps) => {
    const { t } = useTranslation();
    const { categories } = useContext(CategorysContext);
    const { standorte } = useContext(StandorteContext);

    return <>
        <Form.Item
            label={t('material:form.name')}
            name='name'
            rules={[
                { required: true },
                { type: 'string', min: 1 },
            ]}
        >
            <Input placeholder={t('material:form.namePlaceholder')} />
        </Form.Item>
        <Form.Item
            label={t('material:form.comment')}
            name='comment'
            rules={[{ required: false }]}
        >
            <TextArea placeholder={t('material:form.commentPlaceholder')} rows={4} />
        </Form.Item>
        <Form.Item
            label={t('material:form.standort')}
            name='standort'
            rules={[{ required: false }]}
        >
            <Select
                mode='multiple'
                allowClear
                style={{ width: '100%' }}
                placeholder={t('material:form.standortPlaceholder')}
            >
                {standorte.map(std => <Option key={std.id} value={std.id}>{std.name}</Option>)}
            </Select>
        </Form.Item>
        <Form.Item
            label={t('material:form.count')}
            name='count'
            rules={[
                { required: true },
                { type: 'number', min: 1 },
            ]}
        >
            <InputNumber min={1} />
        </Form.Item>
        <Form.Item
            label={t('material:form.lost')}
            name='lost'
            rules={[
                { required: true },
                { type: 'number', min: 0, max: maxCount.lost },
            ]}
        >
            <InputNumber min={0} max={maxCount.lost} />
        </Form.Item>
        <Form.Item
            label={t('material:form.damaged')}
            name='damaged'
            rules={[
                { required: true },
                { type: 'number', min: 0, max: maxCount.damaged },
            ]}
        >
            <InputNumber min={0} max={maxCount.damaged} />
        </Form.Item>
        <Form.Item>
            {t('material:form.availableCount', { count: availCount })}
        </Form.Item>
        <Form.Item
            label={t('material:form.weight')}
            name='weightInKg'
            rules={[{ required: false }]}
        >
            <InputNumber />
        </Form.Item>
        <Form.Item
            label={t('material:form.consumables')}
            name='consumables'
            valuePropName="checked"
            rules={[{ required: true }]}
        >
            <Switch />
        </Form.Item>
        <Form.Item
            label={t('material:form.onlyLendInternal')}
            name='onlyLendInternal'
            valuePropName="checked"
            rules={[{ required: true }]}
        >
            <Switch />
        </Form.Item>
        <Form.Item
            label={t('material:form.categories')}
            name='categorieIds'
            rules={[{ required: false }]}
        >
            <Select
                mode='multiple'
                allowClear
                style={{ width: '100%' }}
                placeholder={t('material:form.categoriesPlaceholder')}
            >
                {categories.map(cat => <Option key={cat.id} value={cat.id}>{cat.name}</Option>)}
            </Select>
        </Form.Item>
        <Form.List name='imageUrls'>
            {(fields, { add, remove }, { errors }) => (
                <>
                    {fields.map((field, index) => (
                        <Form.Item
                            {...(index === 0 ? formItemLayout : formItemLayoutWithOutLabel)}
                            label={index === 0 ? t('material:form.imageUrls') : ''}
                            required={false}
                            key={field.key}
                        >
                            <Form.Item
                                {...field}
                                validateTrigger={['onChange', 'onBlur']}
                                rules={[
                                    {
                                        required: false,
                                        whitespace: true,
                                    },
                                ]}
                                noStyle
                            >
                                <Input placeholder={t('material:form.imageUrlPlaceholder')} style={{ width: '90%' }} />
                            </Form.Item>
                            <MinusCircleOutlined
                                className='dynamic-delete-button'
                                onClick={() => remove(field.name)}
                            />
                        </Form.Item>
                    ))}
                    <Form.Item>
                        <Button
                            type='dashed'
                            onClick={() => add()}
                            style={{ width: '100%' }}
                            icon={<PlusOutlined />}
                        >
                            {t('material:form.addImage')}
                        </Button>
                    </Form.Item>
                </>
            )}
        </Form.List>

        <PicturesWall showRemove={false} imageUrls={renderMatImages} />
    </>;
};
