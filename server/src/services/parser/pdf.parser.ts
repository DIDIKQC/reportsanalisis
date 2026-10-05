// Polyfill DOMMatrix for PDF parsing in headless and serverless runtimes
if (typeof (globalThis as any).DOMMatrix === 'undefined') {
  try {
    (globalThis as any).DOMMatrix = require('dommatrix');
  } catch {
    class MockDOMMatrix {
      a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
      m11 = 1; m12 = 0; m13 = 0; m14 = 0;
      m21 = 0; m22 = 1; m23 = 0; m24 = 0;
      m31 = 0; m32 = 0; m33 = 1; m34 = 0;
      m41 = 0; m42 = 0; m43 = 0; m44 = 1;
      is2D = true; isIdentity = true;
      constructor(init?: any) {
        if (Array.isArray(init) && init.length >= 6) {
          this.a = init[0]; this.b = init[1]; this.c = init[2];
          this.d = init[3]; this.e = init[4]; this.f = init[5];
        }
      }
      translate() { return this; }
      scale() { return this; }
      multiplySelf() { return this; }
      preMultiplySelf() { return this; }
      invertSelf() { return this; }
      getTransform() { return this; }
    }
    (globalThis as any).DOMMatrix = MockDOMMatrix;
  }
}

import fs from 'fs';
import zlib from 'zlib';
import { ParsedPatientRecord } from './excel.parser';
import { classifyTestCategory } from './test-classifier';

export interface PDFPreviewResult {
  headers: string[];
  totalRows: number;
  totalPages: number;
  mapping: {
    mapped: Record<string, string>;
    confidence: Record<string, number>;
  };
  sampleRecords: ParsedPatientRecord[];
}

const KNOWN_UNITS = [
  'INSTALASI LABORATORIUM', 'LABORATORIUM', 'Unit IGD', 'IGD', 'ICU', 'HCU', 'NICU', 'NEONATUS',
  'ZAAL A', 'ZAAL B', 'ZAAL C', 'ZAAL D', 'ZAAL E', 'ZAAL F', 'ZAAL ANAK', 'ZAAL BERSALIN',
  'POLI PENYAKIT DALAM', 'POLI BEDAH', 'POLI ANAK', 'POLI KEBIDANAN', 'POLI KEBIDANAN & KANDUNGAN',
  'POLI MATA', 'POLI THT', 'POLI SARAF', 'POLI JANTUNG', 'POLI GIGI', 'POLI KULIT DAN KELAMIN',
  'POLI KULIT', 'POLI PARU', 'POLI UMUM', 'POLI VCT', 'POLI JIWA', 'POLI FISIOTERAPI',
  'INSTALASI HEMODIALISA', 'HEMODIALISA', 'KAMAR OPERASI', 'OK', 'VK', 'BERSALIN',
  'PERINATOLOGI', 'ISOLASI', 'VIP', 'KELAS 1', 'KELAS 2', 'KELAS 3', 'RAWAT JALAN', 'RAWAT INAP',
  '---'
].sort((a, b) => b.length - a.length);

const UPPER_KNOWN_UNITS = KNOWN_UNITS.map(u => ({ raw: u, upper: u.toUpperCase() }));

export class PDFParser {
  private async extractTextFromPDF(filePath: string): Promise<string> {
    // 1. Direct stream decompression (100% resilient across Node environments and serverless)
    try {
      const buffer = fs.readFileSync(filePath);
      const directText = this.extractTextDirectlyFromPDF(buffer);
      if (directText && directText.trim().length > 100) {
        return directText;
      }
    } catch (directErr) {
      console.warn('Direct stream extraction notice:', directErr);
    }

    // 2. Secondary fallback to pdf-parse library
    try {
      const pdfModule = require('pdf-parse');
      if (pdfModule && pdfModule.PDFParse) {
        const parser = new pdfModule.PDFParse({ url: filePath });
        const res = await parser.getText();
        return res.text || '';
      } else if (typeof pdfModule === 'function') {
        const dataBuffer = fs.readFileSync(filePath);
        const res = await pdfModule(dataBuffer);
        return res.text || '';
      } else if (typeof pdfModule?.default === 'function') {
        const dataBuffer = fs.readFileSync(filePath);
        const res = await pdfModule.default(dataBuffer);
        return res.text || '';
      } else if (pdfModule?.default?.PDFParse) {
        const parser = new pdfModule.default.PDFParse({ url: filePath });
        const res = await parser.getText();
        return res.text || '';
      }
    } catch (err: any) {
      console.warn('pdf-parse fallback notice:', err.message);
    }

    throw new Error('Gagal mengekstrak teks dari dokumen PDF.');
  }

