import { message } from "antd";
import { abteilungenCollection, abteilungenMaterialsCollection, abteilungenOrdersCollection } from "config/firebase/collections";
import { firestore } from "config/firebase/firebase";
import { useUser } from "hooks/use-user";
import moment from "moment";
import { DamagedMaterial, Material } from "types/material.types";
import { Order } from "types/order.types";


export const getStatusName = (status: Order['status'] | undefined): string => {
    if(!status) return 'Lade...';

    switch(status) {
        case 'created':
            return 'Erstellt';
        case 'delivered':
            return 'Ausgegeben';
        case 'completed':
            return 'Abgeschlossen';
        case 'completed-damaged':
            return 'Abgeschlossen Verlust/Schaden';
    }

    return 'Unbekannt';
}

export const getStatusColor = (status: Order['status'] | undefined): string | undefined => {
    if(!status) return undefined;
    switch(status) {
        case 'created':
            return 'cyan';
        case 'delivered':
            return 'blue';
        case 'completed':
            return 'green';
        case 'completed-damaged':
            return 'volcano';
    }

    return undefined
}

export const deliverOrder = async (abteilungId: string, order: Order, userName: string): Promise<boolean> => {
    try {
        
        const orderRef = firestore().collection(abteilungenCollection).doc(abteilungId).collection(abteilungenOrdersCollection).doc(order.id);

        const orderHistory = order.history || [];

        orderHistory.push({
            timestamp: moment().toDate(),
            text: `${userName} hat die Bestellung ausgegeben.`,
            color: 'green',
            type: 'delivered'
        })

        await orderRef.update({
            status: 'delivered',
            history: orderHistory,
        } as Order)
        message.success('Bestellung erfolgreich ausgegeben.')
        return true;
    } catch(ex) {
        message.error(`Es ist ein Fehler aufgetreten ${ex}`)
    }
    return false;

}

export const completeOrder = async (abteilungId: string, order: Order, userName: string): Promise<boolean> => {
    try {
        
        const orderRef = firestore().collection(abteilungenCollection).doc(abteilungId).collection(abteilungenOrdersCollection).doc(order.id);

        const orderHistory = order.history || [];

        orderHistory.push({
            timestamp: moment().toDate(),
            text: `${userName} hat die Bestellung abgeschlossen.`,
            color: 'green',
            type: 'completed'
        })

        await orderRef.update({
            status: 'completed',
            history: orderHistory,
        } as Order)
        message.success('Bestellung erfolgreich abgeschlossen.')
        return true;
    } catch(ex) {
        message.error(`Es ist ein Fehler aufgetreten ${ex}`)
    }
    return false;

}

export const resetOrder = async (abteilungId: string, order: Order, userName: string): Promise<boolean> => {
    try {
        
        const orderRef = firestore().collection(abteilungenCollection).doc(abteilungId).collection(abteilungenOrdersCollection).doc(order.id);

        const orderHistory = order.history || [];

        orderHistory.push({
            timestamp: moment().toDate(),
            text: `${userName} hat die Bestellung zurückgesetzt.`,
            color: 'gray',
            type: 'reset'
        })

        await orderRef.update({
            status: 'created',
            history: orderHistory,
        } as Order)
        message.success('Bestellung erfolgreich zurückgesetzt.')
        return true;
    } catch(ex) {
        message.error(`Es ist ein Fehler aufgetreten ${ex}`)
    }
    return false;

}

export const completeLostOrder = async (abteilungId: string, order: Order, userName: string, damagedMaterial: DamagedMaterial[], materials: Material[]): Promise<boolean> => {
    try {

        //updateMaterial
        const promises = damagedMaterial.map(material => {
            const matRef = firestore().collection(abteilungenCollection).doc(abteilungId).collection(abteilungenMaterialsCollection).doc(material.id);
            const currentMat = materials.find(m => m.id === material.id);
            if(!currentMat) return new Promise<void>((resolve,reject)=> reject('Konnte kein Promise zurückgeben'));
            let toUpdate = undefined;
            if(material.type === 'damaged') {
                toUpdate = {
                    damaged: (currentMat.damaged || 0) + material.count
                } as Material
            }
            if(material.type === 'lost') {
                toUpdate = {
                    lost: (currentMat.lost || 0) + material.count
                } as Material
            }
            if(!toUpdate) return new Promise<void>((resolve,reject)=> reject('Konnte kein Promise zurückgeben'));
            return matRef.update(toUpdate)

        })

        //update mat
        await Promise.all(promises);

        //save order
        const orderRef = firestore().collection(abteilungenCollection).doc(abteilungId).collection(abteilungenOrdersCollection).doc(order.id);

        const orderHistory = order.history || [];

        orderHistory.push({
            timestamp: moment().toDate(),
            text: `${userName} hat die Bestellung teilweise abgeschlossen.`,
            color: 'red',
            type: 'completed-damaged'
        })

        await orderRef.update({
            status: 'completed-damaged',
            history: orderHistory,
        } as Order)
        message.success('Bestellung erfolgreich mit Verlust/Schaden abgeschlossen.')
        return true;
    } catch(ex) {
        message.error(`Es ist ein Fehler aufgetreten ${ex}`)
    }
    return false;

}

export const addCommentOrder = async (abteilungId: string, order: Order, comment: string | undefined, userName: string): Promise<boolean> => {
    try {
        if(order.matchefComment === comment) return true;
        const orderRef = firestore().collection(abteilungenCollection).doc(abteilungId).collection(abteilungenOrdersCollection).doc(order.id);

        const orderHistory = order.history || [];

        if(comment) {
            //added comment
            orderHistory.push({
                timestamp: moment().toDate(),
                text: `${userName} hat eine Bemerkung hinzugefügt.`,
                type: 'matchefComment',
                color: 'red',
            })
        } else {
            //removed comment
            orderHistory.push({
                timestamp: moment().toDate(),
                text: `${userName} hat eine Bemerkung entfernt.`,
                type: 'matchefComment',
                color: 'grey'
            })
        }

        const newComment =  comment ? comment : null;

        await orderRef.update({
            matchefComment: newComment,
            history: orderHistory,
        } as Order)
        message.success('Bestellung erfolgreich kommentiert.')
        return true;
    } catch(ex) {
        message.error(`Es ist ein Fehler aufgetreten ${ex}`)
    }
    return false;

}