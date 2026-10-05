import * as XLSX from 'xlsx';
import { smartColumnMapper, ColumnMappingResult } from './mapper';
import { classifyTestCategory } from './test-classifier';

export interface ParsedPatientRecord {
  rowNumber: number;
  orderDate: string; // YYYY-MM-DD
  patientName: string;
  gender: 'L' | 'P';
  age: number;
  ageUnit: string; // 'Th' | 'Bl' | 'Hr'
  medicalRecordNumber: string;
  registrationNumber?: string;
  tests: Array<{ name: string; category: string }>;
  originUnit: string;
  unitType: 'RAWAT_JALAN' | 'RAWAT_INAP' | 'IGD';
  guarantor: string;
  doctorName?: string;
  tatMinutes?: number;
  sampleTakenDatetime?: string;
  resultCompletedDatetime?: string;
  rawRecord: Record<string, any>;
  validationErrors: string[];
}

export interface WorkbookPreview {
  sheets: string[];
  activeSheet: string;
  totalRows: number;
  headers: string[];
  mapping: ColumnMappingResult;
  sampleRecords: ParsedPatientRecord[];
}

export class ExcelParser {
  public previewWorkbook(filePath: string, sheetName?: string): WorkbookPreview {
    const workbook = XLSX.readFile(filePath, { cellDates: true });
    const sheets = workbook.SheetNames;
    const active = sheetName && sheets.includes(sheetName) ? sheetName : sheets[0];
    const worksheet = workbook.Sheets[active];

    const rawData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
    if (!rawData || rawData.length === 0) {
      throw new Error('File tidak memiliki data atau lembar kerja kosong.');
    }

    // Check for hierarchical SIMRS format
    if (this.isHierarchicalSIMRSFormat(rawData)) {
      const allRecords = this.parseHierarchicalSIMRSRows(rawData);
      const headers = ['TANGGAL PEMERIKSAAN', 'NO. REKAM MEDIS', 'NAMA PASIEN', 'RUANGAN / UNIT', 'PENJAMIN', 'PEMERIKSAAN'];
      const mapped: Record<string, string> = {
        'TANGGAL PEMERIKSAAN': 'order_date',
        'NO. REKAM MEDIS': 'medical_record_number',
        'NAMA PASIEN': 'patient_name',
        'RUANGAN / UNIT': 'origin_unit',
        'PENJAMIN': 'guarantor',
        'PEMERIKSAAN': 'examinations'
      };

      return {
        sheets,
        activeSheet: active,
        totalRows: allRecords.length,
        headers,
        mapping: {
          mapped,
          unmapped: [],
          confidence: {
            'TANGGAL PEMERIKSAAN': 1.0,
            'NO. REKAM MEDIS': 1.0,
            'NAMA PASIEN': 1.0,
            'RUANGAN / UNIT': 1.0,
            'PENJAMIN': 1.0,
            'PEMERIKSAAN': 1.0
          }
        },
        sampleRecords: allRecords.slice(0, 10)
      };
    }

    // Detect header row for standard flat tabular workbooks
    const headerRowIdx = this.findHeaderRowIndex(rawData);
    const headers = (rawData[headerRowIdx] || []).map((h: any) => String(h || '').trim()).filter(Boolean);

    // Read objects from detected header row
    const jsonRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
      range: headerRowIdx,
      raw: false
    });

    const parsedRows = this.transformRows(jsonRows);

    return {
      sheets,
      activeSheet: active,
      totalRows: jsonRows.length,
      headers,
      mapping: { mapped: {}, unmapped: [], confidence: {} }, // Will be resolved dynamically
      sampleRecords: parsedRows.slice(0, 10)
    };
  }

  public parseFile(filePath: string, customMapping?: Record<string, string>, sheetName?: string): ParsedPatientRecord[] {
    const workbook = XLSX.readFile(filePath, { cellDates: true });
    const active = sheetName && workbook.SheetNames.includes(sheetName) ? sheetName : workbook.SheetNames[0];
    const worksheet = workbook.Sheets[active];

    const rawData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
    if (!rawData || rawData.length === 0) {
      return [];
    }

    if (this.isHierarchicalSIMRSFormat(rawData)) {
      return this.parseHierarchicalSIMRSRows(rawData);
    }

    const headerRowIdx = this.findHeaderRowIndex(rawData);

    const jsonRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
      range: headerRowIdx,
      raw: false
    });

    return this.transformRows(jsonRows, customMapping);
  }

  private findHeaderRowIndex(rows: any[][]): number {
    for (let i = 0; i < Math.min(10, rows.length); i++) {
      const rowStr = rows[i].map(c => String(c || '').toLowerCase()).join(' ');
      if (
        (rowStr.includes('nama') || rowStr.includes('periksa')) &&
        (rowStr.includes('pemeriksaan') || rowStr.includes('asal') || rowStr.includes('tgl'))
      ) {
        return i;
      }
    }
    return 0;
  }

  public transformRows(rows: Record<string, any>[], customMapping?: Record<string, string>): ParsedPatientRecord[] {
    return rows.map((row, index) => {
      const errors: string[] = [];
      const rowNumber = index + 1;

      // Map keys
      const getVal = (canonicalKey: string): string => {
        if (customMapping) {
          for (const [origKey, mappedKey] of Object.entries(customMapping)) {
            if (mappedKey === canonicalKey && row[origKey] !== undefined) {
              return String(row[origKey]).trim();
            }
          }
        }
        for (const [k, v] of Object.entries(row)) {
          const lk = k.toLowerCase().trim();
          if (canonicalKey === 'order_date' && (lk.includes('tgl') || lk.includes('date'))) return String(v).trim();
          if (canonicalKey === 'patient_name' && lk.includes('nama')) return String(v).trim();
          if (canonicalKey === 'gender_male_age' && lk === 'l') return String(v).trim();
          if (canonicalKey === 'gender_female_age' && lk === 'p') return String(v).trim();
          if (canonicalKey === 'gender' && (lk.includes('jk') || lk.includes('gender') || lk.includes('sex'))) return String(v).trim();
          if (canonicalKey === 'age' && (lk.includes('umur') || lk.includes('usia') || lk.includes('age'))) return String(v).trim();
          if (canonicalKey === 'medical_record_number' && (lk.includes('rm') || lk.includes('rekam'))) return String(v).trim();
          if (canonicalKey === 'examinations' && (lk.includes('pemeriksaan') || lk.includes('tindakan'))) return String(v).trim();
          if (canonicalKey === 'origin_unit' && (lk.includes('asal') || lk.includes('ruangan') || lk.includes('poli') || lk.includes('unit'))) return String(v).trim();
          if (canonicalKey === 'guarantor' && (lk.includes('penjamin') || lk.includes('jaminan') || lk.includes('bayar'))) return String(v).trim();
          if (canonicalKey === 'doctor_name' && (lk.includes('dokter') || lk.includes('dpjp'))) return String(v).trim();
        }
        return '';
      };

      // 1. Order Date
      const rawDate = getVal('order_date');
      const orderDate = this.parseDate(rawDate);
      if (!orderDate) {
        errors.push(`Format tanggal tidak valid: "${rawDate}"`);
      }

      // 2. Patient Name
      const patientName = getVal('patient_name');
      if (!patientName) {
        errors.push('Nama pasien tidak boleh kosong.');
      }

      // 3. Gender & Age
      let gender: 'L' | 'P' = 'L';
      let age = 0;
      let ageUnit = 'Th';

      const maleCol = getVal('gender_male_age');
      const femaleCol = getVal('gender_female_age');

      if (maleCol) {
        gender = 'L';
        const parsedAge = this.parseAge(maleCol);
        age = parsedAge.age;
        ageUnit = parsedAge.unit;
      } else if (femaleCol) {
        gender = 'P';
        const parsedAge = this.parseAge(femaleCol);
        age = parsedAge.age;
        ageUnit = parsedAge.unit;
      } else {
        const genVal = getVal('gender').toUpperCase();
        if (genVal.startsWith('P') || genVal.includes('FEMALE') || genVal.includes('WANITA')) {
          gender = 'P';
        }
        const ageVal = getVal('age');
        if (ageVal) {
          const parsedAge = this.parseAge(ageVal);
          age = parsedAge.age;
          ageUnit = parsedAge.unit;
        }
      }

      // 4. Medical Record Number
      let mrn = getVal('medical_record_number');
      if (!mrn) {
        // Auto-generate standard deterministic MRN based on patient name hash
        mrn = `RM-${Math.abs(this.hashCode(patientName)).toString().padStart(6, '0')}`;
      }

      // 5. Examinations
      const rawExams = getVal('examinations');
      const testNames = rawExams
        .split(/[,;\n]+/)
        .map(t => t.trim())
        .filter(t => t.length > 0 && t !== '-' && t !== '.');

      if (testNames.length === 0) {
        errors.push('Pemeriksaan tidak boleh kosong.');
      }

      const tests = testNames.map(t => ({
        name: t,
        category: classifyTestCategory(t)
      }));

      // 6. Origin Unit & Unit Type
      const originUnit = getVal('origin_unit') || 'POLI UMUM';
      const unitType = this.resolveUnitType(originUnit);

      // 7. Guarantor
      let guarantor = getVal('guarantor').toUpperCase();
      if (!guarantor || guarantor.includes('UMUM') || guarantor.includes('MANDIRI')) {
        guarantor = 'UMUM';
      } else if (guarantor.includes('BPJS') && guarantor.includes('TK')) {
        guarantor = 'BPJS TK';
      } else if (guarantor.includes('BPJS')) {
        guarantor = 'BPJS KESEHATAN';
      } else if (guarantor.includes('JASA') || guarantor.includes('RAHARJA')) {
        guarantor = 'JASA RAHARJA';
      } else if (guarantor.includes('KARYAWAN')) {
        guarantor = 'KARYAWAN';
      } else {
        guarantor = 'UMUM';
      }

      // Optional TAT Minutes
      const rawTat = getVal('tat_minutes');
      let tatMinutes: number | undefined = undefined;
      if (rawTat && !isNaN(parseFloat(rawTat))) {
        tatMinutes = parseFloat(rawTat);
      }

      return {
        rowNumber,
        orderDate: orderDate || '2025-01-01',
        patientName: patientName || 'Pasien Tanpa Nama',
        gender,
        age,
        ageUnit,
        medicalRecordNumber: mrn,
        tests,
        originUnit,
        unitType,
        guarantor,
        doctorName: getVal('doctor_name') || undefined,
        tatMinutes,
        rawRecord: row,
        validationErrors: errors
      };
    });
  }

  private parseDate(val: string): string | null {
    if (!val) return null;
    const trimmed = val.trim();

    // Check DD/MM/YYYY or DD-MM-YYYY
    const dmy = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmy) {
      const day = dmy[1].padStart(2, '0');
      const month = dmy[2].padStart(2, '0');
      const year = dmy[3];
      return `${year}-${month}-${day}`;
    }

    // Check YYYY-MM-DD
    const ymd = trimmed.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
    if (ymd) {
      const year = ymd[1];
      const month = ymd[2].padStart(2, '0');
      const day = ymd[3].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    // Standard JavaScript Date parsing
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }

    return null;
  }

  private parseAge(val: string): { age: number; unit: string } {
    if (!val) return { age: 0, unit: 'Th' };
    const clean = val.trim();
    const match = clean.match(/^(\d+)\s*(th|bl|hr|tahun|bulan|hari)?/i);
    if (match) {
      const num = parseInt(match[1], 10);
      let unit = 'Th';
      const rawUnit = (match[2] || '').toLowerCase();
      if (rawUnit.startsWith('bl')) unit = 'Bl';
      else if (rawUnit.startsWith('hr')) unit = 'Hr';
      return { age: num, unit };
    }
    return { age: parseInt(clean, 10) || 0, unit: 'Th' };
  }

  private resolveUnitType(unitName: string): 'RAWAT_JALAN' | 'RAWAT_INAP' | 'IGD' {
    const u = unitName.toUpperCase();
    if (u.includes('IGD')) return 'IGD';
    if (
      u.includes('ZAAL') ||
      u.includes('ICU') ||
      u.includes('HCU') ||
      u.includes('NICU') ||
      u.includes('NEONATUS') ||
      u.includes('KMR') ||
      u.includes('INAP')
    ) {
      return 'RAWAT_INAP';
    }
    return 'RAWAT_JALAN';
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }

  public isHierarchicalSIMRSFormat(rawData: any[][]): boolean {
    for (let i = 0; i < Math.min(25, rawData.length); i++) {
      const row = rawData[i] || [];
      const col0 = String(row[0] || '').trim();
      const col1 = String(row[1] || '').trim();
      if (/^\d{4}\/\d{2}\/\d{2}\/\d+$/.test(col0)) {
        return true;
      }
      if (
        col0.toUpperCase().includes('TANGGAL PEMERIKSAAN') ||
        col1.toUpperCase().includes('NAMA PASIEN DAN CARA BAYAR')
      ) {
        return true;
      }
    }
    return false;
  }

  public parseHierarchicalSIMRSRows(rawData: any[][]): ParsedPatientRecord[] {
    const patients: ParsedPatientRecord[] = [];
    let currentRecord: {
      rowNumber: number;
      orderDate: string;
      medicalRecordNumber: string;
      patientName: string;
      gender: 'L' | 'P';
      age: number;
      ageUnit: string;
      originUnit: string;
      unitType: 'RAWAT_JALAN' | 'RAWAT_INAP' | 'IGD';
      guarantor: string;
      doctorName?: string;
      tests: Array<{ name: string; category: string }>;
      testNamesSet: Set<string>;
      rawLines: string[];
    } | null = null;

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i] || [];
      const col0 = String(row[0] || '').trim();
      const col1 = String(row[1] || '').trim();
      const col2 = String(row[2] || '').trim();
      const col3 = String(row[3] || '').trim();

      // Check for new patient header: format YYYY/MM/DD/NNNNNN
      const dateMatch = col0.match(/^(\d{4})\/(\d{2})\/(\d{2})\/(\d+)$/);
      if (dateMatch) {
        if (currentRecord) {
          patients.push(this.finalizeSIMRSRecord(currentRecord));
        }

        const orderDate = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;

        let mrn = '000000';
        let patientName = 'Pasien';
        let originUnit = 'INSTALASI LABORATORIUM';
        let unitType: 'RAWAT_JALAN' | 'RAWAT_INAP' | 'IGD' = 'RAWAT_JALAN';

        // Column 1 e.g. "256699 SAMIATUN BINTI SAMSURI (Kamar : ZA.K.1, ZAAL A)"
        const mrnMatch = col1.match(/^(\d+)\s+(.+)$/);
        let rest = col1;
        if (mrnMatch) {
          mrn = mrnMatch[1];
          rest = mrnMatch[2];
        }

        const roomMatch = rest.match(/\((Kamar|Poli|Ruangan?)\s*:\s*([^)]+)\)/i);
        if (roomMatch) {
          const roomCategory = roomMatch[1].toUpperCase();
          const roomRaw = roomMatch[2].trim();
          const parts = roomRaw.split(',');
          originUnit = parts[parts.length - 1].trim();
          patientName = rest.replace(/\((Kamar|Poli|Ruangan?)\s*:\s*([^)]+)\)/i, '').trim();

          if (roomCategory === 'KAMAR' || /ZAAL|ICU|HCU|INAP|KMR|ISOLASI|PERINATOLOGI|NEONATUS/i.test(originUnit)) {
            unitType = 'RAWAT_INAP';
          } else if (/IGD/i.test(originUnit)) {
            unitType = 'IGD';
          } else {
            unitType = 'RAWAT_JALAN';
          }
        } else {
          patientName = rest;
        }

        // Detect gender from name cues
        let gender: 'L' | 'P' = 'L';
        if (/BINTI|NY\.|NN\.|PEREMPUAN|WANITA/i.test(patientName)) {
          gender = 'P';
        } else if (/BIN\s|TN\.|LAKI/i.test(patientName)) {
          gender = 'L';
        }

        currentRecord = {
          rowNumber: patients.length + 1,
          orderDate,
          medicalRecordNumber: mrn,
          patientName,
          gender,
          age: 35,
          ageUnit: 'Th',
          originUnit,
          unitType,
          guarantor: 'UMUM',
          doctorName: col3 || undefined,
          tests: [],
          testNamesSet: new Set<string>(),
          rawLines: [col1]
        };
        continue;
      }

      if (!currentRecord) continue;

      // Extract payment method from Column 1: e.g. "Cara Bayar : BPJS KESEHATAN"
      if (col1.toLowerCase().includes('cara bayar')) {
        const gMatch = col1.match(/cara\s*bayar\s*:\s*(.+)/i);
        if (gMatch) {
          const rawG = gMatch[1].trim();
          if (/BPJS/i.test(rawG) && /TK|KETENAGAKERJAAN/i.test(rawG)) currentRecord.guarantor = 'BPJS TK';
          else if (/BPJS/i.test(rawG)) currentRecord.guarantor = 'BPJS KESEHATAN';
          else if (/UMUM/i.test(rawG)) currentRecord.guarantor = 'UMUM';
          else if (/ASURANSI/i.test(rawG)) currentRecord.guarantor = 'ASURANSI';
          else if (/JASA\s*RAHARJA/i.test(rawG)) currentRecord.guarantor = 'JASA RAHARJA';
          else if (/KARYAWAN/i.test(rawG)) currentRecord.guarantor = 'KARYAWAN';
          else currentRecord.guarantor = rawG;
        }
      }

      // Extract test parameters from Column 2: e.g. "LAB003 Darah Rutin 84.000", "Hemoglobin 0"
      if (col2 && col2 !== 'Pemeriksaan' && !col2.startsWith('Biaya Periksa') && col2 !== '0') {
        let testName = col2;
        const labCodeMatch = testName.match(/^LAB\d+\s+(.+?)(?:\s+[\d.,]+)?$/i);
        if (labCodeMatch) {
          testName = labCodeMatch[1].trim();
        } else {
          testName = testName.replace(/\s+\d+$/, '').trim();
        }

        if (testName && testName !== '0' && !currentRecord.testNamesSet.has(testName)) {
          currentRecord.testNamesSet.add(testName);
          currentRecord.tests.push({
            name: testName,
            category: classifyTestCategory(testName)
          });
        }
      }
    }

    if (currentRecord) {
      patients.push(this.finalizeSIMRSRecord(currentRecord));
    }

    return patients;
  }

  private finalizeSIMRSRecord(curr: any): ParsedPatientRecord {
    if (curr.tests.length === 0) {
      curr.tests.push({
        name: 'Pemeriksaan Laboratorium',
        category: 'Hematologi'
      });
    }

    return {
      rowNumber: curr.rowNumber,
      orderDate: curr.orderDate,
      patientName: curr.patientName,
      gender: curr.gender,
      age: curr.age,
      ageUnit: curr.ageUnit,
      medicalRecordNumber: curr.medicalRecordNumber,
      tests: curr.tests,
      originUnit: curr.originUnit,
      unitType: curr.unitType,
      guarantor: curr.guarantor,
      doctorName: curr.doctorName,
      rawRecord: {
        orderDate: curr.orderDate,
        medicalRecordNumber: curr.medicalRecordNumber,
        patientName: curr.patientName,
        originUnit: curr.originUnit,
        guarantor: curr.guarantor,
        examinations: curr.tests.map((t: any) => t.name).join(', ')
      },
      validationErrors: []
    };
  }
}

export const excelParser = new ExcelParser();