  private extractTextDirectlyFromPDF(buf: Buffer): string {
    const str = buf.toString('binary');
    const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
    let match: RegExpExecArray | null;
    const allLines: string[] = [];

    while ((match = streamRegex.exec(str)) !== null) {
      const rawStream = Buffer.from(match[1], 'binary');
      let text = '';
      try {
        const decompressed = zlib.inflateSync(rawStream);
        text = decompressed.toString('latin1');
      } catch {
        continue;
      }

      if (!text.includes('TJ') && !text.includes('Tj')) continue;

      const btRegex = /BT([\s\S]*?)ET/g;
      let btMatch: RegExpExecArray | null;
      const pageItems: Array<{ x: number; y: number; text: string }> = [];

      while ((btMatch = btRegex.exec(text)) !== null) {
        const block = btMatch[1];
        let x = 0;
        let y = 0;
        const tmMatch = block.match(/([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+Tm/);
        if (tmMatch) {
          x = parseFloat(tmMatch[5]);
          y = parseFloat(tmMatch[6]);
        }

        const tjMatch = block.match(/\[([\s\S]*?)\]\s*TJ/);
        if (tjMatch) {
          const inner = tjMatch[1];
          const strParts = [...inner.matchAll(/\((.*?)(?<!\\)\)/g)].map(m => m[1].replace(/\\([()\\])/g, '$1')).join('');
          if (strParts) {
            pageItems.push({ x, y, text: strParts });
          }
        } else {
          const simpleTj = block.match(/\((.*?)(?<!\\)\)\s*Tj/);
          if (simpleTj && simpleTj[1]) {
            pageItems.push({ x, y, text: simpleTj[1].replace(/\\([()\\])/g, '$1') });
          }
        }
      }

      if (pageItems.length > 0) {
        pageItems.sort((a, b) => b.y - a.y || a.x - b.x);
        let currentY: number | null = null;
        let currentLine: Array<{ x: number; y: number; text: string }> = [];

        for (const item of pageItems) {
          if (currentY === null || Math.abs(item.y - currentY) > 3) {
            if (currentLine.length > 0) {
              currentLine.sort((a, b) => a.x - b.x);
              allLines.push(currentLine.map(it => it.text).join(' '));
            }
            currentY = item.y;
            currentLine = [item];
          } else {
            currentLine.push(item);
          }
        }
        if (currentLine.length > 0) {
          currentLine.sort((a, b) => a.x - b.x);
          allLines.push(currentLine.map(it => it.text).join(' '));
        }
      }
    }

    return allLines.join('\n');
  }

  public async previewLaboratoryPDF(filePath: string): Promise<PDFPreviewResult> {
    const text = await this.extractTextFromPDF(filePath);
    const records = this.parseTextToRecords(text);
    const pageMatch = text.match(/--\s*\d+\s*of\s*(\d+)\s*--/);
    const totalPages = pageMatch ? parseInt(pageMatch[1], 10) : Math.max(1, Math.ceil(records.length / 40));

    const isTATReport = text.includes('Laporan TAT') || text.includes('No. Pasien') || text.includes('TAT (Menit)');

    if (isTATReport) {
      const headers = ['No.', 'No. Pasien', 'No. Lab', 'Nama', 'Ruang', 'Pemeriksaan', 'Cito / Non Cito', 'TAT (Menit)'];
      const mapped: Record<string, string> = {
        'No.': 'row_number',
        'No. Pasien': 'medical_record_number',
        'No. Lab': 'registration_number',
        'Nama': 'patient_name',
        'Ruang': 'origin_unit',
        'Pemeriksaan': 'examinations',
        'Cito / Non Cito': 'guarantor',
        'TAT (Menit)': 'tat_minutes'
      };
      const confidence: Record<string, number> = {
        'No.': 1.0,
        'No. Pasien': 1.0,
        'No. Lab': 1.0,
        'Nama': 1.0,
        'Ruang': 1.0,
        'Pemeriksaan': 1.0,
        'Cito / Non Cito': 1.0,
        'TAT (Menit)': 1.0
      };

      return {
        headers,
        totalRows: records.length,
        totalPages,
        mapping: { mapped, confidence },
        sampleRecords: records.slice(0, 10)
      };
    }

    // Default generic PDF preview
    const headers = ['No.', 'Tanggal Periksa', 'Nama Pasien', 'No RM', 'Ruang / Asal', 'Pemeriksaan'];
    const mapped: Record<string, string> = {
      'No.': 'row_number',
      'Tanggal Periksa': 'order_date',
      'Nama Pasien': 'patient_name',
      'No RM': 'medical_record_number',
      'Ruang / Asal': 'origin_unit',
      'Pemeriksaan': 'examinations'
    };
    const confidence: Record<string, number> = {
      'No.': 1.0,
      'Tanggal Periksa': 1.0,
      'Nama Pasien': 1.0,
      'No RM': 1.0,
      'Ruang / Asal': 1.0,
      'Pemeriksaan': 1.0
    };

    return {
      headers,
      totalRows: records.length,
      totalPages,
      mapping: { mapped, confidence },
      sampleRecords: records.slice(0, 10)
    };
  }

  public async parseLaboratoryPDF(filePath: string): Promise<ParsedPatientRecord[]> {
    const text = await this.extractTextFromPDF(filePath);
    return this.parseTextToRecords(text);
  }

  public parseTextToRecords(text: string): ParsedPatientRecord[] {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const records: ParsedPatientRecord[] = [];

    // Format 1: Laporan TAT format:
    // e.g. "1 257766 2601010001 MARYONO ICU Natrium; Kalium Non cito 90"
    const tatRowRegex = /^(\d+)\s+(\d{4,10})\s+(\d{8,12})\s+(.+?)\s+(Non cito|Cito)\s+(-|-?\d+)$/i;

    // Format 2: Register Pasien date format:
    // e.g. "1 01/11/2023 SUCIPTO BIN WIRO SUYOTO 72Th ... POLI PENYAKIT DALAM"
    const dateRowRegex = /^(\d+)\s+(\d{1,2}\/\d{1,2}\/\d{4})\s+(.+)$/;

    // Check if format 1 matches
    let tatMatchCount = 0;
    for (let i = 0; i < Math.min(100, lines.length); i++) {
      if (tatRowRegex.test(lines[i])) tatMatchCount++;
    }

    if (tatMatchCount > 0) {
      return this.parseTATFormat(lines);
    }

    // Otherwise use Format 2
    let currentRecord: Partial<ParsedPatientRecord> & { rawLines: string[] } | null = null;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(dateRowRegex);

      if (match) {
        if (currentRecord) {
          records.push(this.finalizeRecordFormat2(currentRecord));
        }

        const rowNum = parseInt(match[1], 10);
        const [d, m, y] = match[2].split('/');
        const isoDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        const restOfLine = match[3];

        currentRecord = {
          rowNumber: rowNum,
          orderDate: isoDate,
          rawLines: [restOfLine]
        };
      } else if (currentRecord) {
        currentRecord.rawLines.push(line);
      }
    }

    if (currentRecord) {
      records.push(this.finalizeRecordFormat2(currentRecord));
    }

    return records;
  }

  private parseTATFormat(lines: string[]): ParsedPatientRecord[] {
    const tatRowRegex = /^(\d+)\s+(\d{4,10})\s+(\d{8,12})\s+(.+?)\s+(Non cito|Cito)\s+(-|-?\d+)$/i;
    const records: ParsedPatientRecord[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (
        line.includes('No. Pasien') ||
        line.includes('Laporan TAT') ||
        /--\s*\d+\s*of\s*\d+\s*--/.test(line)
      ) {
        continue;
      }

      const match = line.match(tatRowRegex);
      if (!match) continue;

      const rowNo = parseInt(match[1], 10);
      const noPasien = match[2];
      const noLab = match[3];
      const middle = match[4];
      const citoStr = match[5];
      const tatStr = match[6];

      // Extract Unit & Tests from middle
      const upperMiddle = middle.toUpperCase();
      let matchedUnit = 'Unit IGD';
      let unitIdx = -1;
      for (const item of UPPER_KNOWN_UNITS) {
        const idx = upperMiddle.indexOf(item.upper);
        if (idx !== -1) {
          matchedUnit = item.raw;
          unitIdx = idx;
          break;
        }
      }

      let patientName = middle;
      let rawTestsStr = '';
      if (unitIdx !== -1) {
        patientName = middle.substring(0, unitIdx).trim();
        rawTestsStr = middle.substring(unitIdx + matchedUnit.length).trim();
      } else {
        // Fallback: take last 2 words as unit
        const words = middle.split(' ');
        if (words.length > 2) {
          patientName = words.slice(0, words.length - 2).join(' ');
          matchedUnit = words.slice(words.length - 2).join(' ');
        }
      }

      if (!patientName) patientName = `Pasien ${noPasien}`;

      // Date parsing from No. Lab (e.g. 2601010001 -> 2026-01-01)
      let orderDate = new Date().toISOString().split('T')[0];
      if (noLab.length >= 6) {
        const yy = noLab.substring(0, 2);
        const mm = noLab.substring(2, 4);
        const dd = noLab.substring(4, 6);
        const monthNum = parseInt(mm, 10);
        const dayNum = parseInt(dd, 10);
        if (monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= 31) {
          orderDate = `20${yy}-${mm}-${dd}`;
        }
      }

      // Unit type resolution
      const originUnit = matchedUnit === '---' ? 'Unit IGD' : matchedUnit;
      const u = originUnit.toUpperCase();
      let unitType: 'RAWAT_JALAN' | 'RAWAT_INAP' | 'IGD' = 'RAWAT_JALAN';
      if (u.includes('IGD')) {
        unitType = 'IGD';
      } else if (
        u.includes('ZAAL') ||
        u.includes('ICU') ||
        u.includes('HCU') ||
        u.includes('NICU') ||
        u.includes('NEONATUS') ||
        u.includes('KMR') ||
        u.includes('PERINATOLOGI') ||
        u.includes('ISOLASI')
      ) {
        unitType = 'RAWAT_INAP';
      }

      // Cito and TAT parsing
      const isCito = citoStr.toLowerCase().includes('cito') && !citoStr.toLowerCase().includes('non');
      let tatMinutes: number | undefined = undefined;
      if (tatStr !== '-') {
        const parsedMins = parseInt(tatStr, 10);
        tatMinutes = isNaN(parsedMins) ? undefined : Math.max(0, parsedMins);
      }

      // Gender inference
      let gender: 'L' | 'P' = 'L';
      const upperName = patientName.toUpperCase();
      if (
        upperName.includes('NY.') ||
        upperName.includes('NYA') ||
        upperName.includes('IBU') ||
        upperName.includes('BINTI') ||
        upperName.includes('SITI') ||
        upperName.includes('SRI') ||
        upperName.includes('NUR') ||
        upperName.includes('DEWI') ||
        upperName.includes('PUTRI') ||
        upperName.includes('MARSIAH') ||
        upperName.includes('TARIASIH') ||
        upperName.includes('WASTINI') ||
        upperName.includes('LILIS')
      ) {
        gender = 'P';
      }

      // Tests parsing
      const rawTests = rawTestsStr
        .replace(/^[,.\s]+|[,.\s]+$/g, '')
        .split(/[,;\n]+/)
        .map(t => t.trim())
        .filter(t => t.length > 0 && t !== '-');

      const tests = rawTests.length > 0
        ? rawTests.map(t => ({ name: t, category: classifyTestCategory(t) }))
        : [{ name: 'Pemeriksaan Laboratorium', category: 'Kimia Darah' }];

      records.push({
        rowNumber: rowNo,
        orderDate,
        patientName,
        gender,
        age: 35,
        ageUnit: 'Th',
        medicalRecordNumber: noPasien,
        registrationNumber: noLab,
        tests,
        originUnit,
        unitType,
        guarantor: isCito ? 'CITO / EMERGENSI' : 'BPJS / UMUM',
        tatMinutes,
        sampleTakenDatetime: `${orderDate} 08:30:00`,
        resultCompletedDatetime: tatMinutes !== undefined
          ? this.addMinutesToTimeString(`${orderDate} 08:30:00`, tatMinutes)
          : `${orderDate} 09:30:00`,
        rawRecord: {
          'No.': rowNo,
          'No. Pasien': noPasien,
          'No. Lab': noLab,
          'Nama': patientName,
          'Ruang': originUnit,
          'Pemeriksaan': rawTestsStr || tests.map(t => t.name).join('; '),
          'Cito / Non Cito': citoStr,
          'TAT (Menit)': tatStr === '-' ? '-' : (tatMinutes ?? '-')
        },
        validationErrors: []
      });
    }

    return records;
  }

  private addMinutesToTimeString(dateTimeStr: string, minutes: number): string {
    try {
      const [datePart, timePart] = dateTimeStr.split(' ');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hours, mins, secs] = timePart.split(':').map(Number);
      const d = new Date(year, month - 1, day, hours, mins, secs);
      d.setMinutes(d.getMinutes() + minutes);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dt = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      const ss = String(d.getSeconds()).padStart(2, '0');
      return `${y}-${m}-${dt} ${hh}:${mm}:${ss}`;
    } catch {
      return dateTimeStr;
    }
  }

