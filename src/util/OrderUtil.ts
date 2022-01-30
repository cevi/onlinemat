

export const getStatusName = (status: string): string => {

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

export const getStatusColor = (status: string): string | undefined => {
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