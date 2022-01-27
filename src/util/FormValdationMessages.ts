const typeTemplate = "'${name}' ist kein gültiger ${type}";

export const validateMessages = {
    default: "Überprüfungsfehler im Feld '${name}'",
    required: "'${name}' ist erforderlich!",
    enum: "'${name}' muss einer der folgenden sein [${enum}]",
    whitespace: "'${name}' kann nicht leer sein",
    date: {
        format: "'${name}' ist für das Format Datum ungültig",
        parse: "'${name}' konnte nicht als Datum gelesen werden",
        invalid: "'${name}' ist ein ungültiges Datum",
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
        email: "Das ist keine gültige Emailadresse",
        url: typeTemplate,
        hex: typeTemplate,
    },
    string: {
        len: "'${name}' muss genau ${len} Zeichen betragen",
        min: "'${name}' muss mindestens ${min} Zeichen betragen",
        max: "'${name}' darf nicht länger als ${max} Zeichen sein",
        range: "'${name}' muss zwischen ${min} und ${max} Zeichen liegen",
    },
    number: {
        len: "'${name}' muss gleich ${len} sein",
        min: "'${name}' kann nicht kleiner sein als ${min}",
        max: "'${name}' kann nicht grösser sein als ${max}",
        range: "'${name}' muss zwischen ${min} und ${max} sein",
    },
    array: {
        len: "'${name}' muss genau ${len} lang sein",
        min: "'${name}' darf nicht kürzer als ${min} sein",
        max: "'${name}' darf nicht länger als ${max} sein",
        range: "'${name}' muss eine Länge zwischen ${min} und ${max} haben",
    },
    pattern: {
        mismatch: "'${name}' stimmt nicht mit Muster ${pattern} überein",
    },
};