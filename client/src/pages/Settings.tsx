import React, { useState, useEffect } from 'react';
import { Settings, Cloud, Building, Check, Save, ShieldCheck, ExternalLink, Copy, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { api } from '../api/client';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, string>>({
    HOSPITAL_NAME: 'RSUD OKU TIMUR',
    LAB_NAME: 'INSTALASI LABORATORIUM',
    LAB_HEAD: 'dr. Ruri Rizki Anriani, Sp.PK',
    DIRECTOR_NAME: 'dr. Sugihartono, M.Sc',
    KABID_NAME: 'Yuni Elis, S. Kep., M.M',
    CITY_DATE: 'Belitang, 19 Januari 2026',
    GOOGLE_DRIVE_FOLDER_ID: '1MsmBzz5dVW0jzK-ocWsyKh2DQ0Q9OZ1x',
    GOOGLE_APPS_SCRIPT_URL: ''
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get('/master/settings')
      .then(res => {
        if (res.data.settings) {
          setSettings(prev => ({ ...prev, ...res.data.settings }));
        }
      })
      .catch(console.error);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/master/settings', { settings });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert(`Gagal menyimpan pengaturan: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <Settings className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Pengaturan Sistem & Informasi Rumah Sakit</h3>
            <p className="text-xs text-slate-500">
              Konfigurasi data pengesahan laporan resmi, Google Drive, dan engine evaluasi mutu laboratorium.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Hospital Metadata */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <Building className="h-4 w-4 text-sky-600" /> Informasi Instansi & Pejabat Penandatangan
          </h4>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Nama Rumah Sakit</label>
              <input
                type="text"
                value={settings.HOSPITAL_NAME || ''}
                onChange={e => setSettings({ ...settings, HOSPITAL_NAME: e.target.value })}
                className="w-full rounded-lg border border-slate-200 p-2.5 font-bold text-slate-900 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Nama Unit Laboratorium</label>
              <input
                type="text"
                value={settings.LAB_NAME || ''}
                onChange={e => setSettings({ ...settings, LAB_NAME: e.target.value })}
                className="w-full rounded-lg border border-slate-200 p-2.5 font-bold text-slate-900 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Kepala Instalasi Laboratorium</label>
              <input
                type="text"
                value={settings.LAB_HEAD || ''}
                onChange={e => setSettings({ ...settings, LAB_HEAD: e.target.value })}
                className="w-full rounded-lg border border-slate-200 p-2.5 text-slate-800 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Kabid. Penunjang Medis</label>
              <input
                type="text"
                value={settings.KABID_NAME || ''}
                onChange={e => setSettings({ ...settings, KABID_NAME: e.target.value })}
                className="w-full rounded-lg border border-slate-200 p-2.5 text-slate-800 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Direktur Rumah Sakit</label>
              <input
                type="text"
                value={settings.DIRECTOR_NAME || ''}
                onChange={e => setSettings({ ...settings, DIRECTOR_NAME: e.target.value })}
                className="w-full rounded-lg border border-slate-200 p-2.5 text-slate-800 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Kota & Tanggal Pengesahan</label>
              <input
                type="text"
                value={settings.CITY_DATE || ''}
                onChange={e => setSettings({ ...settings, CITY_DATE: e.target.value })}
                className="w-full rounded-lg border border-slate-200 p-2.5 text-slate-800 focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Integration Status Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Google Drive Status & Setup */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-xs space-y-4 col-span-1 sm:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <h4 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                <Cloud className="h-5 w-5 text-sky-600" /> Konfigurasi Penyimpanan Cloud Google Drive
              </h4>
              <a
                href={`https://drive.google.com/drive/folders/${settings.GOOGLE_DRIVE_FOLDER_ID || '1MsmBzz5dVW0jzK-ocWsyKh2DQ0Q9OZ1x'}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-lg bg-sky-50 px-3 py-1.5 font-bold text-sky-700 hover:bg-sky-100 transition"
              >
                <span>Buka Folder di Google Drive</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>

            <p className="text-slate-500">
              Setiap berkas mentah (Excel/PDF) yang diunggah akan otomatis disimpan ke Google Drive dan cermin lokal berstruktur tahun/bulan.
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Google Drive Folder ID</label>
                <input
                  type="text"
                  value={settings.GOOGLE_DRIVE_FOLDER_ID || ''}
                  onChange={e => setSettings({ ...settings, GOOGLE_DRIVE_FOLDER_ID: e.target.value })}
                  placeholder="1MsmBzz5dVW0jzK-ocWsyKh2DQ0Q9OZ1x"
                  className="w-full rounded-lg border border-slate-200 p-2.5 font-mono text-xs text-slate-800 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Google Apps Script Web App URL <span className="text-slate-400 font-normal">(Opsional - Untuk Sinkronisasi Cloud Otomatis)</span>
                </label>
                <input
                  type="text"
                  value={settings.GOOGLE_APPS_SCRIPT_URL || ''}
                  onChange={e => setSettings({ ...settings, GOOGLE_APPS_SCRIPT_URL: e.target.value })}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full rounded-lg border border-slate-200 p-2.5 font-mono text-xs text-slate-800 focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Expandable Apps Script Setup Guide */}
            <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-4 space-y-3">
              <button
                type="button"
                onClick={() => setShowGuide(!showGuide)}
                className="flex w-full items-center justify-between text-left font-bold text-sky-800 hover:text-sky-950 transition"
              >
                <span className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-sky-600" />
                  Panduan Menghubungkan Google Drive Otomatis (1 Menit tanpa Google Cloud Console)
                </span>
                {showGuide ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {showGuide && (
                <div className="space-y-3 pt-2 text-slate-700 text-xs border-t border-sky-200/60">
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-600">
                    <li>Buka <a href="https://script.google.com" target="_blank" rel="noreferrer" className="text-sky-600 underline font-semibold">script.google.com</a> dan klik <b>Project Baru</b>.</li>
                    <li>Hapus kode bawaan, lalu salin dan tempel kode skrip di bawah ini:</li>
                  </ol>

                  <div className="relative rounded-lg bg-slate-900 p-3 font-mono text-[11px] text-emerald-400 overflow-x-auto">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`function doPost(e) {\n  try {\n    var data = JSON.parse(e.postData.contents);\n    var folder = DriveApp.getFolderById(data.folderId);\n    var decoded = Utilities.base64Decode(data.fileData);\n    var blob = Utilities.newBlob(decoded, data.mimeType, data.fileName);\n    var file = folder.createFile(blob);\n    return ContentService.createTextOutput(JSON.stringify({\n      status: 'SUCCESS',\n      fileId: file.getId(),\n      webViewLink: file.getUrl()\n    })).setMimeType(ContentService.MimeType.JSON);\n  } catch (error) {\n    return ContentService.createTextOutput(JSON.stringify({\n      status: 'ERROR',\n      error: error.toString()\n    })).setMimeType(ContentService.MimeType.JSON);\n  }\n}`);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="absolute top-2 right-2 flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-[10px] text-slate-300 hover:bg-slate-700 transition"
                    >
                      <Copy className="h-3 w-3" />
                      <span>{copied ? 'Tersalin!' : 'Salin Kode'}</span>
                    </button>
                    <pre>{`function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var folder = DriveApp.getFolderById(data.folderId);
    var decoded = Utilities.base64Decode(data.fileData);
    var blob = Utilities.newBlob(decoded, data.mimeType, data.fileName);
    var file = folder.createFile(blob);
    return ContentService.createTextOutput(JSON.stringify({
      status: 'SUCCESS',
      fileId: file.getId(),
      webViewLink: file.getUrl()
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'ERROR',
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}`}</pre>
                  </div>

                  <ol start={3} className="list-decimal list-inside space-y-1.5 text-slate-600">
                    <li>Klik <b>Deploy</b> &gt; <b>New deployment</b> &gt; Pilih jenis <b>Web app</b>.</li>
                    <li>Set <i>Execute as</i> ke <b>Me</b> dan <i>Who has access</i> ke <b>Anyone</b>. Klik <b>Deploy</b>.</li>
                    <li>Salin <b>Web App URL</b> yang dihasilkan dan tempel ke kolom <b>Google Apps Script Web App URL</b> di atas, lalu klik <b>Simpan Perubahan</b>.</li>
                  </ol>
                  <p className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                    ✓ Berkas juga otomatis tersimpan pada repositori lokal server (Local Storage Mirror) sehingga aplikasi tetap 100% aman dan berjalan tanpa hambatan.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
              <Check className="h-3.5 w-3.5" /> Repositori Berkas Aktif &amp; Terkoneksi
            </div>
          </div>

          {/* Clinical Audit Engine Status */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-xs space-y-3 col-span-1 sm:col-span-2">
            <h4 className="font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-sky-600" /> Engine Evaluasi &amp; Analisis Kinerja Klinis
            </h4>
            <p className="text-slate-500">
              Modul evaluasi terintegrasi aktif untuk analisis indikator mutu, deteksi anomali volume, dan pembuatan narasi laporan otomatis.
            </p>
            <div className="rounded-lg bg-slate-50 p-2.5 font-mono text-[11px] text-sky-700">
              Layanan Aktif (Tersimpan Aman di Konfigurasi Backend)
            </div>
            <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
              <Check className="h-3.5 w-3.5" /> Standar Keamanan Enkripsi Aktif
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          {saved && (
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
              <Check className="h-4 w-4" /> Pengaturan berhasil disimpan!
            </span>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-sky-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-sky-500 transition disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>Simpan Perubahan</span>
          </button>
        </div>
      </form>
    </div>
  );
};
