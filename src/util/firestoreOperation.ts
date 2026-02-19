import { message } from 'antd';
import i18n from 'config/i18n/i18n';

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
        message.error(i18n.t('common:errors.generic', { error: String(ex) }));
        console.error('Error occurred', ex);
        return undefined;
    }
}
