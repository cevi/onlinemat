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
            key: 'name'
        },
        {
            title: 'Strasse',
            key: 'street'
        },
        {
            title: 'Ort',
            key: 'city'
        },
        {
            title: 'Koordinaten',
            key: 'coordinates'
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