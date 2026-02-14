import { message } from "antd";
import { abteilungenCollection, abteilungenMaterialsCollection, abteilungenOrdersCollection } from "config/firebase/collections";
import { db } from "config/firebase/firebase";
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { UserState } from "config/redux/user/user";
import dayjs from "dayjs";
import { Abteilung } from "types/abteilung.type";
import { DamagedMaterial, DamagedMaterialDetails, Material } from "types/material.types";
import { Order } from "types/order.types";
import { firestoreOperation } from "./firestoreOperation";


export const getStatusName = (order: Order | undefined): string => {
    if (!order) return 'Lade...';

    switch (order.status) {
        case 'created':
            return 'Erstellt';
        case 'delivered':
            return 'Ausgegeben';
        case 'completed':
            if ((order.damagedMaterial || []).length > 0) {
                return 'Abgeschlossen Verlust/Schaden';
            }
            return 'Abgeschlossen';
    }

    return 'Unbekannt';
}

export const getStatusColor = (order: Order | undefined): string | undefined => {
    if (!order) return undefined;
    switch (order.status) {
        case 'created':
            return 'cyan';
        case 'delivered':
            return 'blue';
        case 'completed':
            if ((order.damagedMaterial || []).length > 0) {
                return 'volcano';
            }
            return 'green';
    }

    return undefined
}

export const deliverOrder = async (abteilungId: string, order: Order, userName: string): Promise<boolean> => {
    const result = await firestoreOperation(async () => {
        const orderRef = doc(db, abteilungenCollection, abteilungId, abteilungenOrdersCollection, order.id);
        const orderHistory = order.history || [];
        orderHistory.push({
            timestamp: dayjs().toDate(),
            text: `${userName} hat die Bestellung ausgegeben.`,
            color: 'green',
            type: 'delivered'
        });
        await updateDoc(orderRef, {
            status: 'delivered',
            history: orderHistory,
        } as Order);
        return true;
    }, 'Bestellung erfolgreich ausgegeben.');
    return result ?? false;
}

export const completeOrder = async (abteilungId: string, order: Order, userName: string): Promise<boolean> => {
    const result = await firestoreOperation(async () => {
        const orderRef = doc(db, abteilungenCollection, abteilungId, abteilungenOrdersCollection, order.id);
        const orderHistory = order.history || [];
        orderHistory.push({
            timestamp: dayjs().toDate(),
            text: `${userName} hat die Bestellung abgeschlossen.`,
            color: 'green',
            type: 'completed'
        });
        await updateDoc(orderRef, {
            status: 'completed',
            history: orderHistory,
        } as Order);
        return true;
    }, 'Bestellung erfolgreich abgeschlossen.');
    return result ?? false;
}

export const resetOrder = async (abteilungId: string, order: Order, userName: string): Promise<boolean> => {
    const result = await firestoreOperation(async () => {
        const orderRef = doc(db, abteilungenCollection, abteilungId, abteilungenOrdersCollection, order.id);
        const orderHistory = order.history || [];
        orderHistory.push({
            timestamp: dayjs().toDate(),
            text: `${userName} hat die Bestellung zurückgesetzt.`,
            color: 'gray',
            type: 'reset'
        });
        await updateDoc(orderRef, {
            status: 'created',
            history: orderHistory,
            damagedMaterial: order.damagedMaterial
        } as Order);
        return true;
    }, 'Bestellung erfolgreich zurückgesetzt.');
    return result ?? false;
}

export const resetLostOrder = async (abteilungId: string, order: Order, userName: string, materials: Material[]): Promise<boolean> => {
    const result = await firestoreOperation(async () => {
        if (order.damagedMaterial) {
            await updateMaterialLostDamage(abteilungId, order.damagedMaterial, materials, 'unset');
        }
        const slimOrder = {
            ...order,
            damagedMaterial: null
        } as Order;
        return await resetOrder(abteilungId, slimOrder, userName);
    });
    return result ?? false;
}

export const completeLostOrder = async (abteilungId: string, order: Order, userName: string, damagedMaterial: (DamagedMaterialDetails | DamagedMaterial)[], materials: Material[]): Promise<boolean> => {
    const result = await firestoreOperation(async () => {
        await updateMaterialLostDamage(abteilungId, damagedMaterial, materials, 'set');

        const orderRef = doc(db, abteilungenCollection, abteilungId, abteilungenOrdersCollection, order.id);
        const orderHistory = order.history || [];

        const slimDamagedMaterial = damagedMaterial.map(mat => ({
            id: mat.id,
            count: mat.count,
            type: mat.type
        } as DamagedMaterial));

        orderHistory.push({
            timestamp: dayjs().toDate(),
            text: `${userName} hat die Bestellung mit Verlust/Schaden abgeschlossen.`,
            color: 'red',
            type: 'completed-damaged'
        });

        await updateDoc(orderRef, {
            status: 'completed',
            history: orderHistory,
            damagedMaterial: slimDamagedMaterial
        } as Order);
        return true;
    }, 'Bestellung erfolgreich mit Verlust/Schaden abgeschlossen.');
    return result ?? false;
}

