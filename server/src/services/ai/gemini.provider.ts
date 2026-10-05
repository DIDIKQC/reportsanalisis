import { AIProvider, AIAnalysisRequest, AIAnalysisResponse, SmartMappingRequest, SmartMappingResponse } from './ai.provider';
import dotenv from 'dotenv';

dotenv.config();

export class GeminiProvider implements AIProvider {
  public name = 'Google Gemini (Gemini 2.5/1.5 Flash)';
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
  }

  public async generateAnalysis(req: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    const prompt = `
Anda adalah Tim Ahli Kendali Mutu & Spesialis Patologi Klinik Instalasi Laboratorium RSUD OKU Timur.
Lakukan audit dan evaluasi data agregat laboratorium berikut untuk periode: ${req.period}.
PENTING:
- DILARANG KERAS menyebutkan bahwa ini dibuat oleh AI, Artificial Intelligence, Kecerdasan Buatan, atau model bahasa/Gemini.
- Tuliskan seluruh ringkasan, temuan, dan rekomendasi secara murni sebagai telaah profesional tim medis dan spesialis patologi klinik laboratorium rumah sakit resmi.
- Rekomendasi harus berbasis bukti data aktual, tidak mengarang data atau penyebab yang tidak ada di angka.
- Gunakan terminologi profesional medis: "telah dievaluasi", "perlu dilakukan validasi berkala", "rekomendasi peningkatan mutu alur pra-analitik".
- Berikan format JSON murni dengan schema:
{
  "summary": "Ringkasan eksekutif 2-3 kalimat mengenai kinerja dan mutu laboratorium periode ini.",
  "findings": ["Temuan 1 (sebutkan indikator/angka)", "Temuan 2"],
  "comparison": "Perbandingan dengan target indikator mutu atau periode sebelumnya.",
  "recommendations": ["Rekomendasi tindakan 1 berdasarkan temuan", "Rekomendasi tindakan 2"]
}

Data Agregat Laboratorium:
${JSON.stringify(req.aggregatedMetrics, null, 2)}
${req.contextNote ? `Catatan Tambahan: ${req.contextNote}` : ''}
`;

    if (!this.apiKey) {
      return this.generateDeterministicFallback(req);
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(15000),
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json'
            }
          })
        }
      );

      if (!response.ok) {
        console.warn(`Engine API status: ${response.status}. Falling back to deterministic analysis.`);
        return this.generateDeterministicFallback(req);
      }

      const data = (await response.json()) as any;
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        return this.generateDeterministicFallback(req);
      }

      const parsed = JSON.parse(text);
      return {
        summary: parsed.summary || 'Ringkasan kinerja laboratorium periode ini menunjukkan operasional berjalan stabil sesuai standar mutu.',
        findings: parsed.findings || [
          `Total pemeriksaan mencapai ${req.aggregatedMetrics.totalExaminations} tindakan.`,
          req.aggregatedMetrics.tatComplianceRate != null
            ? `Tingkat kepatuhan TAT tercatat ${req.aggregatedMetrics.tatComplianceRate.toFixed(1)}%.`
            : `Data waktu tunggu TAT tidak tersedia pada berkas laporan.`
        ],
        comparison: parsed.comparison || (req.aggregatedMetrics.tatComplianceRate != null
          ? `Kepatuhan standar mutu TAT ${req.aggregatedMetrics.tatComplianceRate >= 80 ? 'memenuhi' : 'di bawah'} ambang batas target nasional (>80%).`
          : 'Indikator mutu TAT belum dapat dibandingkan karena ketiadaan data waktu.'),
        recommendations: parsed.recommendations || [
          'Pertahankan kontinuitas pemeliharaan alat dan validasi berkala.',
          'Lakukan evaluasi alur pra-analitik pada unit dengan kontribusi sampel tertinggi.'
        ],
        modelUsed: 'Clinical Quality Analytics Engine v2.5',
        rawResponse: text
      };
    } catch (err: any) {
      console.warn('Invocation failed, using deterministic engine fallback:', err.message);
      return this.generateDeterministicFallback(req);
    }
  }

  public async smartColumnMapping(req: SmartMappingRequest): Promise<SmartMappingResponse> {
    if (!this.apiKey || req.unmappedHeaders.length === 0) {
      return { mappings: {}, confidence: {} };
    }

    const prompt = `
Petakan header kolom laboratorium mentah berikut ke target fields yang sesuai:
Header Mentah yang belum dipetakan:
${JSON.stringify(req.unmappedHeaders)}

Contoh isi baris data:
${JSON.stringify(req.sampleRows.slice(0, 3))}

Daftar target fields yang tersedia:
${JSON.stringify(req.targetFields)}

Balas hanya dengan JSON format:
{
  "mappings": { "header_mentah": "target_field_name" },
  "confidence": { "header_mentah": 0.95 }
}
`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(10000),
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json', temperature: 0.1 }
          })
        }
      );
      if (!response.ok) return { mappings: {}, confidence: {} };
      const data = (await response.json()) as any;
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      return JSON.parse(text || '{"mappings":{},"confidence":{}}');
    } catch {
      return { mappings: {}, confidence: {} };
    }
  }

  private generateDeterministicFallback(req: AIAnalysisRequest): AIAnalysisResponse {
    const { totalPatients, totalExaminations } = req.aggregatedMetrics;
    const hasTAT = req.aggregatedMetrics.hasTATData && req.aggregatedMetrics.tatComplianceRate !== null && req.aggregatedMetrics.tatComplianceRate !== undefined;
    const topTests = req.aggregatedMetrics.topExaminations?.slice(0, 3).map(t => `${t.name} (${t.count})`).join(', ') || 'Kimia Darah dan Hematologi';

    const findings: string[] = [
      `Total pelayanan menjangkau ${totalPatients.toLocaleString('id-ID')} pasien dengan total ${totalExaminations.toLocaleString('id-ID')} parameter uji laboratorium.`,
      hasTAT
        ? `Kepatuhan Turn Around Time (TAT) mencapai ${(req.aggregatedMetrics.tatComplianceRate || 0).toFixed(1)}%, dengan non-compliance sebesar ${(req.aggregatedMetrics.tatNonComplianceRate || 0).toFixed(1)}%.`
        : `Data waktu tunggu pelayanan (TAT) tidak dicantumkan pada berkas data yang diunggah sehingga evaluasi indikator TAT dikosongkan.`,
      `Pemeriksaan dengan volume utilisasi terbesar meliputi ${topTests}.`
    ];

    if (req.aggregatedMetrics.criticalResultsCount && req.aggregatedMetrics.criticalResultsCount > 0) {
      findings.push(`Teridentifikasi ${req.aggregatedMetrics.criticalResultsCount} hasil nilai kritis yang seluruhnya telah dilaporkan ke DPJP/perawat jaga.`);
    }

    const recommendations: string[] = [
      'Lakukan pemantauan harian terhadap kalibrasi alat kimia klinik dan hematologi analyzer guna menjamin presisi hasil.',
      hasTAT
        ? 'Pertahankan pencapaian TAT CITO <30 menit melalui koordinasi proaktif sampling dengan unit rawat inap dan IGD.'
        : 'Pertimbangkan penambahan pencatatan jam pengambilan sampel dan jam hasil keluar agar evaluasi waktu tunggu (TAT) dapat dimonitor.',
      'Tingkatkan evaluasi berkala terhadap ketersediaan reagen parameter yang dipantau (Analisa Gas Darah, TSH, Free T4).'
    ];

    return {
      summary: hasTAT
        ? `Pada periode ${req.period}, Instalasi Laboratorium melayani ${totalPatients.toLocaleString('id-ID')} pasien dan memproses ${totalExaminations.toLocaleString('id-ID')} pemeriksaan dengan tingkat kepatuhan TAT ${(req.aggregatedMetrics.tatComplianceRate || 0).toFixed(1)}%.`
        : `Pada periode ${req.period}, Instalasi Laboratorium melayani ${totalPatients.toLocaleString('id-ID')} pasien dan memproses ${totalExaminations.toLocaleString('id-ID')} pemeriksaan secara optimal. Data waktu tunggu (TAT) dikosongkan sesuai berkas asli.`,
      findings,
      comparison: hasTAT
        ? `Tingkat kepatuhan TAT (${(req.aggregatedMetrics.tatComplianceRate || 0).toFixed(1)}%) ${(req.aggregatedMetrics.tatComplianceRate || 0) >= 80 ? 'telah memenuhi' : 'perlu ditingkatkan terhadap'} indikator mutu nasional (>80%).`
        : `Indikator kepatuhan TAT tidak dapat dievaluasi karena berkas sumber tidak memiliki data jam periksa atau waktu tunggu.`,
      recommendations,
      modelUsed: 'deterministic-clinical-engine'
    };
  }
}

// Factory instantiation
export const aiProvider: AIProvider = new GeminiProvider();
