import { DeleteOutlined } from '@ant-design/icons';
import { Button, Col, Popconfirm, Result, Row } from 'antd';
import moment from 'moment';
import { useCookies } from 'react-cookie';
import { useNavigate } from 'react-router';
import { Abteilung } from 'types/abteilung.type';
import { CartItem, DetailedCartItem } from 'types/cart.types';
import { getCartName } from 'util/CartUtil';
import { CartTable } from './CartTable';
import Search from 'antd/lib/input/Search';
import { useContext, useEffect, useState } from 'react';
import { MaterialsContext } from '../AbteilungDetails';

export interface CartProps {
    abteilung: Abteilung
    cartItems: CartItem[]
    changeCart: (cart: CartItem[]) => void
}

export const Cart = (props: CartProps) => {

    const { abteilung, cartItems, changeCart } = props;

    const cookieName = getCartName(abteilung.id);

    const [cookies, setCookie] = useCookies([cookieName]);

    const navigate = useNavigate();

    //fetch materials
    const materialsContext = useContext(MaterialsContext);

    const materials = materialsContext.materials;
    const matLoading = materialsContext.loading;

    const [cartItemsMerged, setCartItemsMerged] = useState<DetailedCartItem[]>([]);

    const [query, setQuery] = useState<string | undefined>(undefined);

    const changeCartAndCookie = (items: CartItem[]) => {

        const expires = moment();
        expires.add(24, 'hours');

        setCookie(cookieName, items, {
            path: '/',
            expires: expires.toDate()
        });

        changeCart(items)
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




    if (cartItems.length <= 0) {
        return <Result
            title='Leider ist dein Warenkorb leer'
            extra={
                <Button type='primary' key='orderMat' onClick={() => navigate(`/abteilungen/${abteilung.slug || abteilung.id}/mat`)}>
                    Material bestellen
                </Button>
            }
        />
    }

    return <Row gutter={[16, 16]}>
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

            <Button type='primary' style={{ float: 'right' }}>Zur Bestellung</Button>
        </Col>

    </Row>
}