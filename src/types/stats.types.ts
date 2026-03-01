import { Timestamp } from 'firebase/firestore';

export interface AbteilungStat {
    id: string;
    name: string;
    slug: string;
    memberCount: number;
    membersByRole: Record<string, number>;
    orderCount: number;
    ordersByStatus: Record<string, number>;
    lastOrderDate: Timestamp | null;
}

export interface ActiveUserStat {
    id: string;
    displayName: string;
    email: string;
    orderCount: number;
    lastLogin: Timestamp | null;
    abteilungCount: number;
}

export interface MonthlyOrderStat {
    month: string;
    count: number;
}

export interface DailyUserStat {
    date: string;
    newUsers: number;
    activeUsers: number;
}

export interface ReleaseNoteStat {
    id: string;
    title: string;
    createdAt: Timestamp;
    readCount: number;
}

export interface StatsData {
    generatedAt: Timestamp;
    totalUsers: number;
    totalAbteilungen: number;
    totalOrders: number;
    abteilungen: AbteilungStat[];
    activeUsers: ActiveUserStat[];
    ordersOverTime: MonthlyOrderStat[];
    releaseNoteStats: ReleaseNoteStat[];
    usersPerDay?: DailyUserStat[];
}
