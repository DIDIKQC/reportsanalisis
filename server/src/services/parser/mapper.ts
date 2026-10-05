import { aiProvider } from '../ai/gemini.provider';

export interface ColumnMappingResult {
  mapped: Record<string, string>; // { "TGL PERIKSA": "order_date", "NAMA": "patient_name", ... }
  unmapped: string[];
  confidence: Record<string, number>;
}

// Canonical target fields for Laboratory Ingestion
export const CANONICAL_TARGET_FIELDS = [
  'row_number',
  'order_date',
  'patient_name',
  'gender_male_age',   // e.g. "L" with "72Th"
  'gender_female_age', // e.g. "P" with "62Th"
  'gender',
  'age',
  'medical_record_number',
  'examinations',
  'origin_unit',
  'guarantor',
  'doctor_name'
];

export class SmartColumnMapper {
  private dictionaryRules: Record<string, RegExp[]> = {
    row_number: [/^(no|nomor|idx|id|#)$/i],
    order_date: [/^(tgl\s*periksa|tanggal\s*periksa|tgl|tanggal|order\s*date|tgl\s*registrasi|reg\s*date|date)$/i],
    patient_name: [/^(nama\s*pasien|nama|patient\s*name|name)$/i],
    gender_male_age: [/^(l|laki|laki-laki|male)$/i],
    gender_female_age: [/^(p|perempuan|wanita|female)$/i],
    gender: [/^(jk|jenis\s*kelamin|gender|sex)$/i],
    age: [/^(umur|usia|age|thn?)$/i],
    medical_record_number: [/^(no\.?\s*rm|nomor\s*rm|nomor\s*rekam\s*medis|mr|medical\s*record)$/i],
    examinations: [/^(pemeriksaan|tindakan|tes|nama\s*pemeriksaan|parameter|lab\s*test|examination)$/i],
    origin_unit: [/^(asal\s*pasien|asal\s*ruangan|ruangan|poli|unit|asal|instalasi|bangsal)$/i],
    guarantor: [/^(penjamin|jaminan|cara\s*bayar|asuransi|guarantor|status\s*pasien)$/i],
    doctor_name: [/^(dokter|dokter\s*pengirim|dpjp|physician|doctor)$/i]
  };

  public async mapHeaders(headers: string[], sampleRows: Record<string, any>[] = []): Promise<ColumnMappingResult> {
    const mapped: Record<string, string> = {};
    const confidence: Record<string, number> = {};
    const unmapped: string[] = [];

    // Step 1: Deterministic dictionary mapping
    for (const header of headers) {
      const trimmed = header.trim();
      let matchedField: string | null = null;

      for (const [targetField, regexes] of Object.entries(this.dictionaryRules)) {
        if (regexes.some(rx => rx.test(trimmed))) {
          matchedField = targetField;
          break;
        }
      }

      if (matchedField) {
        mapped[trimmed] = matchedField;
        confidence[trimmed] = 1.0;
      } else {
        unmapped.push(trimmed);
      }
    }

    // Step 2: Gemini AI fallback only for unclear headers
    if (unmapped.length > 0) {
      try {
        const aiResult = await aiProvider.smartColumnMapping({
          unmappedHeaders: unmapped,
          sampleRows,
          targetFields: CANONICAL_TARGET_FIELDS
        });

        for (const [unmappedHeader, targetField] of Object.entries(aiResult.mappings)) {
          if (CANONICAL_TARGET_FIELDS.includes(targetField)) {
            mapped[unmappedHeader] = targetField;
            confidence[unmappedHeader] = aiResult.confidence[unmappedHeader] || 0.85;
          }
        }
      } catch (err: any) {
        console.warn('Smart column mapping AI fallback skipped:', err.message);
      }
    }

    return {
      mapped,
      unmapped: headers.filter(h => !mapped[h.trim()]),
      confidence
    };
  }
}

export const smartColumnMapper = new SmartColumnMapper();
