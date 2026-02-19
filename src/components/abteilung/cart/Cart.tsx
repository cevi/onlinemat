import { DeleteOutlined, LoadingOutlined } from '@ant-design/icons';
import { Button, Col, Input, message, Popconfirm, Result, Row, Steps } from 'antd';
import dayjs from 'dayjs';
import { useCookies } from 'react-cookie';
import { useNavigate } from 'react-router';
import { Abteilung } from 'types/abteilung.type';
import { CartItem, DetailedCartItem } from 'types/cart.types';
import { getCartName } from 'util/CartUtil';
import { CartTable } from './CartTable';
import { useContext, useEffect, useRef, useState } from 'react';
import { CategorysContext, MaterialsContext, StandorteContext } from '../AbteilungDetails';
import { CreateOrder } from '../order/CreateOrder';
import { functions } from 'config/firebase/firebase';
import { httpsCallable } from 'firebase/functions';
import { getAvailableMatCount } from 'util/MaterialUtil';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from 'hooks/useIsMobile';

export interface CartProps {
    abteilung: Abteilung
    cartItems: CartItem[]
    changeCart: (cart: CartItem[]) => void
}

export const Cart = (props: CartProps) => {

    const { abteilung, cartItems, changeCart } = props;

    const { Step } = Steps;
    const isMobile = useIsMobile();

    const cookieName = getCartName(abteilung.id);

    const [cookies, setCookie] = useCookies([cookieName]);

    const navigate = useNavigate();
    const { t } = useTranslation();

    //fetch materials
    const materialsContext = useContext(MaterialsContext);
    const { categories } = useContext(CategorysContext);
    const { standorte } = useContext(StandorteContext);

    const materials = materialsContext.materials;
    const matLoading = materialsContext.loading;

    const abteilungMatLink = `/abteilungen/${abteilung.slug || abteilung.id}/mat`;

    const [cartItemsMerged, setCartItemsMerged] = useState<DetailedCartItem[]>([]);

    const [currentStep, setCurrentStep] = useState<number>(cartItems.length <= 0 ? -1 : 0);
    const [query, setQuery] = useState<string | undefined>(undefined);

    // Sync currentStep when cartItems changes (e.g. loaded from cookie after mount)
    useEffect(() => {
        if (currentStep === -1 && cartItems.length > 0) {
            setCurrentStep(0);
        } else if (currentStep === 0 && cartItems.length === 0) {
            setCurrentStep(-1);
        }
    }, [cartItems]);

    const [createdOrderId, setCreatedOrderId] = useState<string | undefined>(undefined);
    const [orderLoading, setOrderLoading] = useState<boolean>(false);
    const [orderError, setOrderError] = useState<string | undefined>(undefined);

    const createOrderRef = useRef();

    useEffect(() => {
        const localItemsMerged: DetailedCartItem[] = [];
        cartItems.forEach(item => {
            const mat = materials.find(m => m.id === item.matId);
            const maxCount = getAvailableMatCount(mat);
            const standortNames = mat?.standort?.map(sId => standorte.find(s => s.id === sId)?.name).filter((n): n is string => !!n) || [];
            const categorieNames = mat?.categorieIds?.map(cId => categories.find(c => c.id === cId)?.name).filter((n): n is string => !!n) || [];
            const mergedItem: DetailedCartItem = {
                ...item,
                name: mat && mat.name || 'Loading...',
                maxCount,
                imageUrls: mat && mat.imageUrls || [],
                comment: mat?.comment,
                weightInKg: mat?.weightInKg,
                standortNames,
                categorieNames,
                __caslSubjectType__: 'DetailedCartItem'
            }
            localItemsMerged.push(mergedItem);
        })
        setCartItemsMerged(localItemsMerged);
    }, [cartItems, materials, categories, standorte])

    const createOrder = async (orderToCreate: any): Promise<{orderId: string | undefined, collisions: { [matId: string]: number } | undefined}> => {
        try {
            setOrderError(undefined)
            setOrderLoading(true)

            const result = await httpsCallable(functions, 'createOrder')({ abteilungId: abteilung.id, order: orderToCreate });
            const orderId: string | undefined = result.data.id;
            const collisions: { [matId: string]: number } | undefined = result.data.collisions;
            if(orderId) {
                setCreatedOrderId(orderId)
                setCurrentStep(currentStep + 1)
                changeCartAndCookie([])
                message.success(t('order:create.success'));
            }

            if(collisions) {
                message.error(t('order:create.notAllAvailable'));
            }

            setOrderLoading(false)

            return {
                orderId,
                collisions
            };
        } catch (ex) {
            message.error(t('common:errors.generic', { error: ex }))
            setOrderError(t('common:errors.generic', { error: ex }))
        }
        setOrderLoading(false)

        return {
            orderId: undefined,
            collisions: undefined
        }
    }

    const changeCartAndCookie = (items: CartItem[]) => {

        const expires = dayjs().add(24, 'hours');

        setCookie(cookieName, items, {
            path: '/',
            expires: expires.toDate(),
            secure: true,
            sameSite: 'strict',
        });

        changeCart(items)
    }


    const ProgressBar = () => {
        const minStep = 0;
        const maxStep = 2;
        return <><Steps current={currentStep} size={isMobile ? 'small' : 'default'}>
            <Step title={t('order:cart.steps.material')} description={isMobile ? undefined : t('order:cart.steps.materialDescription')} />
            <Step title={t('order:cart.steps.order')} description={isMobile ? undefined : (orderError ? orderError : t('order:cart.steps.orderDescription'))} icon={orderLoading ? <LoadingOutlined /> : undefined} status={orderError ? 'error' : undefined}/>
            <Step title={t('order:cart.steps.finish')} description={isMobile ? undefined : t('order:cart.steps.finishDescription')} status={currentStep === maxStep ? 'finish' : undefined}/>
        </Steps>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                <div>
                    {currentStep > minStep && currentStep < maxStep  && <Button disabled={orderLoading} onClick={() => setCurrentStep(0)}>{t('common:buttons.back')}</Button>}
                </div>
                <div>
                    {currentStep < maxStep - 1 && <Button disabled={orderLoading} type='primary' onClick={() => setCurrentStep(currentStep + 1)}>{t('common:buttons.next')}</Button>}
                    {currentStep === maxStep - 1 && <Button disabled={orderLoading || cartItemsMerged.length <= 0} type='primary' onClick={() => {
                        if(!createOrderRef || !createOrderRef.current) return;
                        //TODO: typescript
                        (createOrderRef.current as any).submitOrder()
                    }}>{t('order:cart.submitOrder')}</Button>}
                </div>
            </div>
        </>
    }


    if (currentStep === 0) return <Row gutter={[16, 16]}>
        <Col span={24}>
            <Input.Search
                placeholder={t('order:cart.searchPlaceholder')}
                allowClear
                enterButton={t('common:buttons.search')}
                size='large'
                onSearch={(query) => setQuery(query)}
            />
        </Col>

        <Col span={24}>
            <CartTable abteilung={abteilung} cartItems={query ? cartItemsMerged.filter(item => item.name.toLowerCase().includes(query.toLowerCase())) : cartItemsMerged} allCartItems={cartItemsMerged} changeCart={changeCartAndCookie} />
        </Col>
        <Col span={24}>
            <Popconfirm
                title={t('order:cart.deleteConfirm')}
                onConfirm={() => changeCartAndCookie([])}
                onCancel={() => { }}
                okText={t('common:confirm.yes')}
                cancelText={t('common:confirm.no')}
            >
                <Button type='dashed' danger icon={<DeleteOutlined />}>{t('order:cart.deleteButton')}</Button>
            </Popconfirm>
        </Col>
        <Col span={24}>
            <ProgressBar />
        </Col>

    </Row>

    if (currentStep === 1) return <Row gutter={[16, 16]}>
        <Col span={24}>
            <CreateOrder ref={createOrderRef} abteilung={abteilung} initItems={cartItemsMerged} changeCart={changeCartAndCookie} createOrder={createOrder}/>
        </Col>
        <Col span={24}>
            <ProgressBar />
        </Col>
    </Row>

    if (currentStep === 2) return <><Result
        status='success'
        title={t('order:cart.success.title')}
        subTitle={t('order:cart.success.subtitle', { orderId: createdOrderId })}
        extra={[
            <Button type='primary' key='backToAbteilung' onClick={()=> navigate(abteilungMatLink)}>
                {t('common:buttons.back')}
            </Button>,
            <Button key='viewOrder' onClick={()=> navigate(`/abteilungen/${abteilung.slug || abteilung.id}/order/${createdOrderId}`)}>{t('order:cart.success.viewOrder')}</Button>,
        ]}
    />
        <ProgressBar />
    </>

    return <Result
        title={t('order:cart.empty.title')}
        extra={
            <Button type='primary' key='orderMat' onClick={() => navigate(abteilungMatLink)}>
                {t('order:cart.empty.orderMaterial')}
            </Button>
        }
    />
}