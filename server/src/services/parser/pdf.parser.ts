import fs from 'fs';
import { ParsedPatientRecord } from './excel.parser';
import { classifyTestCategory } from './test-classifier';

export class PDFParser {
  public async parseLaboratoryPDF(filePath: string): Promise<ParsedPatientRecord[]> {
    let text = '';

    try {
      const pdfModule = require('pdf-parse');
      if (pdfModule && pdfModule.PDFParse) {
        // v2.x class-based API
        const parser = new pdfModule.PDFParse({ url: filePath });
        const res = await parser.getText();
        text = res.text || '';
      } else if (typeof pdfModule === 'function') {
        // v1.x function-based API
        const dataBuffer = fs.readFileSync(filePath);
        const res = await pdfModule(dataBuffer);
        text = res.text || '';
      } else if (typeof pdfModule?.default === 'function') {
        const dataBuffer = fs.readFileSync(filePath);
        const res = await pdfModule.default(dataBuffer);
        text = res.text || '';
      } else if (pdfModule?.default?.PDFParse) {
        const parser = new pdfModule.default.PDFParse({ url: filePath });
        const res = await parser.getText();
        text = res.text || '';
      } else {
        throw new Error('Format modul pdf-parse tidak dikenali.');
      }
    } catch (err: any) {
      console.error('PDF parsing error in parseLaboratoryPDF:', err);
      throw new Error(`Gagal membaca teks dokumen PDF: ${err.message}`);
    }

    return this.parseTextToRecords(text);
  }

  public parseTextToRecords(text: string): ParsedPatientRecord[] {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const records: ParsedPatientRecord[] = [];

    // Match rows starting with a number and date: e.g. "1 01/11/2023 SUCIPTO BIN WIRO SUYOTO 72Th ... POLI PENYAKIT DALAM"
    const rowRegex = /^(\d+)\s+(\d{1,2}\/\d{1,2}\/\d{4})\s+(.+)$/;

    let currentRecord: Partial<ParsedPatientRecord> & { rawLines: string[] } | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(rowRegex);

      if (match) {
        if (currentRecord) {
          records.push(this.finalizeRecord(currentRecord));
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
        // Line continuation (for multiline patient name, examinations, or origin)
        currentRecord.rawLines.push(line);
      }
    }

    if (currentRecord) {
      records.push(this.finalizeRecord(currentRecord));
    }

    return records;
  }

  private finalizeRecord(curr: any): ParsedPatientRecord {
    const fullText = curr.rawLines.join(' ');
    // Extract Age & Gender (looks for patterns like "72Th", "9Th", "62Th", "83Th", "7Bl", "9Hr", "0Hr")
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
      
      // Determine gender based on name suffix or columns if available
      if (
        patientName.includes('BINTI') ||
        patientName.includes('NY.') ||
        patientName.includes('IBU') ||
        patientName.includes('SITI') ||
        patientName.includes('SRI') ||
        patientName.includes('NUR') ||
        patientName.includes('DEWI')
      ) {
        gender = 'P';
      } else {
        gender = 'L';
      }
    }

    // Origin unit is typically at the end of the text
    // E.g. "POLI PENYAKIT DALAM", "Unit IGD", "ZA.K.3 ZAAL A", "KMR.1.2 ZAAL E", "POLI KULIT DAN KELAMIN", etc.
    let originUnit = 'Unit IGD';
    const unitKeywords = [
      'POLI PENYAKIT DALAM', 'POLI KULIT DAN KELAMIN', 'POLI SARAF', 'POLI ANAK',
      'POLI UMUM', 'POLI KEBIDANAN', 'INSTALASI HEMODIALISA', 'POLI VCT', 'POLI THT',
      'POLI BEDAH', 'POLI MATA', 'Unit IGD', 'IGD', 'ICU', 'HCU', 'NEONATUS', 'NICU', 'ZAAL'
    ];

    for (const kw of unitKeywords) {
      if (remaining.toUpperCase().includes(kw)) {
        const idx = remaining.toUpperCase().lastIndexOf(kw);
        originUnit = remaining.substring(idx).trim();
        remaining = remaining.substring(0, idx).trim();
        break;
      }
    }

    // Anything left in remaining is tests
    const rawTests: string[] = remaining
      .replace(/^[,.\s]+|[,.\s]+$/g, '')
      .split(/[,;\n]+/)
      .map((t: string) => t.trim())
      .filter((t: string) => t.length > 0 && t !== '-');

    const tests = rawTests.map((t: string) => ({
      name: t,
      category: classifyTestCategory(t)
    }));

    // Resolve Unit Type
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
