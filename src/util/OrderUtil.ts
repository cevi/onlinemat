import { message } from "antd";
import { abteilungenCollection, abteilungenOrdersCollection } from "config/firebase/collections";
import { firestore } from "config/firebase/firebase";
import { useUser } from "hooks/use-user";
import moment from "moment";
import { Order } from "types/order.types";


export const getStatusName = (status: string | undefined): string => {
    if(!status) return 'Lade...';

    switch(status) {
        case 'created':
            return 'Erstellt';
        case 'delivered':
            return 'Ausgegeben';
        case 'completed':
            return 'Abgeschlossen';
    }

    return 'Unbekannt';
}

export const getStatusColor = (status: string | undefined): string | undefined => {
    if(!status) return undefined;
    switch(status) {
        case 'created':
            return 'cyan';
        case 'delivered':
            return 'blue';
        case 'completed':
            return 'green';
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