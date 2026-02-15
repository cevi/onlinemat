import { Modal, Button, Space } from 'antd';
import { SwapOutlined, MergeCellsOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

export interface CopyToCartModalProps {
    open: boolean;
    onReplace: () => void;
    onMerge: () => void;
    onCancel: () => void;
}

export const CopyToCartModal = (props: CopyToCartModalProps) => {
    const { open, onReplace, onMerge, onCancel } = props;
    const { t } = useTranslation();

    return (
        <Modal
            title={t('order:copyToCart.confirmTitle')}
            open={open}
            onCancel={onCancel}
            footer={
                <Space>
                    <Button onClick={onCancel}>
                        {t('common:buttons.cancel')}
                    </Button>
                    <Button onClick={onMerge} icon={<MergeCellsOutlined />}>
                        {t('order:copyToCart.merge')}
                    </Button>
                    <Button type="primary" danger onClick={onReplace} icon={<SwapOutlined />}>
                        {t('order:copyToCart.replace')}
                    </Button>
                </Space>
            }
        >
            <p>{t('order:copyToCart.confirmContent')}</p>
        </Modal>
    );
};
