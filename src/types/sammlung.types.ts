export interface SammlungItem {
    matId: string;
    count: number;
}

export interface Sammlung {
    __caslSubjectType__: 'Sammlung';
    id: string;
    name: string;
    description?: string;
    imageUrls?: string[];
    items: SammlungItem[];
}
