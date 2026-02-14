import { message } from 'antd';

export async function firestoreOperation<T = void>(
    operation: () => Promise<T>,
    successMessage?: string,
): Promise<T | undefined> {
    try {
        const result = await operation();
        if (successMessage) {
            message.success(successMessage);
        }
        return result;
    } catch (ex) {
        message.error(`Es ist ein Fehler aufgetreten: ${ex}`);
        console.error('Es ist ein Fehler aufgetreten', ex);
        return undefined;
    }
}
