import { DeleteOutlined, LoadingOutlined } from '@ant-design/icons';
import { Button, Col, message, Popconfirm, Result, Row, Steps } from 'antd';
import moment from 'moment';
import { useCookies } from 'react-cookie';
import { useNavigate } from 'react-router';
import { Abteilung } from 'types/abteilung.type';
import { CartItem, DetailedCartItem } from 'types/cart.types';
import { getCartName } from 'util/CartUtil';
import { CartTable } from './CartTable';
import Search from 'antd/lib/input/Search';
import { useContext, useEffect, useRef, useState } from 'react';
import { MaterialsContext } from '../AbteilungDetails';
import { CreateOrder } from '../order/CreateOrder';
import { Order } from 'types/order.types';
import { functions } from 'config/firebase/firebase';

export interface CartProps {
    abteilung: Abteilung
    cartItems: CartItem[]
    changeCart: (cart: CartItem[]) => void
}

export const Cart = (props: CartProps) => {

    const { abteilung, cartItems, changeCart } = props;

    const { Step } = Steps;

    const cookieName = getCartName(abteilung.id);

    const [cookies, setCookie] = useCookies([cookieName]);

    const navigate = useNavigate();

    //fetch materials
    const materialsContext = useContext(MaterialsContext);

    const materials = materialsContext.materials;
    const matLoading = materialsContext.loading;

    const abteilungMatLink = `/abteilungen/${abteilung.slug || abteilung.id}/mat`;

    const [cartItemsMerged, setCartItemsMerged] = useState<DetailedCartItem[]>([]);

    const [currentStep, setCurrentStep] = useState<number>(cartItems.length <= 0 ? -1 : 0);
    const [query, setQuery] = useState<string | undefined>(undefined);

    const [createdOrderId, setCreatedOrderId] = useState<string | undefined>(undefined);
    const [orderLoading, setOrderLoading] = useState<boolean>(false);
    const [orderError, setOrderError] = useState<string | undefined>(undefined);

    const createOrderRef = useRef();

    const createOrder = async (orderToCreate: any): Promise<{orderId: string | undefined, collisions: { [matId: string]: number } | undefined}> => {
        try {
            setOrderError(undefined)
            setOrderLoading(true)
            
            const result = await functions().httpsCallable('createOrder')({ abteilungId: abteilung.id, order: orderToCreate });
            const orderId: string | undefined = result.data.id;
            const collisions: { [matId: string]: number } | undefined = result.data.collisions;
            if(orderId) {
                setCreatedOrderId(orderId)
                setCurrentStep(currentStep + 1)
                changeCartAndCookie([])
                message.success(`Bestellung erfolgreich erstellt`);
            }

            if(collisions) {
                message.error(`Leider ist nicht alles Material verfügbar.`);
            }

            setOrderLoading(false)

            return {
                orderId,
                collisions
            };
        } catch (ex) {
            message.error(`Es ist ein Fehler aufgetreten: ${ex}`)
            setOrderError(`Es ist ein Fehler aufgetreten ${ex}`)
        }
        setOrderLoading(false)

        return {
            orderId: undefined,
            collisions: undefined
        }
    }

    const changeCartAndCookie = (items: CartItem[]) => {

        const expires = moment();
        expires.add(24, 'hours');

        setCookie(cookieName, items, {
            path: '/',
            expires: expires.toDate()
        });

        changeCart(items)
    }

    const ProgressBar = () => {
        const minStep = 0;
        const maxStep = 2;
        return <><Steps current={currentStep}>
            <Step title='Material' description='Material auswählen' />
            <Step title='Bestellen' description={orderError ? orderError : 'Bestellung aufgeben'} icon={orderLoading ? <LoadingOutlined /> : undefined} status={orderError ? 'error' : undefined}/>
            <Step title='Abschliessen' description='Bestellung abschliessen' status={currentStep === maxStep ? 'finish' : undefined}/>
        </Steps>
            {currentStep > minStep && currentStep < maxStep  && <Button disabled={orderLoading} type='primary' onClick={() => setCurrentStep(0)}>Zurück</Button>}
            {currentStep < maxStep - 1 && <Button disabled={orderLoading} type='primary' style={{ float: 'right' }} onClick={() => setCurrentStep(currentStep + 1)}>Weiter</Button>}
            {currentStep === maxStep - 1 && <Button disabled={orderLoading} type='primary' style={{ float: 'right' }} onClick={() => {
                if(!createOrderRef || !createOrderRef.current) return;
                //TODO: typescript
                (createOrderRef.current as any).submitOrder()
            }}>Bestellen</Button>}
        </>
    }

    useEffect(() => {
        const localItemsMerged: DetailedCartItem[] = [];
        cartItems.forEach(item => {
            const mat = materials.find(m => m.id === item.matId);
            const maxCount = mat ? (!!mat.consumables ? 1 : mat.count) : 1
            const mergedItem: DetailedCartItem = {
                ...item,
                name: mat && mat.name || 'Loading...',
                maxCount,
                __caslSubjectType__: 'DetailedCartItem'
            }
            localItemsMerged.push(mergedItem);
        })
        setCartItemsMerged(localItemsMerged);
    }, [cartItems, materials])


    if (currentStep === 0) return <Row gutter={[16, 16]}>
        <Col span={24}>
            <Search
                placeholder='nach Material suchen'
                allowClear
                enterButton='Suchen'
                size='large'
                onSearch={(query) => setQuery(query)}
            />
        </Col>

        <Col span={24}>
            <CartTable abteilung={abteilung} cartItems={query ? cartItemsMerged.filter(item => item.name.toLowerCase().includes(query.toLowerCase())) : cartItemsMerged} changeCart={changeCartAndCookie} />
        </Col>
        <Col span={24}>
            <Popconfirm
                title='Möchtest du deinen Warenkorb wirklich löschen?'
                onConfirm={() => changeCartAndCookie([])}
                onCancel={() => { }}
                okText='Ja'
                cancelText='Nein'
            >
                <Button type='ghost' danger icon={<DeleteOutlined />}>Warenkorb löschen</Button>
            </Popconfirm>
        </Col>
        <Col span={24}>
            <ProgressBar />
        </Col>

    </Row>

    if (currentStep === 1) return <Row gutter={[16, 16]}>
        <Col span={24}>
            <CreateOrder ref={createOrderRef} abteilung={abteilung} items={cartItemsMerged} createOrder={createOrder}/>
        </Col>
        <Col span={24}>
            <ProgressBar />
        </Col>
    </Row>

    if (currentStep === 2) return <><Result
        status='success'
        title='Bestellung erfolgreich!'
        subTitle={`Die Bestellung: ${createdOrderId} wurde erfolgreich erstellt`}
        extra={[
            <Button type='primary' key='backToAbteilung' onClick={()=> navigate(abteilungMatLink)}>
                Zurück
            </Button>,
            <Button key='viewOrder' onClick={()=> navigate(`/abteilungen/${abteilung.slug || abteilung.id}/order/${createdOrderId}`)}>Bestellung ansehen</Button>,
        ]}
    />
        <ProgressBar />
    </>

    return <Result
        title='Leider ist dein Warenkorb leer'
        extra={
            <Button type='primary' key='orderMat' onClick={() => navigate(abteilungMatLink)}>
                Material bestellen
            </Button>
        }
    />
}