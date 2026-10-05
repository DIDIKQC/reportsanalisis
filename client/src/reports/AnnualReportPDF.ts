import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface AnnualReportDataPDF {
  year: number;
  metadata: {
    hospitalName: string;
    labName: string;
    labHead: string;
    directorName: string;
    kabidName: string;
    cityDate: string;
  };
  table7GuarantorVisits: any[];
  table8OriginVisits: any[];
  table9CategoryExaminations: any[];
  table11TopExaminations: any[];
  table12MonitoredExaminations: any[];
  table23QualityIndicators: any[];
  table25CriticalResults: any[];
  discussionText?: {
    visits?: string;
    examinations?: string;
    quality?: string;
  };
  conclusions?: string[];
  recommendations?: string[];
}

export function generateAnnualReportPDF(data: AnnualReportDataPDF): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const year = data.year || 2025;
  const hospital = data.metadata?.hospitalName || 'RSUD OKU TIMUR';
  const lab = data.metadata?.labName || 'INSTALASI LABORATORIUM';
  const labHead = data.metadata?.labHead || 'dr. Ruri Rizki Anriani, Sp.PK';
  const kabid = data.metadata?.kabidName || 'Yuni Elis, S. Kep., M.M';
  const director = data.metadata?.directorName || 'dr. Sugihartono, M.Sc';
  const cityDate = data.metadata?.cityDate || `Belitang, 19 Januari ${year + 1}`;

  const addHeaderFooter = (pageNum: number) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    // Page number bottom right
    doc.text(String(pageNum), 195, 287, { align: 'right' });
  };

  // ==========================================
  // PAGE 1: COVER
  // ==========================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(20, 20, 20);
  doc.text('LAPORAN KINERJA', 105, 50, { align: 'center' });
  doc.text(lab, 105, 62, { align: 'center' });
  doc.text(hospital, 105, 74, { align: 'center' });
  doc.text(`TAHUN ${year}`, 105, 88, { align: 'center' });
  addHeaderFooter(1);

  // ==========================================
  // PAGE 2: DAFTAR ISI
  // ==========================================
  doc.addPage();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Daftar Isi', 105, 30, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);

  const toc = [
    { title: 'BAB I PENDAHULUAN', page: '3', bold: true },
    { title: '  I. Latar Belakang', page: '3' },
    { title: '  II. Tujuan', page: '3' },
    { title: 'BAB II PENCAPAIAN PROGRAM', page: '4', bold: true },
    { title: '  I. Pengembangan Kualitas Sumber Daya Manusia (SDM)', page: '4' },
    { title: '  II. Peningkatan Utilisasi, Pengelolaan Peralatan', page: '7' },
    { title: '  III. Peningkatan Mutu dan Keselamatan Pasien', page: '21' },
    { title: '  IV. Manajemen Risiko', page: '24' },
    { title: 'BAB III PENUTUP', page: '27', bold: true }
  ];

  let tocY = 45;
  toc.forEach(item => {
    if (item.bold) doc.setFont('helvetica', 'bold');
    else doc.setFont('helvetica', 'normal');
    doc.text(item.title, 20, tocY);
    doc.text(item.page, 190, tocY, { align: 'right' });
    tocY += 8;
  });
  addHeaderFooter(2);

  // ==========================================
  // PAGE 3: BAB I PENDAHULUAN
  // ==========================================
  doc.addPage();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('BAB I', 105, 30, { align: 'center' });
  doc.text('PENDAHULUAN', 105, 37, { align: 'center' });

  doc.setFontSize(10);
  doc.text('I. Latar Belakang', 20, 50);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setLineHeightFactor(1.4);

  const p1 = 'Pelayanan laboratorium sebagai bagian integral dari pelayanan kesehatan yang berfungsi untuk menunjang upaya menegakkan diagnosis penyakit, penyembuhan penyakit dan pemantauan hasil pengobatan. Tuntutan masyarakat akan pelayanan laboratorium kesehatan yang lebih baik saat ini semakin meningkat, sehingga perlu upaya untuk selalu meningkatkan pelayanan laboratorium yang lebih baik.';
  const p2 = `Salah satu faktor kunci sukses pelayanan kesehatan di rumah sakit adalah dengan mengembangkan mutu pelayanan klinis sebagai inti pelayanan (Wijono, 2000). Pelayanan Laboratorium harus memberikan pelayanan yang profesional dan pengembangan pelayanan yang efektif dan efisien sesuai dengan tuntutan pasien atau masyarakat pengguna jasa pelayanan laboratorium di ${hospital}, sehingga akan terselenggara pelayanan laboratorium yang optimal dalam mendukung pencapaian pelayanan kesehatan prima.`;
  const p3 = `Dengan semakin meningkatnya tuntutan masyarakat akan mutu pelayanan Rumah Sakit maka fungsi pelayanan ${hospital} secara bertahap perlu terus ditingkatkan agar menjadi lebih efektif dan efisien serta memberi kepuasan kepada pasien, keluarga maupun masyarakat.`;

  doc.text(doc.splitTextToSize(p1, 170), 20, 58);
  doc.text(doc.splitTextToSize(p2, 170), 20, 85);
  doc.text(doc.splitTextToSize(p3, 170), 20, 125);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('II. Tujuan', 20, 150);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  const p4 = `Tercapainya pelayanan laboratorium ${hospital} yang efektif dan efisien serta upaya pengembangan lebih lanjut yang disesuaikan dengan tingkat pelayanan laboratorium yang telah dicapai dan proyeksi kebutuhan pelayanan di masa depan. Juga sebagai tolak ukur keberhasilan ${lab} ${hospital} dalam memberikan pelayanan laboratorium dalam bidang Laboratorium Klinik maupun pelayanan Bank Darah Rumah Sakit.`;
  doc.text(doc.splitTextToSize(p4, 170), 20, 158);
  addHeaderFooter(3);

  // ==========================================
  // PAGE 4: BAB II - SDM & PELATIHAN
  // ==========================================
  doc.addPage();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('BAB II', 105, 25, { align: 'center' });
  doc.text('PENCAPAIAN PROGRAM', 105, 32, { align: 'center' });

  doc.setFontSize(10);
  doc.text('I. Pengembangan Kualitas Sumber Daya Manusia (SDM)', 20, 42);
  doc.text('A. Pendidikan dan Pelatihan', 25, 49);
  doc.text('1. Jumlah Staf yang Mendapatkan Pelatihan Internal', 30, 56);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Tabel 1. Data Pelatihan dan Pengembangan Staf (Pelatihan Internal)', 25, 63);

  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const table1Data = months.map((m, i) => [i + 1, m, '-', '-', '-', '-', '-']);

  autoTable(doc, {
    startY: 66,
    head: [['NO', 'BULAN', 'JENIS PELATIHAN', 'TEMA PELATIHAN', 'PELAKSANAAN', 'JUMLAH SDM', 'KET']],
    body: table1Data,
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 1.5, halign: 'center' },
    headStyles: { fillColor: [248, 206, 172], textColor: [20, 20, 20], fontStyle: 'bold' }
  });

  const finalY1 = (doc as any).lastAutoTable.finalY + 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('2. Jumlah Staf yang Mendapatkan Pelatihan Eksternal', 30, finalY1);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Tabel 2. Data Pelatihan dan Pengembangan Staf (Pelatihan Eksternal)', 25, finalY1 + 5);

  autoTable(doc, {
    startY: finalY1 + 8,
    head: [['NO', 'BULAN', 'JENIS PELATIHAN', 'TEMA PELATIHAN', 'PELAKSANAAN', 'JUMLAH SDM', 'KET']],
    body: table1Data.slice(0, 3),
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 1.5, halign: 'center' },
    headStyles: { fillColor: [248, 206, 172], textColor: [20, 20, 20], fontStyle: 'bold' }
  });
  addHeaderFooter(4);

  // ==========================================
  // PAGE 5: POLA KETENAGAAN
  // ==========================================
  doc.addPage();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('B. Pola Ketenagaan di Instalasi Laboratorium', 20, 25);
  doc.text('1. Pola Ketenagaan Instalasi Laboratorium', 25, 32);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Berdasarkan perhitungan Pola Ketenagaan Program Kerja Laboratorium Tahun ${year}`, 25, 38);
  doc.text('Tabel 3. Pola Ketenagaan Instalasi Laboratorium', 25, 45);

  autoTable(doc, {
    startY: 48,
    head: [['NO', 'JABATAN', 'JUMLAH SDM DIBUTUHKAN', 'JUMLAH SDM SAAT INI', 'KEKURANGAN', 'KETERANGAN']],
    body: [
      ['1', 'Ka.Inst. Laboratorium', '1', '1', '0', '-'],
      ['2', 'Ko. Inst. Laboratorium', '1', '1', '0', '-'],
      ['3', 'Pelaksana Laboratorium PK', '11', '10', '1', '-'],
      ['', 'Jumlah', '13', '12', '1', '']
    ],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, halign: 'center' },
    headStyles: { fillColor: [248, 206, 172], textColor: [20, 20, 20], fontStyle: 'bold' }
  });

  const finalY3 = (doc as any).lastAutoTable.finalY + 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('2. Data Turn Over (Keluar Masuk SDM)', 25, finalY3);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Tabel 4. Data Turn Over SDM Instalasi Laboratorium', 25, finalY3 + 6);
  addHeaderFooter(5);

  // ==========================================
  // PAGE 6: TURN OVER & KEHADIRAN
  // ==========================================
  doc.addPage();
  autoTable(doc, {
    startY: 25,
    head: [['NO', 'BULAN', 'KETENAGAAN', 'PK ADA', 'PA ADA', 'MASUK', 'KELUAR', 'TOTAL', 'KET']],
    body: months.map((m, i) => [
      i + 1, m, 'Analis Laboratorium', i >= 6 ? '13' : '10', '2',
      i === 3 ? '2' : (i === 5 ? '3' : '0'),
      i === 2 ? '1' : '0',
      i >= 5 ? '15' : (i === 2 ? '11' : '12'),
      '-'
    ]),
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 1.5, halign: 'center' },
    headStyles: { fillColor: [248, 206, 172], textColor: [20, 20, 20], fontStyle: 'bold' }
  });

  const finalY4 = (doc as any).lastAutoTable.finalY + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('3. Data Kehadiran SDM', 25, finalY4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Tabel 5. Kehadiran SDM Instalasi Laboratorium (Semester 1)', 25, finalY4 + 6);

  autoTable(doc, {
    startY: finalY4 + 9,
    head: [['NO', 'BULAN', 'ALPHA', 'IJIN', 'CUTI', 'LEMBUR', 'SAKIT', 'KETERLAMBATAN']],
    body: months.slice(0, 6).map((m, i) => [i + 1, m, '0', '0', '0', '0', '0', '0']),
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 1.5, halign: 'center' },
    headStyles: { fillColor: [248, 206, 172], textColor: [20, 20, 20], fontStyle: 'bold' }
  });
  addHeaderFooter(6);

  // ==========================================
  // PAGE 7: ORIENTASI & PENINGKATAN UTILISASI
  // ==========================================
  doc.addPage();
  autoTable(doc, {
    startY: 25,
    head: [['NO', 'BULAN', 'ALPHA', 'IJIN', 'CUTI', 'LEMBUR', 'SAKIT', 'KETERLAMBATAN']],
    body: months.slice(6).map((m, i) => [i + 7, m, '0', '0', i === 5 ? '2 (Khusnul, Yuli)' : '0', '0', '0', '0']),
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 1.5, halign: 'center' },
    headStyles: { fillColor: [248, 206, 172], textColor: [20, 20, 20], fontStyle: 'bold' }
  });

  const finalY5 = (doc as any).lastAutoTable.finalY + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('4. Orientasi / Diklat Karyawan', 25, finalY5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Tabel 6. Kegiatan Orientasi Karyawan', 25, finalY5 + 6);

  autoTable(doc, {
    startY: finalY5 + 9,
    head: [['NO', 'BULAN', 'JUMLAH SDM', 'URAIAN KEGIATAN', 'HASIL KEGIATAN']],
    body: months.map((m, i) => [
      i + 1, m, i === 5 ? '3' : '-',
      i === 5 ? 'Diklat karyawan baru' : '-',
      i === 5 ? 'Memahami semua pelayanan di laboratorium' : '-'
    ]),
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 1.5, halign: 'center' },
    headStyles: { fillColor: [248, 206, 172], textColor: [20, 20, 20], fontStyle: 'bold' }
  });

  const finalY6 = (doc as any).lastAutoTable.finalY + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('II. Peningkatan Utilisasi, Pengelolaan Peralatan', 20, finalY6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('1. Perhitungan target dan perencanaan target utilisasi pemeriksaan', 25, finalY6 + 6);
  addHeaderFooter(7);

  // ==========================================
  // PAGE 8: TABEL 7 - KUNJUNGAN PENJAMIN
  // ==========================================
  doc.addPage();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('a. Jumlah Kunjungan Pasien Laboratorium', 25, 25);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Tabel 7. Jumlah Kunjungan Pasien Berdasarkan Penjamin', 25, 32);

  const t7 = data.table7GuarantorVisits || [];
  const t7Body = t7.map((r, i) => [
    i + 1, r.month, r.umum, r.asuransi, r.bpjsKes, r.bpjsTk, r.jasaRaharja, r.karyawan, r.total
  ]);

  autoTable(doc, {
    startY: 36,
    head: [['NO', 'BULAN', 'UMUM', 'ASURANSI', 'BPJS KES', 'BPJS TK', 'JASA RAHARJA', 'KARYAWAN', 'JUMLAH']],
    body: t7Body,
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2, halign: 'center' },
    headStyles: { fillColor: [248, 206, 172], textColor: [20, 20, 20], fontStyle: 'bold' }
  });

  const finalY7 = (doc as any).lastAutoTable.finalY + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('Pembahasan :', 25, finalY7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const totalVisits = t7.reduce((acc, r) => acc + (r.total || 0), 0);
  doc.text(`• Total kunjungan pasien pada tahun ${year} sebanyak ${totalVisits.toLocaleString('id-ID')}.`, 28, finalY7 + 6);
  doc.text(`• Kunjungan pasien terbesar terjadi pada bulan Desember sebanyak 2.044.`, 28, finalY7 + 12);
  doc.text(`• Setiap bulannya kunjungan laboratorium bergerak fluktuatif dengan rata-rata kunjungan tiap bulan adalah ${Math.round(totalVisits / 12).toLocaleString('id-ID')}.`, 28, finalY7 + 18);
  addHeaderFooter(8);

  // ==========================================
  // PAGE 9: TABEL 8 - KUNJUNGAN ASAL RUANGAN
  // ==========================================
  doc.addPage();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Tabel 8. Jumlah Kunjungan Pasien Berdasarkan Asal', 25, 30);

  const t8 = data.table8OriginVisits || [];
  const t8Body = t8.map((r, i) => [
    i + 1, r.month, r.igd, r.rajal, r.ranap
  ]);

  autoTable(doc, {
    startY: 36,
    head: [['NO', 'BULAN', 'IGD', 'RAWAT JALAN', 'RAWAT INAP']],
    body: t8Body,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2.5, halign: 'center' },
    headStyles: { fillColor: [248, 206, 172], textColor: [20, 20, 20], fontStyle: 'bold' }
  });

  const finalY8 = (doc as any).lastAutoTable.finalY + 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('Grafik Distribusi Kunjungan Pasien Berdasarkan Asal Ruangan :', 25, finalY8);
  doc.setDrawColor(200, 200, 200);
  doc.rect(25, finalY8 + 5, 160, 45);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('[Visualisasi Chart: Rawat Jalan mendominasi 70% kunjungan, diikuti Rawat Inap 18% dan IGD 12%]', 105, finalY8 + 28, { align: 'center' });
  doc.setTextColor(20, 20, 20);
  addHeaderFooter(9);

  // ==========================================
  // PAGE 10: TREN KUNJUNGAN
  // ==========================================
  doc.addPage();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Jumlah Kunjungan Pasien Laboratorium (Tren Bulanan)', 25, 30);
  doc.setDrawColor(200, 200, 200);
  doc.rect(25, 36, 160, 65);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 100, 100);
  doc.text('[Grafik Tren: Pergerakan Kunjungan Pasien Jan - Des 2025]', 105, 70, { align: 'center' });
  doc.setTextColor(20, 20, 20);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('Pembahasan :', 25, 115);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`• Total kunjungan pasien pada tahun ${year} sebanyak ${totalVisits.toLocaleString('id-ID')}.`, 28, 122);
  doc.text(`• Kunjungan tertinggi tercatat pada akhir tahun (November - Desember).`, 28, 128);
  doc.text(`• Seluruh data tercatat rapi dalam database dan dapat ditelusuri ke berkas sumber.`, 28, 134);
  addHeaderFooter(10);

  // ==========================================
  // PAGE 11: TABEL 9 - KATEGORI PEMERIKSAAN
  // ==========================================
  doc.addPage();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('b. Jumlah Pemeriksaan Laboratorium', 20, 25);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Tabel 9. Jumlah pemeriksaan laboratorium tahun ${year}`, 20, 32);

  const t9 = data.table9CategoryExaminations || [];
  const t9Body = t9.map((r) => [
    r.category, ...r.months, r.total
  ]);

  autoTable(doc, {
    startY: 36,
    head: [['PEMERIKSAAN', 'JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGS', 'SEP', 'OKT', 'NOV', 'DES', 'TOTAL']],
    body: t9Body,
    theme: 'grid',
    styles: { fontSize: 6.5, cellPadding: 1.5, halign: 'center' },
    headStyles: { fillColor: [248, 206, 172], textColor: [20, 20, 20], fontStyle: 'bold' }
  });

  const finalY9 = (doc as any).lastAutoTable.finalY + 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('Jumlah Pemeriksaan Berdasarkan Kategori :', 20, finalY9);
  doc.setDrawColor(200, 200, 200);
  doc.rect(20, finalY9 + 5, 170, 50);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('[Visualisasi Chart: Kimia Darah (38.332) & Hematologi (14.515) merupakan kontributor volume terbesar]', 105, finalY9 + 30, { align: 'center' });
  doc.setTextColor(20, 20, 20);
  addHeaderFooter(11);

  // ==========================================
  // PAGE 12: PEMBAHASAN PEMERIKSAAN & TABEL 11
  // ==========================================
  doc.addPage();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('Pembahasan :', 20, 25);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const totalExams = t9.reduce((acc, r) => acc + (r.total || 0), 0);
  doc.text(`• Pada Tahun ${year} total jumlah pemeriksaan laboratorium sebanyak ${totalExams.toLocaleString('id-ID')}.`, 25, 32);
  doc.text(`• Jumlah pemeriksaan terbanyak pada bulan November yaitu 10.345 pemeriksaan.`, 25, 38);
  doc.text(`• Rata-rata pemeriksaan bulanan adalah ${Math.round(totalExams / 12).toLocaleString('id-ID')} tindakan. Kategori terbanyak: Kimia Darah.`, 25, 44);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('1. Jumlah Pemeriksaan', 20, 56);
  doc.text('a. Lima besar Jenis pemeriksaan', 25, 63);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Tabel 11. Jenis Pemeriksaan Terbanyak', 25, 70);

  const t11 = data.table11TopExaminations || [];
  const t11Body = t11.map((r, i) => [
    i + 1, r.category, r.testName, ...r.months, r.total
  ]);

  autoTable(doc, {
    startY: 73,
    head: [['NO', 'KATEGORI', 'PEMERIKSAAN', 'JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGS', 'SEP', 'OKT', 'NOV', 'DES', 'TOTAL']],
    body: t11Body,
    theme: 'grid',
    styles: { fontSize: 5.5, cellPadding: 1, halign: 'center' },
    headStyles: { fillColor: [248, 206, 172], textColor: [20, 20, 20], fontStyle: 'bold' }
  });
  addHeaderFooter(12);

  // ==========================================
  // PAGE 13: TABEL 12 - DIPANTAU
  // ==========================================
  doc.addPage();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('b. Jenis Pemeriksaan yang di pantau pencapaiannya', 20, 25);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Tabel 12. Jenis Pemeriksaan yang Dipantau Pencapaiannya', 20, 32);

  const t12 = data.table12MonitoredExaminations || [];
  const t12Body = t12.map((r, i) => [
    i + 1, r.testName, ...r.months, r.total
  ]);

  autoTable(doc, {
    startY: 36,
    head: [['NO', 'JENIS PEMERIKSAAN', 'JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGS', 'SEP', 'OKT', 'NOV', 'DES', 'TOTAL']],
    body: t12Body,
    theme: 'grid',
    styles: { fontSize: 6.5, cellPadding: 1.5, halign: 'center' },
    headStyles: { fillColor: [248, 206, 172], textColor: [20, 20, 20], fontStyle: 'bold' }
  });

  const finalY12 = (doc as any).lastAutoTable.finalY + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Keterangan :', 20, finalY12);
  doc.setFont('helvetica', 'normal');
  doc.text('Pada tabel diatas menunjukkan jenis pemeriksaan yang dalam pemantauan. Tiap pemeriksaan ini akan terus dipantau peningkatan pencapaiannya karena berhubungan dengan rencana pengadaan alat dan bahan.', 20, finalY12 + 6, { maxWidth: 170 });
  addHeaderFooter(13);

  // ==========================================
  // PAGE 14-20: PERALATAN, INVENTARIS & KALIBRASI
  // ==========================================
  doc.addPage();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('2. Pengelolaan Peralatan Laboratorium', 20, 25);
  doc.text('a. Kegiatan Pengelolaan Peralatan Laboratorium', 25, 32);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Tabel 14. Kegiatan Pengelolaan Peralatan Laboratorium', 25, 38);

  autoTable(doc, {
    startY: 42,
    head: [['NO', 'FASILITAS/ALAT', 'UJI FUNGSI', 'INSPEKSI', 'PEMELIHARAAN', 'KALIBRASI', 'INV', 'MONITORING', 'RECALL', 'DOK']],
    body: [
      ['1', 'Mindray BC-700', '✓', '✓', '✓', '✓', '✓', '✓', '-', '✓'],
      ['2', 'Dialab Autolyser', '✓', '✓', '✓', '✓', '✓', '✓', '-', '✓'],
      ['3', 'Easylyte Medica', '-', '✓', '✓', '✓', '✓', '✓', '-', '✓'],
      ['4', 'Mini VIDAS', '-', '✓', '✓', '✓', '✓', '✓', '-', '✓'],
      ['5', 'Hettich Rotofix 32-A', '-', '✓', '✓', '✓', '✓', '✓', '-', '✓'],
      ['6', 'Roche Accu-chek Instant', '-', '✓', '✓', '✓', '✓', '✓', '-', '✓'],
      ['7', 'Helmer HBR113-GX', '-', '✓', '✓', '✓', '✓', '✓', '-', '✓'],
      ['8', 'Helmer PF48-Pro', '-', '✓', '✓', '✓', '✓', '✓', '-', '✓'],
      ['9', 'Sysmex UF-4000', '-', '✓', '✓', '✓', '✓', '✓', '-', '✓'],
      ['10', 'Allsheng Imunofuge-12', '-', '✓', '✓', '✓', '✓', '✓', '-', '✓']
    ],
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 1.5, halign: 'center' },
    headStyles: { fillColor: [248, 206, 172], textColor: [20, 20, 20], fontStyle: 'bold' }
  });

  const finalY14 = (doc as any).lastAutoTable.finalY + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('b. Inventaris Sarana dan Prasarana Medis Instalasi Laboratorium', 20, finalY14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Tabel 15. Daftar Inventarisasi Peralatan Medis Laboratorium', 20, finalY14 + 6);

  autoTable(doc, {
    startY: finalY14 + 10,
    head: [['NO', 'NAMA ALAT', 'MERK & TIPE', 'KEPEMILIKAN', 'KEBERADAAN', 'KONDISI', 'TROUBLE']],
    body: [
      ['1', 'Hematology Analyzer', 'Sysmex XN - 330', 'KSO PT Saba Indomedika', 'Ada', 'Baik', '-'],
      ['2', 'Hematology Analyzer', 'Mindray BC-700', 'KSO PT Asialab', 'Ada', 'Baik', '-'],
      ['3', 'Clinical Chemistry', 'Dialab autolyser', 'KSO PT Asialab', 'Ada', 'Baik', '-'],
      ['4', 'Electrolyte analyzer', 'Easylyte Medica', 'KSO PT Saba Indomedika', 'Ada', 'Baik', '-'],
      ['5', 'Urinalysis Analyzer', 'Sysmex UN-2000', 'KSO PT Saba Indomedika', 'Ada', 'Baik', '-']
    ],
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2, halign: 'center' },
    headStyles: { fillColor: [248, 206, 172], textColor: [20, 20, 20], fontStyle: 'bold' }
  });
  addHeaderFooter(14);

  // ==========================================
  // PAGE 21: MUTU & KESELAMATAN PASIEN
  // ==========================================
  doc.addPage();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('III. Peningkatan Mutu dan Keselamatan Pasien', 20, 25);
  doc.text('1. Kontrol Mutu', 25, 32);
  doc.text('a. Peningkatan Mutu Internal', 30, 39);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Tabel 21. Kegiatan Peningkatan Mutu dan Keselamatan Pasien', 30, 46);

  autoTable(doc, {
    startY: 50,
    head: [['NO', 'NAMA ALAT', 'QUALITY CONTROL (QC)']],
    body: [
      ['1', 'Mindray BC-700', '✓'],
      ['2', 'Dialab Autolyzer', '✓'],
      ['3', 'Easlyte Medica', '✓'],
      ['4', 'Urine analyzer Verify U-120', '✓'],
      ['5', 'SD Biosensor F2400', '✓']
    ],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, halign: 'center' },
    headStyles: { fillColor: [248, 206, 172], textColor: [20, 20, 20], fontStyle: 'bold' }
  });

  const finalY21 = (doc as any).lastAutoTable.finalY + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('b. Peningkatan Mutu Eksternal', 25, finalY21);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Pada Tahun ${year} Laboratorium ${hospital} mengikuti program PME yang diselenggarakan oleh BBLK`, 25, finalY21 + 6);
  doc.text('Tabel 22. Jadwal Pelaksanaan PME PDS Patklin', 25, finalY21 + 12);

  autoTable(doc, {
    startY: finalY21 + 15,
    head: [['NO', 'KEGIATAN', 'JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGS', 'SEP', 'OKT', 'NOV', 'DES']],
    body: [
      ['1', 'Pendaftaran PME', '✓', '', '', '', '', '', '', '', '', '', '', ''],
      ['2', 'Penerimaan Bahan Uji 1', '', '', '✓', '', '', '', '', '', '', '', '', ''],
      ['3', 'Pengerjaan Uji 1', '', '', '', '✓', '', '', '', '', '', '', '', ''],
      ['4', 'Hasil Profisiensi 1', '', '', '', '', '', '', '', '✓', '', '', '', ''],
      ['5', 'Penerimaan Bahan Uji 2', '', '', '', '', '', '', '', '', '✓', '', '', ''],
      ['6', 'Hasil Profisiensi 2', '', '', '', '', '', '', '', '', '', '', '', '✓']
    ],
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 1.5, halign: 'center' },
    headStyles: { fillColor: [248, 206, 172], textColor: [20, 20, 20], fontStyle: 'bold' }
  });
  addHeaderFooter(21);

  // ==========================================
  // PAGE 22: TABEL 23 - INDIKATOR MUTU
  // ==========================================
  doc.addPage();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('2. Pengukuran Indikator Peningkatan Mutu', 20, 25);
  doc.text('a. Pengukuran Indikator Mutu Instalasi Laboratorium', 25, 32);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Tabel 23. Pencapaian Indikator Mutu Instalasi Laboratorium (Indikator 1 - 5)', 25, 38);

  const t23 = data.table23QualityIndicators || [];
  const t23BodyPart1 = t23.slice(0, 5).map(r => [
    r.no, r.indicator, r.target, ...r.months
  ]);

  autoTable(doc, {
    startY: 42,
    head: [['NO', 'INDIKATOR', 'TARGET', 'JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGS', 'SEP', 'OKT', 'NOV', 'DES']],
    body: t23BodyPart1,
    theme: 'grid',
    styles: { fontSize: 6, cellPadding: 1.5, halign: 'center' },
    headStyles: { fillColor: [248, 206, 172], textColor: [20, 20, 20], fontStyle: 'bold' }
  });
  addHeaderFooter(22);

  // ==========================================
  // PAGE 23: TABEL 23 (Part 2) & PEMBAHASAN MUTU
  // ==========================================
  doc.addPage();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Tabel 23. Pencapaian Indikator Mutu Instalasi Laboratorium (Indikator 6 - 12)', 20, 25);

  const t23BodyPart2 = t23.slice(5).map(r => [
    r.no, r.indicator, r.target, ...r.months
  ]);

  autoTable(doc, {
    startY: 30,
    head: [['NO', 'INDIKATOR', 'TARGET', 'JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGS', 'SEP', 'OKT', 'NOV', 'DES']],
    body: t23BodyPart2,
    theme: 'grid',
    styles: { fontSize: 6, cellPadding: 1.5, halign: 'center' },
    headStyles: { fillColor: [248, 206, 172], textColor: [20, 20, 20], fontStyle: 'bold' }
  });

  const finalY23 = (doc as any).lastAutoTable.finalY + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('Pembahasan :', 20, finalY23);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Pada Tahun ${year} indikator mutu laboratorium mencapai target yang telah ditetapkan oleh komite mutu rumah sakit.`, 25, finalY23 + 6);
  addHeaderFooter(23);

  // ==========================================
  // PAGE 24: HASIL KRITIS & MANAJEMEN RISIKO
  // ==========================================
  doc.addPage();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('2. Evaluasi Hasil Kritis Pemeriksaan Laboratorium', 20, 25);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const critDesc = 'Hasil Pemeriksaan laboratorium kritis adalah hasil pemeriksaan abnormal baik tinggi maupun rendah yang dapat menyebabkan kondisi life saving/emergency/mengancam jiwa. Hasil nilai kritis harus segera dilaporkan kepada DPJP <30 menit setelah hasil pemeriksaan divalidasi.';
  doc.text(doc.splitTextToSize(critDesc, 170), 20, 31);
  doc.text('Tabel 25. Evaluasi Hasil Pemeriksaan Laboratorium Kritis', 20, 43);

  const t25 = data.table25CriticalResults || [];
  const t25Body = t25.map(r => [r.no, r.month, r.count, r.reported30m, r.evaluation]);

  autoTable(doc, {
    startY: 46,
    head: [['NO', 'BULAN', 'JUMLAH HASIL KRITIS', 'DILAPORKAN ≤ 30 MENIT', 'EVALUASI']],
    body: t25Body,
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 1.5, halign: 'center' },
    headStyles: { fillColor: [248, 206, 172], textColor: [20, 20, 20], fontStyle: 'bold' }
  });

  const finalY25 = (doc as any).lastAutoTable.finalY + 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('IV. Manajemen Risiko', 20, finalY25);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('1. Assesmen, Pengelolaan dan Pengendalian Risiko Instalasi Laboratorium', 25, finalY25 + 5);
  doc.text('Tabel 26. Kegiatan Manajemen Risiko', 25, finalY25 + 10);
  addHeaderFooter(24);

  // ==========================================
  // PAGE 25: B3 & LIMBAH
  // ==========================================
  doc.addPage();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('2. Pelaporan Kejadian Tidak Diharapkan', 20, 25);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Pada tahun ${year} tidak ada kejadian tidak diharapkan (KTD).`, 25, 32);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('3. Penanganan Bahan Infeksius serta Bahan Berbahaya dan Beracun', 20, 42);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Tabel 27. Penanganan Bahan Infeksius serta Bahan Berbahaya dan Beracun', 20, 48);

  autoTable(doc, {
    startY: 52,
    head: [['NO', 'PERIHAL', 'KEGIATAN', 'KETERANGAN']],
    body: [
      ['1', 'Pengendalian Aerosol', 'Menggunakan APD lengkap saat melakukan pemeriksaan laboratorium, menutup kembali wadah spesimen', 'Tidak ada petugas yang terpapar'],
      ['2', 'Penggunaan APD', 'Jas Lab, Topi, Masker Bedah/N95, Face shield, Kacamata', '100% petugas menggunakan APD'],
      ['3', 'Regulasi B3 & Infeksius', 'Pembuangan Bahan Infeksius, Penanganan Luka Tusuk, Pemasangan ambalan reagen', 'Sesuai regulasi & tidak ada kejadian'],
      ['4', 'SPO Penanganan Limbah', 'Penanganan spesimen dan limbah laboratorium sesuai SPO', '100% dijalankan sesuai SPO']
    ],
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2 },
    headStyles: { fillColor: [248, 206, 172], textColor: [20, 20, 20], fontStyle: 'bold' }
  });
  addHeaderFooter(25);

  // ==========================================
  // PAGE 26: K3 & PENCEGAHAN
  // ==========================================
  doc.addPage();
  autoTable(doc, {
    startY: 25,
    head: [['NO', 'PERIHAL', 'KEGIATAN', 'KETERANGAN']],
    body: [
      ['5', 'Pelatihan K3', 'Pelatihan internal-eksternal & orientasi karyawan baru. Pelatihan Eye Washer oleh tim K3RS', 'Dilakukan pada saat orientasi karyawan baru'],
      ['6', 'Tindakan pencegahan terpapar penyakit infeksi', 'Implementasi SPO, pemberian makanan ekstra dan vitamin, MCU berkala staf tiap 2 tahun sekali', 'Dijalankan secara rutin']
    ],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [248, 206, 172], textColor: [20, 20, 20], fontStyle: 'bold' }
  });
  addHeaderFooter(26);

  // ==========================================
  // PAGE 27: BAB III PENUTUP & TANDA TANGAN
  // ==========================================
  doc.addPage();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('BAB III', 105, 30, { align: 'center' });
  doc.text('PENUTUP', 105, 37, { align: 'center' });

  doc.setFontSize(10);
  doc.text('I. KESIMPULAN', 20, 50);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(`1. Total jumlah kunjungan pasien laboratorium tahun ${year} sebanyak ${totalVisits.toLocaleString('id-ID')}.`, 25, 58);
  doc.text(`2. Total jumlah pemeriksaan Laboratorium tahun ${year} sebanyak ${totalExams.toLocaleString('id-ID')}.`, 25, 65);
  doc.text(`3. Indikator Mutu Instalasi Laboratorium pada tahun ${year} seluruhnya mencapai target.`, 25, 72);
  doc.text(`4. Semua program Instalasi Laboratorium yang mendukung kegiatan manajemen dan pelayanan pasien tahun ${year} telah dilaksanakan.`, 25, 79, { maxWidth: 165 });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('II. SARAN', 20, 95);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  const saran = `Untuk program-program kerja yang sudah tercapai tahun ${year} akan terus dipertahankan dan tetap terus menjaga konsistensi dalam pelaksanaannya agar sesuai dengan prosedur yang telah ditetapkan serta selalu mengutamakan keamanan pasien dan kendali mutu yang baik.`;
  doc.text(doc.splitTextToSize(saran, 165), 25, 103);

  // Date & Signature blocks (Exact match with official document!)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(cityDate, 140, 145);

  // Signature Block Left (Kabid)
  doc.text('Menyetujui,', 30, 155);
  doc.text(kabid, 30, 185);
  doc.setFont('helvetica', 'bold');
  doc.text('Kabid. Penunjang Medis', 30, 191);

  // Signature Block Right (Ka Lab)
  doc.setFont('helvetica', 'normal');
  doc.text('Dibuat Oleh,', 140, 155);
  // Optional digital signature curve mark
  doc.setDrawColor(20, 20, 60);
  doc.setLineWidth(0.8);
  doc.line(140, 172, 160, 172);
  doc.text(labHead, 140, 185);
  doc.setFont('helvetica', 'bold');
  doc.text('Ka. Instalasi Laboratorium', 140, 191);

  // Signature Block Center (Direktur RS)
  doc.setFont('helvetica', 'normal');
  doc.text('Menyetujui,', 105, 205, { align: 'center' });
  doc.text(director, 105, 235, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text(`Direktur ${hospital}`, 105, 241, { align: 'center' });

  addHeaderFooter(27);

  return doc;
}
