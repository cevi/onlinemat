import { describe, it, expect } from 'vitest';
import { isSupportedSpreadsheetFile, SPREADSHEET_ACCEPT, SUPPORTED_SPREADSHEET_EXTENSIONS } from '../ExcelUtil';

describe('ExcelUtil - file type filter', () => {
  it('accepts Excel and CSV files regardless of case', () => {
    expect(isSupportedSpreadsheetFile('material.xlsx')).toBe(true);
    expect(isSupportedSpreadsheetFile('Material.XLSX')).toBe(true);
    expect(isSupportedSpreadsheetFile('old-export.xls')).toBe(true);
    expect(isSupportedSpreadsheetFile('liste.csv')).toBe(true);
  });

  it('rejects other file types and empty names', () => {
    expect(isSupportedSpreadsheetFile('material.pdf')).toBe(false);
    expect(isSupportedSpreadsheetFile('material.xlsx.exe')).toBe(false);
    expect(isSupportedSpreadsheetFile('xlsx')).toBe(false);
    expect(isSupportedSpreadsheetFile('')).toBe(false);
    expect(isSupportedSpreadsheetFile(undefined)).toBe(false);
    expect(isSupportedSpreadsheetFile(null)).toBe(false);
  });

  it('exposes an accept attribute covering all supported extensions and MIME types', () => {
    const parts = SPREADSHEET_ACCEPT.split(',');
    SUPPORTED_SPREADSHEET_EXTENSIONS.forEach(ext => expect(parts).toContain(ext));
    expect(parts).toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(parts).toContain('application/vnd.ms-excel');
    expect(parts).toContain('text/csv');
  });
});
