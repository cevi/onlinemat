import { message } from 'antd';
import { ExcelJson } from 'types/excel.type';
import XLSX from 'xlsx'


export const excelToJson = async (e: React.ChangeEvent<HTMLInputElement>): Promise<ExcelJson | undefined> => {
    if(!e) return undefined;
    e.preventDefault();
    let excelData: ExcelJson | undefined;
    if (e.target.files) {
        const reader = new FileReader();
        return new Promise((resolve, reject) => {
            reader.onload = (e) => {
                if(!e.target) {
                    message.error('Leider ist ein Fehler beim lesen der Datei aufgetreten');
                    console.error('Leider ist ein Fehler beim lesen der Datei aufgetreten')
                    return;
                }
                const data = e.target.result;
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet, {
                    raw: true,
                    dateNF: 'DD.MM.YYYY',
                    header: 1,
                    defval: null,
                });
                console.log(json)
                resolve({
                    headers: json[0],
                    data: json.slice(1)
                } as ExcelJson)
            };
            const file = e.target.files;
            if(file !== null && file.length > 0) {
                reader.readAsArrayBuffer(file[0]);
            } else {
                reject()
            }
            
        })
        
    }
    return excelData;
}