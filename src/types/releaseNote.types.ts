import { Dayjs } from 'dayjs';

export interface ReleaseNote {
    id: string
    title: string
    content: string
    createdAt: Dayjs
    updatedAt: Dayjs
    createdBy: string
    published: boolean
}
