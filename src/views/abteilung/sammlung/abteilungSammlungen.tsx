import { useContext, useState } from 'react';
import { Button, Col, List, message, Modal, Row, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import { useCookies } from 'react-cookie';
import dayjs from 'dayjs';
import { Abteilung } from 'types/abteilung.type';
import { CartItem } from 'types/cart.types';
import { Sammlung } from 'types/sammlung.types';
import { Can } from 'config/casl/casl';
import { AbteilungEntityCasl } from 'config/casl/ability';
import { MaterialsContext, SammlungenContext } from 'contexts/AbteilungContexts';
import { AddSammlungButton } from 'components/sammlung/AddSammlung';
import { SammlungTable } from 'components/sammlung/SammlungTable';
import { getCartName, prepareSammlungForCart, UnavailableItem } from 'util/CartUtil';

export type AbteilungSammlungenViewProps = {
    abteilung: Abteilung;
    cartItems: CartItem[];
    changeCart: (cart: CartItem[]) => void;
};

export const AbteilungSammlungenView = (props: AbteilungSammlungenViewProps) => {
    const { abteilung, cartItems, changeCart } = props;
    const { t } = useTranslation();

    const cookieName = getCartName(abteilung.id);
    const [, setCookie] = useCookies([cookieName]);

    const { sammlungen, loading: sammlungenLoading } = useContext(SammlungenContext);
    const { materials, loading: matLoading } = useContext(MaterialsContext);

    const [warningVisible, setWarningVisible] = useState(false);
    const [unavailableItems, setUnavailableItems] = useState<UnavailableItem[]>([]);
    const [pendingCartItems, setPendingCartItems] = useState<CartItem[]>([]);
    const [pendingSammlungName, setPendingSammlungName] = useState('');
    const [pendingSammlungId, setPendingSammlungId] = useState('');

    const addSammlungToCart = (sammlung: Sammlung) => {
        // Check if Sammlung already in cart
        if (cartItems.some(c => c.sammlungId === sammlung.id)) {
            message.info(t('sammlung:cart.alreadyInCart'));
            return;
        }

        const { availableItems, unavailableItems: unavailable } = prepareSammlungForCart(
            sammlung.items,
            materials,
            cartItems,
        );

        if (unavailable.length === 0) {
            applyToCart(availableItems, sammlung.name, sammlung.id);
        } else {
            setUnavailableItems(unavailable);
            setPendingCartItems(availableItems);
            setPendingSammlungName(sammlung.name);
            setPendingSammlungId(sammlung.id);
            setWarningVisible(true);
        }
    };

    const applyToCart = (itemsToAdd: CartItem[], sammlungName: string, sammlungId: string) => {
        const taggedItems = itemsToAdd.map(item => ({
            ...item,
            sammlungId,
        }));
        const localCart = [...cartItems, ...taggedItems];

        const expires = dayjs().add(24, 'hours');
        setCookie(cookieName, localCart, {
            path: '/',
            expires: expires.toDate(),
            secure: true,
            sameSite: 'strict',
        });
        changeCart(localCart);
        message.success(t('sammlung:cart.added', { name: sammlungName }));
    };

    const confirmAddAvailable = () => {
        applyToCart(pendingCartItems, pendingSammlungName, pendingSammlungId);
        setWarningVisible(false);
    };

    if (!abteilung) return <Spin />;

    return (
        <>
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <Can I="create" this={{ __caslSubjectType__: 'Sammlung', abteilungId: abteilung.id } as AbteilungEntityCasl}>
                        <AddSammlungButton abteilungId={abteilung.id} />
                    </Can>
                </Col>
                <Col span={24}>
                    {sammlungenLoading || matLoading ? (
                        <Spin />
                    ) : (
                        <SammlungTable
                            abteilungId={abteilung.id}
                            sammlungen={sammlungen}
                            materials={materials}
                            onAddToCart={addSammlungToCart}
                        />
                    )}
                </Col>
            </Row>

            <Modal
                title={t('sammlung:cart.unavailableTitle')}
                open={warningVisible}
                onCancel={() => setWarningVisible(false)}
                footer={[
                    <Button key="cancel" onClick={() => setWarningVisible(false)}>
                        {t('sammlung:cart.cancel')}
                    </Button>,
                    <Button
                        key="add"
                        type="primary"
                        disabled={pendingCartItems.length === 0}
                        onClick={confirmAddAvailable}
                    >
                        {t('sammlung:cart.addAvailable')}
                    </Button>,
                ]}
            >
                <p>{t('sammlung:cart.unavailableMessage')}</p>
                <List
                    size="small"
                    dataSource={unavailableItems}
                    renderItem={(item) => (
                        <List.Item>
                            {t('sammlung:cart.unavailableItem', {
                                name: item.name,
                                available: item.available,
                                requested: item.requested,
                            })}
                        </List.Item>
                    )}
                />
            </Modal>
        </>
    );
};
