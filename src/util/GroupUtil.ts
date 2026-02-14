import { Timestamp } from "firebase/firestore";
import { Abteilung } from "types/abteilung.type";
import { Group } from "types/group.types";


export const groupObjToList = (groups: Abteilung['groups']): Group[] => {
    if(!groups || groups === null) return [];
    const list: Group[] = [];
    Object.keys(groups).forEach(key => {
        list.push({
            ...groups[key],
            id: key
        });
    })
    return list;
}

export const setGroupDates = (groups: Abteilung['groups']) => {
    if(!groups || groups === null) return groups;
    Object.keys(groups).forEach(key => {
        const dateRaw = groups[key].createdAt as unknown as Timestamp;
        groups[key].createdAt = dateRaw.toDate();
    })

    return groups
}