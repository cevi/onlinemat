

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