import {Button, Popconfirm, Table} from 'antd';
import {Standort} from "types/standort.types";
import { Can } from 'config/casl/casl';
import {EditStandortButton} from "./EditStandort";
import {DeleteOutlined} from "@ant-design/icons";
import {deleteStandort} from "../../util/StandortUtil";
import type {TableColumnsType} from "antd";

export interface StandortTableProps {
    abteilungId: string
    standort: Standort[]
}


export const StandortTable = (props: StandortTableProps) => {

    const { abteilungId, standort } = props;

    const columns: TableColumnsType<Standort> = [
        {
            title: 'Name',
            key: 'name',
            dataIndex: 'name'
        },
        {
            title: 'Strasse',
            key: 'street',
            dataIndex: 'street',
            responsive: ['md']
        },
        {
            title: 'Ort',
            key: 'city',
            dataIndex: 'city',
            responsive: ['md']
        },
        {
            title: 'Koordinaten',
            key: 'coordinates',
            dataIndex: 'coordinates',
            responsive: ['md']
        },
        {
            title: 'Bearbeiten',
            key: 'edit',
            width: '10%',
            render: (text: string, record: Standort) => (
                <div style={{display: 'flex', justifyContent: 'space-evenly'}}>
                    <Can I='update' this={{...record, abteilungId: abteilungId}}>
                        <EditStandortButton standort={record} standortId={record.id} abteilungId={abteilungId} />
                    </Can>
                    <Can I='delete' this={{...record, abteilungId: abteilungId}}>
                       <Popconfirm
                            title={`Möchtest du ${record.name} wirklich löschen?`}
                            onConfirm={() => deleteStandort(abteilungId, record)}
                            onCancel={() => { }}
                            okText='Ja'
                            cancelText='Nein'
                        >
                            <Button type='ghost' danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                    </Can>
                </div>
            )
        }
    ];

    return <Table rowKey='id' columns={columns} dataSource={standort}/>;


}