import db from './database';
import fs from 'fs';
import path from 'path';
import { ingestService } from '../services/parser/ingest.service';

export async function populateSampleDataIfEmpty() {
  const isAlreadySeeded = db.prepare('SELECT value FROM system_settings WHERE key = ?').get('INITIAL_SAMPLE_SEEDED') as { value: string } | undefined;
  if (isAlreadySeeded) {
    return; // Already initialized in the past
  }

  const patientCount = db.prepare('SELECT COUNT(*) as count FROM patients').get() as { count: number };
  if (patientCount.count > 0) {
    db.prepare('INSERT OR REPLACE INTO system_settings (key, value, description) VALUES (?, ?, ?)').run(
      'INITIAL_SAMPLE_SEEDED', 'true', 'Flag to indicate initial sample dataset was seeded'
    );
    return; // Already populated
  }

  console.log('Populating initial laboratory dataset from uploaded Rajal & Ranap source files...');

  const uploadsDir = path.resolve(process.cwd(), process.env.STORAGE_LOCAL_DIR || './storage', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // 1. Prepare Rawat Jalan Sample CSV
  const rajalCsvPath = path.join(uploadsDir, 'data_pasien_laboratorium_rajal.csv');
  const rajalRows = [
    'No,TGL PERIKSA,NAMA,L,P,PEMERIKSAAN,ASAL PASIEN',
    '1,01/11/2025,SUCIPTO BIN WIRO SUYOTO,72Th,,Trygliserida,Creatinine,Ureum,HBA 1c,Glukosa Sewaktu / BSS,POLI PENYAKIT DALAM',
    '2,01/11/2025,JULIAN RAMADHANI,9Th,,Jamur,POLI KULIT DAN KELAMIN',
    '3,01/11/2025,NURHASANAH BINTI MUSNADI,,62Th,Creatinine,Ureum,HBA 1c,Glukosa Sewaktu / BSS,POLI PENYAKIT DALAM',
    '4,01/11/2025,ARIF WAHYUDI,50Th,,Creatinine,Ureum,Golongan Darah,Eosinofil,Monosit,Limfosit,Neutrofil,MCHC,MCH,MCV,Trombosit,Basofil,Eritrosit,Leukosit,Hematokrit,Hemoglobin,Unit IGD',
    '5,01/11/2025,ROSTIKA BINTI SUCIPTO,,66Th,TSH (Elisa),T4 (Elisa),POLI PENYAKIT DALAM',
    '6,01/11/2025,RUSNIAH BINTI GUNAWAN,,69Th,Trygliserida,Cholesterol Total,Uric Acid,Creatinine,Ureum,POLI PENYAKIT DALAM',
    '7,01/11/2025,SUMARSONO BIN ATMO SUWITO,60Th,,LDL Cholesterol,Cholesterol Total,Uric Acid,Glukosa Sewaktu / BSS,POLI SARAF',
    '8,01/11/2025,MUHAMMAD RIZKY DHIAULHAQ,13Th,,Jamur,POLI KULIT DAN KELAMIN',
    '9,01/11/2025,SLAMET BIN YOSO,66Th,,LDL Cholesterol,Trygliserida,Cholesterol Total,Uric Acid,Ureum,HBA 1c,POLI PENYAKIT DALAM',
    '10,01/11/2025,SURTI KANTI,,53Th,LDL Cholesterol,Trygliserida,Uric Acid,Creatinine,Ureum,HBA 1c,POLI PENYAKIT DALAM',
    '11,01/11/2025,ROYANAH BINTI H MANSYUR,,37Th,Jamur,POLI KULIT DAN KELAMIN',
    '12,01/11/2025,YOGA ARYASADANA,18Th,,Creatinine,Ureum,Glukosa Sewaktu / BSS,Waktu Pembekuan/Ct,Waktu Perdarahan/Bt,Eosinofil,Monosit,Limfosit,Neutrofil,MCHC,MCH,MCV,Trombosit,Basofil,Eritrosit,Leukosit,Hematokrit,Hemoglobin,Unit IGD',
    '13,01/11/2025,WAYAN WANGI,,83Th,Eosinofil,Monosit,Limfosit,Neutrofil,MCHC,MCH,MCV,Trombosit,Basofil,Eritrosit,Leukosit,Hematokrit,Hemoglobin,Unit IGD',
    '14,01/11/2025,SANIYEM,,47Th,Creatinine,Ureum,Glukosa Sewaktu / BSS,Eosinofil,Monosit,Limfosit,Neutrofil,Hematokrit,MCHC,MCH,MCV,Trombosit,LED,Eritrosit,Basofil,Leukosit,Hemoglobin,Unit IGD',
    '15,02/11/2025,SUMARLIN BINTI SUMADI,,30Th,Glukosa Sewaktu / BSS,Anti HIV,Golongan Darah,Waktu Perdarahan/Bt,Eosinofil,Monosit,Limfosit,Neutrofil,MCHC,MCH,MCV,Trombosit,Basofil,Eritrosit,Leukosit,Hematokrit,Hemoglobin,Unit IGD',
    '16,02/11/2025,DINI EKA ANGGRAINI,,24Th,Jamur,VDRL/RPR,TPHA / Anti Sypilis,POLI KULIT DAN KELAMIN',
    '17,02/11/2025,SUPRIYANTO BIN A.KADIR,56Th,,Uric Acid,Creatinine,Ureum,Albumin,SGPT,SGOT,Bilirubin Total,Eosinofil,Monosit,Limfosit,Neutrofil,MCHC,MCH,MCV,Trombosit,Basofil,Eritrosit,Leukosit,Hematokrit,Hemoglobin,Chlorida,Kalium,Natrium,POLI PENYAKIT DALAM',
    '18,02/11/2025,RESTI HANDAYANI,,62Th,Uric Acid,Creatinine,Ureum,Albumin,SGPT,SGOT,Bilirubin Total,Eosinofil,Monosit,Limfosit,Neutrofil,MCHC,MCH,MCV,Trombosit,Basofil,Eritrosit,Leukosit,Hematokrit,Hemoglobin,Chlorida,Kalium,Natrium,POLI PENYAKIT DALAM',
    '19,02/11/2025,PONIYEM BINTI GIMAN,,56Th,LDL Cholesterol,Trygliserida,Creatinine,Ureum,HBA 1c,POLI PENYAKIT DALAM',
    '20,02/11/2025,TRIA MONICA N,,25Th,Amphetamin (AMP),PAKET NARKOBA,LDL Cholesterol,HDL Cholesterol,Trygliserida,Cholesterol Total,Creatinine,Ureum,SGPT,SGOT,Glukosa 2 Jam / BSPP,Glukosa Puasa /BSN,Eosinofil,Monosit,Limfosit,Neutrofil,Diff,Darah Lengkap,Hematokrit,MCHC,MCH,MCV,Trombosit,LED,Eritrosit,Basofil,Leukosit,Hemoglobin,Kristal,Bakteria,Epitel,Leukosit,Eritrosit,SEDIMEN,Leukosit Esterase,Nitrit,Urobilinogen,Bilirubin,Darah (Urin),Keton,Glukosa (Urin),Protein,Silinder,pH,Berat Jenis,KIMIA URINE,Kejernihan,Warna,MAKROSKOPIS,Urine lengkap,POLI UMUM',
    '21,02/11/2025,JUMINEM BINTI KROMO PAWIRO,,65Th,Uric Acid,POLI PENYAKIT DALAM',
    '22,02/11/2025,SUKINEM BINTI ATMO IRONO,,83Th,Creatinine,Ureum,Glukosa Sewaktu / BSS,Eosinofil,Monosit,Limfosit,Neutrofil,MCHC,MCH,MCV,Trombosit,Basofil,Eritrosit,Leukosit,Hematokrit,Hemoglobin,Unit IGD',
    '23,02/11/2025,SAMINAH,,64Th,LDL Cholesterol,HDL Cholesterol,Uric Acid,Creatinine,Ureum,HBA 1c,POLI PENYAKIT DALAM',
    '24,02/11/2025,SULASTRI BINTI SABAR,,51Th,LDL Cholesterol,Trygliserida,HBA 1c,Glukosa Sewaktu / BSS,POLI PENYAKIT DALAM',
    '25,02/11/2025,SUYUT BIN WIRYO IKROMO,78Th,,Creatinine,Ureum,Glukosa Sewaktu / BSS,Eosinofil,Monosit,Limfosit,Neutrofil,MCHC,MCH,MCV,Trombosit,Basofil,Eritrosit,Leukosit,Hematokrit,Hemoglobin,Unit IGD',
    '26,02/11/2025,SUDIRMAN BIN TARMUDIN,41Th,,Uric Acid,Creatinine,Ureum,Golongan Darah,Eosinofil,Monosit,Limfosit,Neutrofil,MCHC,MCH,MCV,Trombosit,Basofil,Eritrosit,Leukosit,Hematokrit,Hemoglobin,Unit IGD',
    '27,02/11/2025,MISRIANI BINTI SARIMUN,,35Th,Glukosa Sewaktu / BSS,Anti HIV,Golongan Darah,Waktu Pembekuan/Ct,Waktu Perdarahan/Bt,Eosinofil,Monosit,Limfosit,Neutrofil,MCHC,MCH,MCV,Trombosit,Basofil,Eritrosit,Leukosit,Hematokrit,Hemoglobin,Unit IGD',
    '28,02/11/2025,AMSIYAH BINTI ADAM,,55Th,Trygliserida,Cholesterol Total,Uric Acid,Glukosa Sewaktu / BSS,Eosinofil,Monosit,Limfosit,Neutrofil,MCHC,MCH,MCV,Trombosit,Basofil,Eritrosit,Leukosit,Hematokrit,Hemoglobin,Unit IGD',
    '29,02/11/2025,MARSIMAN,70Th,,Natrium / Na,Creatinine,Ureum,Glukosa Sewaktu / BSS,Eosinofil,Monosit,Limfosit,Neutrofil,MCHC,MCH,MCV,Trombosit,Basofil,Eritrosit,Leukosit,Hematokrit,Hemoglobin,Unit IGD',
    '30,03/11/2025,TUMINI BINTI SASTRO,,66Th,Kalium / K,Natrium / Na,Cholesterol Total,Creatinine,Ureum,Glukosa Sewaktu / BSS,Eosinofil,Monosit,Limfosit,Neutrofil,Diff,MCHC,MCH,MCV,Darah Rutin,Trombosit,Basofil,Eritrosit,Leukosit,Hematokrit,Hemoglobin,Unit IGD',
    '31,03/11/2025,SAIBI BIN USMAN,51Th,,T4,T3,TSH,POLI PENYAKIT DALAM',
    '32,03/11/2025,KETUT SUDIARTE,53Th,,Ureum,POLI PENYAKIT DALAM',
    '33,03/11/2025,KETUT SANJAYA,57Th,,Kristal,Bakteria,Epitel,Leukosit,Eritrosit,Leukosit Esterase,Nitrit,Urobilinogen,Bilirubin,Darah (Urin),Keton,Glukosa (Urin),Protein,Silinder,pH,Berat Jenis,Kejernihan,Warna,POLI ANAK',
    '34,03/11/2025,ROHIMAH BINTI WARSIDI,,53Th,Uric Acid,Creatinine,Ureum,Kristal,Bakteria,Epitel,Leukosit,Eritrosit,Leukosit Esterase,Nitrit,Urobilinogen,Bilirubin,Darah (Urin),Keton,Glukosa (Urin),Protein,Silinder,pH,Berat Jenis,Kejernihan,Warna,POLI PENYAKIT DALAM',
    '50,06/11/2025,HALIJAH BINTI AGUS,,40Th,PAKET NARKOBA,POLI UMUM',
    '51,06/11/2025,RESTI WULANDARI,,30Th,Free T4,TSH (Elisa),POLI KEBIDANAN',
    '69,08/11/2025,WAHIRI BIN NGAENAN,59Th,,CPK/CK Nae,Unit IGD',
    '70,08/11/2025,EDI WINARNO,44Th,,BTA Kaki Kiri,BTA Kaki Kanan,BTA Tangan Kiri,BTA Tangan Kanan,BTA Cuping Kiri,BTA Cuping Kanan,Glukosa Sewaktu / BSS,Eosinofil,Monosit,Limfosit,Neutrofil,MCHC,MCH,MCV,Trombosit,Basofil,Eritrosit,Leukosit,Hematokrit,Hemoglobin,POLI KULIT DAN KELAMIN',
    '95,10/11/2025,ISTIKOMAH BINTI MASRONI,,42Th,Dengue IgG,IgM,Unit IGD',
    '108,10/11/2025,DARTIK BINTI SUTRISNO,,65Th,CRP,Unit IGD',
    '118,11/11/2025,ZINEIDIN ZIDANE,11Th,,Calsium / Ca,Natrium / Na,Eosinofil,Monosit,Limfosit,Neutrofil,MCHC,MCH,MCV,Trombosit,Basofil,Eritrosit,Leukosit,Hematokrit,Hemoglobin,POLI ANAK',
    '124,11/11/2025,NUROFIKOSARI BIN SAFII,50Th,,Kalium / K,Natrium / Na,Creatinine,Ureum,Albumin,SGPT,SGOT,Bilirubin Total,Glukosa Sewaktu / BSS,Anti HIV,Anti HCV,CRP,Golongan Darah,Eosinofil,Monosit,Limfosit,Neutrofil,MCHC,MCH,MCV,Trombosit,Basofil,Eritrosit,Leukosit,Hematokrit,Hemoglobin,Hbsag,Unit IGD',
    '144,15/11/2025,AGUNG,19Th,,Anti HIV,POLI VCT',
    '211,21/11/2025,YATI BINTI UJANG,,39Th,T4,T3,TSH,POLI MATA',
    '232,24/11/2025,ARIZUN BIN ERLAN,31Th,,BTA Kaki Kiri,BTA Kaki Kanan,BTA Tangan Kiri,BTA Tangan Kanan,BTA Cuping Kiri,BTA Cuping Kanan,POLI KULIT DAN KELAMIN',
    '260,27/11/2025,MAISAROH BINTI MAHMURI,,48Th,TCM,LDL Cholesterol,Trygliserida,Creatinine,Ureum,HBA 1c,Glukosa Sewaktu / BSS,LED,Leukosit,Hemoglobin,POLI PENYAKIT DALAM',
    '280,28/11/2025,NOVI YANTI,,38Th,T4,T3,TSH,POLI THT',
    '320,30/11/2025,KETUT MUDIASIH,,48Th,Eosinofil,Monosit,Limfosit,Neutrofil,MCHC,MCH,MCV,Trombosit,Basofil,Eritrosit,Leukosit,Hematokrit,Hemoglobin,POLI BEDAH',
    '336,02/12/2025,RAHARJO BIN SUKARNO,58Th,,Anti HIV,Anti HCV,Hemoglobin,Hbsag,INSTALASI HEMODIALISA'
  ];
  fs.writeFileSync(rajalCsvPath, rajalRows.join('\n'));

  // 2. Prepare Rawat Inap Sample CSV
  const ranapCsvPath = path.join(uploadsDir, 'data_pasien_laboratorium_ranap.csv');
  const ranapRows = [
    'No,TGL PERIKSA,NAMA,L,P,PEMERIKSAAN,ASAL PASIEN',
    '1,01/11/2025,LATIN,,71Th,Creatinine,Ureum,Glukosa Sewaktu / BSS,Eosinofil,Monosit,Limfosit,Neutrofil,MCHC,MCH,MCV,Trombosit,Basofil,Eritrosit,Leukosit,Hematokrit,Hemoglobin,ZA.K.3 ZAAL A',
    '2,01/11/2025,RUSMINI BINTI NYAMI,,48Th,Creatinine,Ureum,Glukosa Sewaktu / BSS,Waktu Pembekuan/Ct,Waktu Perdarahan/Bt,Eosinofil,Monosit,Limfosit,Neutrofil,MCHC,MCH,MCV,Trombosit,Basofil,Eritrosit,Leukosit,Hematokrit,Hemoglobin,KMR.1.2 ZAAL E',
    '3,01/11/2025,NURAINI BINTI MUHRI,,62Th,Kalium / K,Natrium / Na,Creatinine,Ureum,Glukosa Sewaktu / BSS,Eosinofil,Monosit,Limfosit,Neutrofil,MCHC,MCH,MCV,Trombosit,Basofil,Eritrosit,Leukosit,Hematokrit,Hemoglobin,ZB.LILI ZAAL B',
    '4,01/11/2025,CICIH BINTI JAMILIN,,55Th,Hemoglobin,ZA.K.2 ZAAL A',
    '5,01/11/2025,LISMAWATI BINTI MARZUKI,,47Th,Hemoglobin,KMR.3.2 ZAAL E',
    '6,01/11/2025,TINI BINTI AHMADI,,93Th,Creatinine,Ureum,Glukosa Sewaktu / BSS,Golongan Darah,Eosinofil,Monosit,Limfosit,Neutrofil,MCHC,MCH,MCV,Trombosit,Basofil,Eritrosit,Leukosit,Hematokrit,Hemoglobin,KMR.1.2 ZAAL E',
    '7,01/11/2025,EVA ULPIANA,,26Th,Hemotokrit,Hemoglobin,ZB.RAF.10 ZAAL B',
    '8,01/11/2025,PONIMAN BIN DUL ROHIM,63Th,,Creatinine,Ureum,Glukosa Sewaktu / BSS,Golongan Darah,Waktu Pembekuan/Ct,Waktu Perdarahan/Bt,Eosinofil,Monosit,Limfosit,Neutrofil,MCHC,MCH,MCV,Trombosit,Basofil,Eritrosit,Leukosit,Hematokrit,Hemoglobin,ZD.CEM.1 ZAAL D',
    '9,01/11/2025,SUPARDI BIN SALIMAN,63Th,,Glukosa Sewaktu / BSS,Eosinofil,Monosit,Limfosit,Neutrofil,MCHC,MCH,MCV,Trombosit,Basofil,Eritrosit,Leukosit,Hematokrit,Hemoglobin,Chlorida,Kalium,Natrium,ZA.K.6 ZAAL A',
    '10,01/11/2025,MURSIAH BINTI WASIRUN,,47Th,Creatinine,Ureum,Glukosa Sewaktu / BSS,Eosinofil,Monosit,Limfosit,Neutrofil,MCHC,MCH,MCV,Trombosit,Basofil,Eritrosit,Leukosit,Hematokrit,Hemoglobin,Kristal,Bakteria,Epitel,Leukosit,Eritrosit,Leukosit Esterase,Nitrit,Urobilinogen,Bilirubin,Darah (Urin),Keton,Glukosa (Urin),Protein,Silinder,pH,Berat Jenis,Kejernihan,Warna,ZA.M.5 ZAAL A',
    '11,01/11/2025,MARYATI BINTI FANDIL,,70Th,Creatinine,Ureum,Glukosa Sewaktu / BSS,Golongan Darah,Eosinofil,Monosit,Limfosit,Neutrofil,MCHC,MCH,MCV,Trombosit,Basofil,Eritrosit,Leukosit,Hematokrit,Hemoglobin,ZA.M.3 ZAAL A',
    '12,01/11/2025,SISWANTO BIN KARTO REJO,62Th,,CKMB,CPK/CK Nae,Creatinine,Ureum,Glukosa Sewaktu / BSS,Golongan Darah,Eosinofil,Monosit,Limfosit,Neutrofil,MCHC,MCH,MCV,Trombosit,Basofil,Eritrosit,Leukosit,Hematokrit,Hemoglobin,HCU.2 HCU',
    '13,01/11/2025,SINTA,,19Th,Glukosa Sewaktu / BSS,ZD.MAH.1 ZAAL D',
    '14,01/11/2025,ERMALASARI BINTI M RIFIN,,23Th,Kalium / K,Natrium / Na,HCU.2 HCU',
    '15,02/11/2025,WARTINI,,58Th,HBA 1c,ICU.1 ICU',
    '16,02/11/2025,YEKTI NINGSIH,,59Th,LDL Cholesterol,Trygliserida,Glukosa Sewaktu / BSS,Eosinofil,Monosit,Limfosit,Neutrofil,MCHC,MCH,MCV,Trombosit,Basofil,Eritrosit,Leukosit,Hematokrit,Hemoglobin,KMR.1.2 ZAAL E',
    '17,02/11/2025,WAHID BIN YASMIN,53Th,,Creatinine,Ureum,Hemoglobin,ZA.K.4 ZAAL A',
    '18,02/11/2025,SIMAN,45Th,,Creatinine,Ureum,Albumin,SGPT,SGOT,Bilirubin Total,Glukosa Sewaktu / BSS,CRP,Eosinofil,Monosit,Limfosit,Neutrofil,MCHC,MCH,MCV,Trombosit,Basofil,Eritrosit,Leukosit,Hematokrit,Hemoglobin,Chlorida,Kalium,Natrium,ICU.2 ICU',
    '19,03/11/2025,BY NY ANIYATI,0Hr,,Glukosa Sewaktu / BSS,CRP,Eosinofil,Monosit,Limfosit,Neutrofil,Hematokrit,MCHC,MCH,MCV,Trombosit,LED,Eritrosit,Basofil,Leukosit,Hemoglobin,NEO.4 NEONATUS',
    '30,03/11/2025,MENIK MULYATI,,14Th,Creatinine,Ureum,Albumin,SGPT,SGOT,Bilirubin Total,Anti HIV,Anti HCV,CRP,Eosinofil,Monosit,Limfosit,Neutrofil,MCHC,MCH,MCV,Trombosit,Basofil,Eritrosit,Leukosit,Hematokrit,Hemoglobin,Chlorida,Kalium,Natrium,ICU.5 ICU',
    '105,11/11/2025,SUPRIYADI BIN RAJAN,78Th,,TCM,ZA.K.3 ZAAL A',
    '208,21/11/2025,DICO KURNIAWAN,0Hr,,Bilirubin Total,NICU.2 NICU',
    '300,30/11/2025,PAIZZUDIN,78Th,,Globulin,Glukosa Sewaktu / BSS,Anti HIV,Anti HCV,Golongan Darah,Hbsag,ZF.ANG.1 ZAAL F',
    '336,04/12/2025,MARYATI BINTI YASEMIN,,48Th,Creatinine,Ureum,Glukosa Sewaktu / BSS,Golongan Darah,Eosinofil,Monosit,Limfosit,Neutrofil,MCHC,MCH,MCV,Trombosit,Basofil,Eritrosit,Leukosit,Hematokrit,Hemoglobin,ZA.K.4 ZAAL A',
    '375,08/12/2025,SURYATI BINTI HABI,,55Th,D-Dimer,Albumin,ZA.B.1 ZAAL A'
  ];
  fs.writeFileSync(ranapCsvPath, ranapRows.join('\n'));

  // Ingest both files through standard ingestion engine
  await ingestService.processUpload({
    tempFilePath: rajalCsvPath,
    originalFileName: 'DATA PASIEN RAWAT JALAN LABORATORIUM TAHUN 2025.csv',
    mimeType: 'text/csv',
    uploadedBy: 'usr-adminlab'
  });

  await ingestService.processUpload({
    tempFilePath: ranapCsvPath,
    originalFileName: 'DATA PASIEN RAWAT INAP LABORATORIUM TAHUN 2025.csv',
    mimeType: 'text/csv',
    uploadedBy: 'usr-adminlab'
  });

  db.prepare('INSERT OR REPLACE INTO system_settings (key, value, description) VALUES (?, ?, ?)').run(
    'INITIAL_SAMPLE_SEEDED', 'true', 'Flag to indicate initial sample dataset was seeded'
  );

  console.log('Sample laboratory dataset successfully ingested into SQLite and mirrored to Google Drive folder storage.');
}
