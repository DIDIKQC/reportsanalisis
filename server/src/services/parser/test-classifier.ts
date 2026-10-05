export function classifyTestCategory(testName: string): string {
  const clean = testName.trim().toLowerCase();

  // 1. Mikrobiologi
  if (
    clean.includes('tcm') ||
    clean.includes('tes cepat molekuler') ||
    clean.includes('bta') ||
    clean.includes('jamur') ||
    clean.includes('diplococcus') ||
    clean.includes('clue cell')
  ) {
    return 'Mikrobiologi';
  }

  // 2. Patologi Anatomi
  if (
    clean.includes('histopatologi') ||
    clean.includes('papsmear') ||
    clean.includes('biopsi') ||
    clean.includes('sitologi')
  ) {
    return 'Patologi Anatomi';
  }

  // 3. Analisis Cairan
  if (clean.includes('cairan') || clean.includes('pleura') || clean.includes('ascites') || clean.includes('liquor')) {
    return 'Analisis Cairan';
  }

  // 4. Hemostasis
  if (
    clean.includes('pembekuan') ||
    clean.includes('perdarahan') ||
    clean.includes('ct') ||
    clean.includes('bt') ||
    clean.includes('d-dimer') ||
    clean.includes('protrombin') ||
    clean.includes('fibrinogen') ||
    clean.includes('inr')
  ) {
    return 'Hemostasis';
  }

  // 5. Imunoserologi
  if (
    clean.includes('hbsag') ||
    clean.includes('hiv') ||
    clean.includes('hcv') ||
    clean.includes('tsh') ||
    clean.includes('t3') ||
    clean.includes('t4') ||
    clean.includes('tpha') ||
    clean.includes('vdrl') ||
    clean.includes('rpr') ||
    clean.includes('sypilis') ||
    clean.includes('crp') ||
    clean.includes('asto') ||
    clean.includes('widal') ||
    clean.includes('typhi') ||
    clean.includes('dengue') ||
    clean.includes('kehamilan') ||
    clean.includes('narkoba') ||
    clean.includes('amphetamin')
  ) {
    return 'Imunoserologi';
  }

  // 6. Klinik Rutin / Urinalisis / Feses
  if (
    clean.includes('urine') ||
    clean.includes('urin') ||
    clean.includes('sedimen') ||
    clean.includes('makroskopis') ||
    clean.includes('kejernihan') ||
    clean.includes('warna') ||
    clean.includes('kristal') ||
    clean.includes('bakteria') ||
    clean.includes('silinder') ||
    clean.includes('esterase') ||
    clean.includes('nitrit') ||
    clean.includes('urobilinogen') ||
    clean.includes('keton') ||
    clean.includes('berat jenis') ||
    clean.includes('ph') ||
    clean.includes('sperma') ||
    clean.includes('cacing') ||
    clean.includes('amoeba') ||
    clean.includes('feses')
  ) {
    return 'Klinik rutin';
  }

  // 7. Hematologi
  if (
    clean.includes('hemoglobin') ||
    clean.includes('hb') ||
    clean.includes('leukosit') ||
    clean.includes('eritrosit') ||
    clean.includes('trombosit') ||
    clean.includes('hematokrit') ||
    clean.includes('mch') ||
    clean.includes('mcv') ||
    clean.includes('mchc') ||
    clean.includes('led') ||
    clean.includes('darah rutin') ||
    clean.includes('darah lengkap') ||
    clean.includes('golongan darah') ||
    clean.includes('eosinofil') ||
    clean.includes('monosit') ||
    clean.includes('limfosit') ||
    clean.includes('neutrofil') ||
    clean.includes('basofil') ||
    clean.includes('hitung jenis') ||
    clean.includes('diff') ||
    clean.includes('gambaran darah tepi')
  ) {
    return 'Hematologi';
  }

  // 8. Kimia Darah (Default chemical / metabolic panel)
  if (
    clean.includes('glukosa') ||
    clean.includes('gula') ||
    clean.includes('bss') ||
    clean.includes('bsn') ||
    clean.includes('bspp') ||
    clean.includes('hba 1c') ||
    clean.includes('hba1c') ||
    clean.includes('creatinine') ||
    clean.includes('kreatinin') ||
    clean.includes('ureum') ||
    clean.includes('sgot') ||
    clean.includes('sgpt') ||
    clean.includes('bilirubin') ||
    clean.includes('albumin') ||
    clean.includes('globulin') ||
    clean.includes('protein total') ||
    clean.includes('kalium') ||
    clean.includes('natrium') ||
    clean.includes('chlorida') ||
    clean.includes('calsium') ||
    clean.includes('cholesterol') ||
    clean.includes('kolesterol') ||
    clean.includes('trigliserid') ||
    clean.includes('trygliserida') ||
    clean.includes('ldl') ||
    clean.includes('hdl') ||
    clean.includes('uric acid') ||
    clean.includes('asam urat') ||
    clean.includes('ckmb') ||
    clean.includes('cpk') ||
    clean.includes('alkaline phosphatase') ||
    clean.includes('rf')
  ) {
    return 'Kimia Darah';
  }

  return 'Kimia Darah';
}
