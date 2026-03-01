import { Group } from './group.types';
import { UserData } from './user.type';

export interface ReturnReminderSettings {
    enabled: boolean
    daysAfterDelivery: number
}

export interface MaterialReminderSettings {
    enabled: boolean
    daysBeforeDue: number
    checkIntervalDays: number
}

export interface Abteilung {
    __caslSubjectType__ : 'Abteilung'
    id: string
    name: string
    slug: string
    ceviDBId?: string
    logoUrl?: string
    groups: { [id: string]: Group }
    email?: string
    searchVisible?: boolean
    returnReminder?: ReturnReminderSettings
    materialReminder?: MaterialReminderSettings
}


export interface AbteilungMember {
    __caslSubjectType__ : 'AbteilungMember'
    userId: string
    role: 'guest' | 'member' | 'matchef' | 'admin'
    approved: boolean
    banned?: boolean
    displayName?: string
    email?: string
    notifyOnNewOrder?: boolean
}

export interface AbteilungMemberUserData extends Omit<AbteilungMember, '__caslSubjectType__'>, Omit<UserData, '__caslSubjectType__'> {
}