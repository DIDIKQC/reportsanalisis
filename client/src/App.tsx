import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthScreen } from './components/AuthScreen';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { UploadPage } from './pages/Upload';
import { Patients } from './pages/Patients';
import { Examinations } from './pages/Examinations';
import { TATPage } from './pages/TAT';
import { AnnualReport } from './pages/reports/AnnualReport';
import { ReportsHub } from './pages/reports/ReportsHub';
import { ReportHistory } from './pages/reports/ReportHistory';
import { Templates } from './pages/Templates';
import { RawFiles } from './pages/RawFiles';
import { UploadHistory } from './pages/UploadHistory';
import { AIAnalysis } from './pages/AIAnalysis';
import { MasterData } from './pages/MasterData';
import { UsersPage } from './pages/Users';
import { AuditTrail } from './pages/AuditTrail';
import { SettingsPage } from './pages/Settings';
import { Activity } from 'lucide-react';

function MainApp() {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  if (loading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-950 text-slate-100">
        <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-600 to-sky-400 shadow-xl shadow-cyan-500/20">
          <Activity className="h-8 w-8 text-white animate-pulse" />
        </div>
        <p className="text-sm font-bold text-white tracking-wide">RSUD OKU TIMUR</p>
        <p className="text-xs text-cyan-400">Memuat Sistem Pelaporan & Analisis Laboratorium...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <Layout currentTab={currentTab} onSelectTab={setCurrentTab}>
      {currentTab === 'dashboard' && <Dashboard onNavigateToReport={setCurrentTab} />}
      {currentTab === 'upload' && <UploadPage />}
      {currentTab === 'patients' && <Patients />}
      {currentTab === 'examinations' && <Examinations />}
      {currentTab === 'tat' && <TATPage />}
      {currentTab === 'analytics' && <Dashboard onNavigateToReport={setCurrentTab} />}

      {/* Dedicated Report Menus */}
      {currentTab === 'reports-hub' && <ReportsHub onSelectReport={setCurrentTab} />}
      {currentTab === 'report-tahunan' && <AnnualReport />}
      {currentTab === 'report-bulanan' && <AnnualReport />}
      {currentTab === 'report-tat' && <TATPage />}
      {currentTab === 'report-pasien' && <Patients />}
      {currentTab === 'report-history' && <ReportHistory onSelectReport={setCurrentTab} />}

      {/* System & Configuration Menus */}
      {currentTab === 'templates' && <Templates />}
      {currentTab === 'raw-files' && <RawFiles />}
      {currentTab === 'upload-history' && <UploadHistory />}
      {currentTab === 'ai-analysis' && <AIAnalysis />}
      {currentTab === 'master-data' && <MasterData />}
      {currentTab === 'users' && <UsersPage />}
      {currentTab === 'audit-trail' && <AuditTrail />}
      {currentTab === 'settings' && <SettingsPage />}
    </Layout>
  );
}

export function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
