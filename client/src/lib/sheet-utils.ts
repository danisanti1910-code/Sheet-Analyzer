import { read, utils, WorkBook } from 'xlsx';

export type ColumnType = 'numeric' | 'categorical' | 'datetime' | 'boolean' | 'unknown';

export interface ColumnProfile {
  name: string;
  originalName: string;
  type: ColumnType;
  missingCount: number;
  missingPercentage: number;
  uniqueCount: number;
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  std?: number;
  topCategories?: { value: string; count: number }[];
}

export interface SheetData {
  fileName: string;
  sheetNames: string[];
  activeSheet: string;
  rows: any[];
  columns: string[];
  columnProfiles: Record<string, ColumnProfile>;
  rowCount: number;
}

export const parseSheet = async (file: File, headerMode: boolean = true): Promise<SheetData> => {
  const data = await file.arrayBuffer();
  const workbook = read(data);
  const sheetName = workbook.SheetNames[0];
  return processSheet(workbook, sheetName, file.name, headerMode);
};

export const processSheet = (workbook: WorkBook, sheetName: string, fileName: string, headerMode: boolean): SheetData => {
  const worksheet = workbook.Sheets[sheetName];
  
  const jsonData = utils.sheet_to_json(worksheet, { 
    header: headerMode ? undefined : 1,
    defval: null 
  });

  let rows: any[] = [];
  let columns: string[] = [];

  if (headerMode) {
    rows = jsonData;
    if (rows.length > 0) {
      columns = Object.keys(rows[0]);
    }
  } else {
    const rawData = jsonData as any[][];
    if (rawData.length > 0) {
      const maxCols = rawData.reduce((acc, row) => Math.max(acc, row.length), 0);
      columns = Array.from({ length: maxCols }, (_, i) => `Column_${i + 1}`);
      
      rows = rawData.map(row => {
        const obj: any = {};
        columns.forEach((col, i) => {
          obj[col] = row[i] !== undefined ? row[i] : null;
        });
        return obj;
      });
    }
  }

  const columnProfiles = profileColumns(rows, columns);

  return {
    fileName,
    sheetNames: workbook.SheetNames,
    activeSheet: sheetName,
    rows,
    columns,
    columnProfiles,
    rowCount: rows.length
  };
};

const profileColumns = (rows: any[], columns: string[]): Record<string, ColumnProfile> => {
  const profiles: Record<string, ColumnProfile> = {};

  columns.forEach(col => {
    const values = rows.map(r => r[col]);
    const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
    const missingCount = values.length - nonNullValues.length;
    
    let type: ColumnType = 'unknown';
    if (nonNullValues.length === 0) {
      type = 'unknown';
    } else {
      const isNumeric = nonNullValues.every(v => !isNaN(Number(v)) && v !== '');
      const isBoolean = nonNullValues.every(v => v === true || v === false || v === 'true' || v === 'false');
      const isDate = nonNullValues.every(v => !isNaN(Date.parse(v)) && isNaN(Number(v))); 
      
      if (isNumeric) type = 'numeric';
      else if (isBoolean) type = 'boolean';
      else if (isDate) type = 'datetime';
      else type = 'categorical';
    }

    const uniqueValues = new Set(nonNullValues);
    let stats: Partial<ColumnProfile> = {};
    
    if (type === 'numeric') {
      const nums = nonNullValues.map(v => Number(v)).sort((a, b) => a - b);
      const sum = nums.reduce((a, b) => a + b, 0);
      stats.min = nums[0];
      stats.max = nums[nums.length - 1];
      stats.mean = sum / nums.length;
      stats.median = nums[Math.floor(nums.length / 2)];
      const variance = nums.reduce((a, b) => a + Math.pow(b - (stats.mean || 0), 2), 0) / nums.length;
      stats.std = Math.sqrt(variance);
    }

    if (type === 'categorical' || type === 'boolean') {
      const counts: Record<string, number> = {};
      nonNullValues.forEach(v => {
        const key = String(v);
        counts[key] = (counts[key] || 0) + 1;
      });
      stats.topCategories = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([value, count]) => ({ value, count }));
    }

    profiles[col] = {
      name: col,
      originalName: col,
      type,
      missingCount,
      missingPercentage: (missingCount / rows.length) * 100,
      uniqueCount: uniqueValues.size,
      ...stats
    };
  });

  return profiles;
};
