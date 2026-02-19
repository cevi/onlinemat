import i18n from 'config/i18n/i18n';

export const getValidateMessages = () => {
    const typeTemplate = i18n.t('validation:types.string');

    return {
        default: i18n.t('validation:default'),
        required: i18n.t('validation:required'),
        enum: i18n.t('validation:enum'),
        whitespace: i18n.t('validation:whitespace'),
        date: {
            format: i18n.t('validation:date.format'),
            parse: i18n.t('validation:date.parse'),
            invalid: i18n.t('validation:date.invalid'),
        },
        types: {
            string: typeTemplate,
            method: typeTemplate,
            array: typeTemplate,
            object: typeTemplate,
            number: typeTemplate,
            date: typeTemplate,
            boolean: typeTemplate,
            integer: typeTemplate,
            float: typeTemplate,
            regexp: typeTemplate,
            email: i18n.t('validation:types.email'),
            url: typeTemplate,
            hex: typeTemplate,
        },
        string: {
            len: i18n.t('validation:string.len'),
            min: i18n.t('validation:string.min'),
            max: i18n.t('validation:string.max'),
            range: i18n.t('validation:string.range'),
        },
        number: {
            len: i18n.t('validation:number.len'),
            min: i18n.t('validation:number.min'),
            max: i18n.t('validation:number.max'),
            range: i18n.t('validation:number.range'),
        },
        array: {
            len: i18n.t('validation:array.len'),
            min: i18n.t('validation:array.min'),
            max: i18n.t('validation:array.max'),
            range: i18n.t('validation:array.range'),
        },
        pattern: {
            mismatch: i18n.t('validation:pattern.mismatch'),
        },
    };
};