export const addCommentOrder = async (abteilungId: string, order: Order, comment: string | undefined, userName: string): Promise<boolean> => {
    if (order.matchefComment === comment) return true;
    const result = await firestoreOperation(async () => {
        const orderRef = doc(db, abteilungenCollection, abteilungId, abteilungenOrdersCollection, order.id);
        const orderHistory = order.history || [];

        if (comment) {
            orderHistory.push({
                timestamp: dayjs().toDate(),
                text: `${userName} hat eine Bemerkung hinzugefügt.`,
                type: 'matchefComment',
                color: 'red',
            });
        } else {
            orderHistory.push({
                timestamp: dayjs().toDate(),
                text: `${userName} hat eine Bemerkung entfernt.`,
                type: 'matchefComment',
                color: 'grey'
            });
        }

        const newComment = comment ? comment : null;
        await updateDoc(orderRef, {
            matchefComment: newComment,
            history: orderHistory,
        } as Order);
        return true;
    }, 'Bestellung erfolgreich kommentiert.');
    return result ?? false;
}

export const deleteOrder = async (abteilung: Abteilung, order: Order, materials: Material[], user: UserState): Promise<boolean> => {
    if (order.status === 'delivered') {
        message.error(`Bestellung kann nicht gelöscht werden, wenn sie ${getStatusName(order)} ist.`);
        return false;
    }
    if (!user || !user.appUser || !user.appUser.userData) return false;
    const roles = user.appUser.userData.roles || {};
    const isStaff = user.appUser.userData.staff ? user.appUser.userData.staff : false;

    if (!(abteilung.id in roles) && !isStaff) {
        message.error(`Du hast keine Berchtigungen für diese Bestellung.`);
        return false;
    }

    const role = roles[abteilung.id];

    if(role !== 'admin' && role !== 'matchef' && !isStaff && order.orderer !== user.appUser.userData.id) {
        message.error(`Nur der Ersteller kann die Bestellung löschen.`);
        return false;
    }

    if (order.status === 'completed') {
        if (role !== 'admin' && role !== 'matchef' && !isStaff) {
            message.error(`Du kannst eine abgeschlossene Bestellung nicht löschen.`);
            return false;
        }
    }

    const result = await firestoreOperation(async () => {
        if (order.damagedMaterial) {
            await updateMaterialLostDamage(abteilung.id, order.damagedMaterial, materials, 'unset');
        }
        await deleteDoc(doc(db, abteilungenCollection, abteilung.id, abteilungenOrdersCollection, order.id));
        return true;
    }, 'Die Bestellung wurde erfolgreich gelöscht.');
    return result ?? false;
}

export const updateMaterialLostDamage = async (abteilungId: string, damagedMaterial: DamagedMaterial[], materials: Material[], operator: 'set' | 'unset'): Promise<boolean> => {
    const result = await firestoreOperation(async () => {
        const promises = damagedMaterial.map(material => {
            const matRef = doc(db, abteilungenCollection, abteilungId, abteilungenMaterialsCollection, material.id);
            const currentMat = materials.find(m => m.id === material.id);
            if (!currentMat) return new Promise<void>((resolve, reject) => reject('Konnte kein Promise zurückgeben'));
            let toUpdate = undefined;
            if (material.type === 'damaged') {
                let val = (currentMat.damaged || 0) - material.count;
                if (operator === 'set') {
                    val = (currentMat.damaged || 0) + material.count;
                }
                toUpdate = {
                    damaged: val <= 0 ? 0 : val
                } as Material;
            }
            if (material.type === 'lost') {
                let val = (currentMat.lost || 0) - material.count;
                if (operator === 'set') {
                    val = (currentMat.lost || 0) + material.count;
                }
                toUpdate = {
                    lost: val <= 0 ? 0 : val
                } as Material;
            }
            if (!toUpdate) return new Promise<void>((resolve, reject) => reject('Konnte kein Promise zurückgeben'));
            return updateDoc(matRef, toUpdate);
        });

        await Promise.all(promises);
        return true;
    });
    return result ?? false;
}


export const calculateTotalWeight = (order: Order, materials: Material[]) => {
    let totalWeight = 0;
    let incompleteCount = 0;
    order.items.forEach(item => {
        const mat = materials.find(material => material.id === item.matId);
        if(!mat) return;

        if(mat.weightInKg) {
            totalWeight += item.count * mat.weightInKg;
        } else {
            incompleteCount++;
        }
    })

    return {
        totalWeight,
        incompleteCount
    }

}
