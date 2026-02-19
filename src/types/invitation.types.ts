export interface Invitation {
    __caslSubjectType__: 'Invitation';
    id: string;
    email: string;
    role: 'guest' | 'member' | 'matchef' | 'admin';
    groupIds: string[];
    status: 'pending' | 'accepted';
    invitedBy: string;
    invitedAt: Date;
    acceptedAt?: Date;
    acceptedByUserId?: string;
}
