import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import appStyles from 'styles.module.scss';
import { Table, PageHeader, Spin } from 'antd';
import { useAuth0 } from '@auth0/auth0-react';
import { firestore } from 'config/firebase/firebase';
import { abteilungenCollection, abteilungenMaterialsCollection } from 'config/firebase/collections';
import { AbteilungCard } from 'components/abteilung/AbteilungCard';
import { AddAbteilung } from 'components/abteilung/AddAbteilung';
import { Material } from 'types/material.types';
import { useParams } from 'react-router';
import { AddMaterial } from 'components/material/AddMaterial';

export type AbteilungMaterialViewParams = {
    abteilungId: string;
  };

export const AbteilungMaterialView = () => {
    const { user, isAuthenticated } = useAuth0();

    const { abteilungId } = useParams<AbteilungMaterialViewParams>();

    const [loading, setLoading] = useState(false);

    const [material, setMaterial] = useState<Material[]>([]);

    useEffect(() => {
        setLoading(true);
        return firestore().collection(abteilungenCollection).doc(abteilungId).collection(abteilungenMaterialsCollection).onSnapshot(snap => {
            setLoading(false);
            const materialLoaded = snap.docs.flatMap(doc => {
                return {
                    ...doc.data() as Material,
                    id: doc.id
                } as any;
            });
            setMaterial(materialLoaded);
        });
    }, [isAuthenticated]);

    const columns = [
        {
          title: 'Name',
          dataIndex: 'name',
          key: 'name'
        },
        {
          title: 'Bemerkung',
          dataIndex: 'comment',
          key: 'comment'
        },
        {
          title: 'Kategorie',
          dataIndex: 'categoryId',
          key: 'categoryId'
        },
        {
          title: 'Gewicht',
          key: 'weightInKg',
          dataIndex: 'weightInKg'
        },
        {
          title: 'Anzahl',
          key: 'count',
          render: (text: string, record: Material) => (
           <p key={`${record.id}_count`}>{record.consumables ? 'Unbegrenzt' : record.count}</p>
          )
        },
      ];


    return <div className={classNames(appStyles['flex-grower'])}>
        <PageHeader title='Abteilungen'></PageHeader>



        <div className={classNames(appStyles['flex-grower'])} style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'stretch' }}>
            <AddMaterial abteilungId={abteilungId}/>
                {
                    loading ?
                        <Spin />
                        :
                        <Table columns={columns} dataSource={material.sort((a, b) => a.name.normalize().localeCompare(b.name.normalize()))} />
                }
        </div>
    </div>
}
