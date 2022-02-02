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