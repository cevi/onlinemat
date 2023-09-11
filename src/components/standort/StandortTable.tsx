import { Button, Popconfirm, Space, Table } from 'antd';
import {Standort} from "types/standort.types";
export interface StandortTableProps {
    abteilungId: string
    standort: Standort[]
}


export const StandortTable = (props: StandortTableProps) => {

    const { abteilungId, standort } = props;

    const columns = [
        {
            title: 'Name',
            key: 'name',
            sorter: (a: Standort, b: Standort) => a.name.normalize().localeCompare(b.name.normalize())
        },
        {
            title: 'Strasse',
            key: 'street',
            sorter: (a: Standort, b: Standort) => {
                let street = ""
                if (b.street !== undefined) {
                    street = b.street;
                }
                return a.street?.normalize().localeCompare(street.normalize());
            },
        },
        {
            title: 'Ort',
            key: 'city',
            sorter: (a: Standort, b: Standort) => {
                let city = ""
                if (b.city !== undefined) {
                    city = b.city;
                }
                return a.city?.normalize().localeCompare(city.normalize());
            },
        },
        {
            title: 'Koordinaten',
            key: 'coordinates',
            sorter: (a: Standort, b: Standort) => {
                let coordinates = ""
                if (b.coordinates !== undefined) {
                    coordinates = b.coordinates;
                }
                return a.coordinates?.normalize().localeCompare(coordinates.normalize());
            },
        },
        {
            title: 'Bearbeiten',
            key: 'edit',
            render: (text: string, record: Standort) => (
                <div style={{display: 'flex', justifyContent: 'space-evenly'}}>
                    {/*<Can I='update' this={{...record, abteilungId: abteilungId}}>
                        <EditMaterialButton material={record} materialId={record.id} abteilungId={abteilungId} />
                    </Can>
                    <Can I='delete' this={{...record, abteilungId: abteilungId}}>
                       <Popconfirm
                            title={`Möchtest du ${record.name} wirklich löschen?`}
                            onConfirm={() => deleteMaterial(abteilungId, record)}
                            onCancel={() => { }}
                            okText='Ja'
                            cancelText='Nein'
                        >
                            <Button type='ghost' danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                    </Can>*/}
                </div>
            )
        }
    ];


    return <Table rowKey='id' columns={columns} dataSource={standort}/>;


}