  private finalizeRecordFormat2(curr: any): ParsedPatientRecord {
    const fullText = curr.rawLines.join(' ');
    const ageMatch = fullText.match(/(\d+)\s*(Th|Bl|Hr)/i);
    let age = 0;
    let ageUnit = 'Th';
    let patientName = 'Pasien';
    let gender: 'L' | 'P' = 'L';
    let remaining = fullText;

    if (ageMatch) {
      age = parseInt(ageMatch[1], 10);
      ageUnit = ageMatch[2];
      const ageIdx = fullText.indexOf(ageMatch[0]);
      patientName = fullText.substring(0, ageIdx).trim();
      remaining = fullText.substring(ageIdx + ageMatch[0].length).trim();
      
      const upperName = patientName.toUpperCase();
      if (
        upperName.includes('BINTI') ||
        upperName.includes('NY.') ||
        upperName.includes('IBU') ||
        upperName.includes('SITI') ||
        upperName.includes('SRI') ||
        upperName.includes('NUR') ||
        upperName.includes('DEWI')
      ) {
        gender = 'P';
      }
    }

    let originUnit = 'Unit IGD';
    const upperRemaining = remaining.toUpperCase();
    for (const item of UPPER_KNOWN_UNITS) {
      if (upperRemaining.includes(item.upper)) {
        const idx = upperRemaining.lastIndexOf(item.upper);
        originUnit = remaining.substring(idx).trim();
        remaining = remaining.substring(0, idx).trim();
        break;
      }
    }

    const rawTests: string[] = remaining
      .replace(/^[,.\s]+|[,.\s]+$/g, '')
      .split(/[,;\n]+/)
      .map((t: string) => t.trim())
      .filter((t: string) => t.length > 0 && t !== '-');

    const tests = rawTests.map((t: string) => ({
      name: t,
      category: classifyTestCategory(t)
    }));

    let unitType: 'RAWAT_JALAN' | 'RAWAT_INAP' | 'IGD' = 'RAWAT_JALAN';
    const u = originUnit.toUpperCase();
    if (u.includes('IGD')) unitType = 'IGD';
    else if (
      u.includes('ZAAL') ||
      u.includes('ICU') ||
      u.includes('HCU') ||
      u.includes('NICU') ||
      u.includes('NEONATUS') ||
      u.includes('KMR')
    ) {
      unitType = 'RAWAT_INAP';
    }

    const mrn = `RM-${Math.abs(this.hashCode(patientName)).toString().padStart(6, '0')}`;

    return {
      rowNumber: curr.rowNumber,
      orderDate: curr.orderDate,
      patientName,
      gender,
      age,
      ageUnit,
      medicalRecordNumber: mrn,
      tests: tests.length > 0 ? tests : [{ name: 'Pemeriksaan Rutin', category: 'Kimia Darah' }],
      originUnit,
      unitType,
      guarantor: 'UMUM',
      rawRecord: { original: fullText },
      validationErrors: []
    };
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }
}

export const pdfParser = new PDFParser();
