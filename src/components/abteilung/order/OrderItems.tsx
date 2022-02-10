import { Avatar, Button, List, Tooltip } from 'antd'
import Checkbox from 'antd/lib/checkbox/Checkbox';
import { MaterialModal } from 'components/material/MaterialModal';
import { useState } from 'react';
import { DetailedCartItem } from 'types/cart.types'
import { DamagedMaterial, Material } from 'types/material.types';

export interface OrderItemsProps {
    items: DetailedCartItem[]
    collisions?: { [matId: string]: number } | undefined
    showCheckBoxes?: boolean
    damagedMaterialsCheckboxes?: DetailedCartItem[]
    damagedMaterials?: DamagedMaterial[]
    showWeight?: boolean
    setDamagedMaterialCheckboxes?: (damagedMaterial: DetailedCartItem[]) => void
    updateOrderItemsByAvail?: () => void
}

export const OrderItems = (props: OrderItemsProps) => {

    const { items, collisions, showCheckBoxes, damagedMaterialsCheckboxes, damagedMaterials, showWeight, setDamagedMaterialCheckboxes, updateOrderItemsByAvail } = props;

    const [showMaterial, setShowMaterial] = useState<boolean>(false);
    const [materialToShow, setMaterialToShow] = useState<string | undefined>(undefined)

    return <><div
        id='scrollableDiv'
        style={{
            maxHeight: 400,
            overflow: 'auto',
            padding: '0 16px',
        }}
    >
        <List
            itemLayout='horizontal'
            header={<div>Material</div>}
            dataSource={items}
            renderItem={item => {
                const damaged = damagedMaterials && damagedMaterials.find(mat => mat.id === item.matId)
                return <List.Item style={{ borderColor: '#B5B2B0' }}>
                    <List.Item.Meta
                        avatar={item.imageUrls && item.imageUrls.length > 0 ? <Avatar src={item.imageUrls[0]} /> : undefined}
                        title={
                            <>
                                {`${item.count} x `}<Button type='link' onClick={async () => {
                                    await setMaterialToShow(item.matId);
                                    setShowMaterial(true);
                                }}>{item.name}</Button>
                            </>
                        }
                        description={
                            <>
                                <span style={{ color: 'red' }}>
                                    {collisions && item.matId in collisions ? (collisions[item.matId] === 0 ? `Leider nicht mehr verfügbar` : `Nur noch ${collisions[item.matId]} verfügbar`) : ''}
                                    {damaged && `${damaged.count} x wurde ${damaged.type === 'damaged' ? 'beschädigt' : 'verloren'}`}
                                </span>
                                {
                                    (showWeight && item.weightInKg) && <span>{`${item.count * item.weightInKg} Kg`}</span>
                                }
                            </>

                        }
                    />

                    {
                        (!!showCheckBoxes && damagedMaterialsCheckboxes && setDamagedMaterialCheckboxes) && <Checkbox checked={damagedMaterialsCheckboxes.includes(item) ? true : false} onChange={(e) => { setDamagedMaterialCheckboxes(e.target.checked ? [...damagedMaterialsCheckboxes, item] : damagedMaterialsCheckboxes.filter(d => d.matId !== item.matId)) }}><Tooltip title='Material ist beschädigt oder wurde nicht zurückgegeben.'>Kaputt</Tooltip></Checkbox>
                    }
                </List.Item>
            }}
        />
        <MaterialModal materialId={materialToShow} isModalVisible={showMaterial} setModalVisible={setShowMaterial}/>
    </div>
        {
            collisions && updateOrderItemsByAvail && <Button
                type='primary'
                style={{ display: 'block', marginLeft: 'auto', marginRight: 0 }}
                onClick={() => updateOrderItemsByAvail()}
            >
                Anpassen
            </Button>
        }
    </>
}