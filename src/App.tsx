import { useState, useEffect } from 'react';
import { AuthUser } from './types';
import { Navbar } from './components/Navbar';
import { LoginPage } from './components/LoginPage';
import { SiswaPortal } from './components/SiswaPortal';
import { DashboardOverview } from './components/DashboardOverview';
import { DataSiswa } from './components/DataSiswa';
import { AbsensiManager } from './components/AbsensiManager';
import { AkademikNilai } from './components/AkademikNilai';
import { BankSoalModule } from './components/BankSoalModule';
import { KeuanganTabungan } from './components/KeuanganTabungan';
import { IzinOrtuForm } from './components/IzinOrtuForm';
import { ProfilPengaturan } from './components/ProfilPengaturan';
import { KioskMode } from './components/KioskMode';
import { SupabaseSqlModal } from './components/SupabaseSqlModal';
import { store } from './services/store';

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => store.getCurrentUser());
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isKioskMode, setIsKioskMode] = useState<boolean>(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const unsub = store.subscribe(() => {
      setCurrentUser(store.getCurrentUser());
    });
    return unsub;
  }, []);

  // Check URL query for direct kiosk launch e.g. /?kiosk=true
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('kiosk') === 'true' || params.get('mode') === 'kiosk') {
        setIsKioskMode(true);
      }
    }
  }, []);

  const handleLogout = () => {
    store.logout();
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  // 1. If Kiosk Mode is active, render full-screen Kiosk interface
  if (isKioskMode) {
    return <KioskMode onExitKiosk={() => setIsKioskMode(false)} />;
  }

  // 2. If not logged in, render authentic LoginPage for Admin, Guru, Siswa
  if (!currentUser) {
    return (
      <>
        <LoginPage
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            setActiveTab('dashboard');
          }}
          onOpenKiosk={() => setIsKioskMode(true)}
          onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        />
        <SupabaseSqlModal
          isOpen={isSupabaseModalOpen}
          onClose={() => setIsSupabaseModalOpen(false)}
        />
      </>
    );
  }

  // 3. If logged in as Siswa, render dedicated Siswa Portal
  if (currentUser.accountType === 'siswa') {
    return (
      <SiswaPortal
        user={currentUser}
        onLogout={handleLogout}
        onOpenKiosk={() => setIsKioskMode(true)}
      />
    );
  }

  const profil = store.getProfil();

  // 4. If logged in as Admin or Guru, render SIAKAD SD application
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between text-slate-800 antialiased font-sans">
      <div>
        {/* Navigation Bar */}
        <Navbar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenKiosk={() => setIsKioskMode(true)}
          onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        />

        {/* Main Application Container */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {activeTab === 'dashboard' && (
            <DashboardOverview
              onNavigateTab={setActiveTab}
              onOpenKiosk={() => setIsKioskMode(true)}
              onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
            />
          )}

          {activeTab === 'siswa' && <DataSiswa />}

          {activeTab === 'absensi' && <AbsensiManager />}

          {activeTab === 'akademik' && <AkademikNilai />}

          {activeTab === 'bank-soal' && <BankSoalModule />}

          {activeTab === 'keuangan' && currentUser.accountType === 'admin' && (
            <KeuanganTabungan />
          )}

          {activeTab === 'izin' && <IzinOrtuForm />}

          {activeTab === 'pengaturan' && currentUser.accountType === 'admin' && (
            <ProfilPengaturan onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)} />
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="mt-12 bg-white border-t border-slate-200 py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <img
              src={profil.logo_url}
              alt="Logo"
              className="w-5 h-5 object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <span className="font-bold text-slate-700">
              {profil.nama_sekolah}
            </span>
            <span>• Kabupaten Indramayu</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={() => setIsSupabaseModalOpen(true)}
              className="hover:text-emerald-700 transition-colors"
            >
              Skema Supabase DDL SQL
            </button>
            <span>•</span>
            <button
              onClick={() => setIsKioskMode(true)}
              className="hover:text-blue-700 transition-colors"
            >
              Mode Anjungan Kiosk
            </button>
            <span>•</span>
            <button
              onClick={handleLogout}
              className="hover:text-rose-600 transition-colors"
            >
              Keluar Akun
            </button>
          </div>
        </div>
      </footer>

      {/* Supabase SQL DDL & Config Modal */}
      <SupabaseSqlModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />
    </div>
  );
}
