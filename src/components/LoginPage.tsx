import { useState } from 'react';
import { AccountType, AuthUser, SekolahProfil } from '../types';
import { store } from '../services/store';
import {
  ShieldCheck,
  GraduationCap,
  User,
  Lock,
  Camera,
  ArrowRight,
  AlertCircle,
  Sparkles,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: AuthUser) => void;
  onOpenKiosk: () => void;
  onOpenSupabaseModal: () => void;
}

export function LoginPage({
  onLoginSuccess,
  onOpenKiosk,
  onOpenSupabaseModal,
}: LoginPageProps) {
  const [profil] = useState<SekolahProfil>(store.getProfil());
  const [accountType, setAccountType] = useState<AccountType>('admin');

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleTabChange = (type: AccountType) => {
    setAccountType(type);
    setErrorMessage(null);
    if (type === 'admin') {
      setUsername('admin');
      setPassword('admin123');
    } else if (type === 'guru') {
      setUsername('guru');
      setPassword('guru123');
    } else {
      setUsername('0123456781');
      setPassword('123456');
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    setTimeout(() => {
      const result = store.login(username, password, accountType);
      setIsLoading(false);
      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setErrorMessage(result.message);
      }
    }, 400);
  };

  const handleFastDemoLogin = (type: AccountType) => {
    handleTabChange(type);
    let u = 'admin';
    let p = 'admin123';
    if (type === 'guru') {
      u = 'guru';
      p = 'guru123';
    } else if (type === 'siswa') {
      u = '0123456781';
      p = '123456';
    }

    const result = store.login(u, p, type);
    if (result.success && result.user) {
      onLoginSuccess(result.user);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 flex flex-col justify-between p-4 sm:p-6 text-slate-100">
      {/* Top Banner with Kiosk shortcut */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <img
            src={profil.logo_url}
            alt="Logo Sekolah"
            className="w-10 h-10 object-contain drop-shadow-md rounded-xl bg-white/10 p-1"
          />
          <div>
            <h1 className="text-sm sm:text-base font-black text-white tracking-tight leading-none">
              {profil.nama_sekolah}
            </h1>
            <p className="text-[11px] text-blue-200">Kabupaten Indramayu • NPSN {profil.npsn}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSupabaseModal}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-xl text-xs font-semibold transition-colors"
          >
            <span>Supabase DDL</span>
          </button>

          <button
            onClick={onOpenKiosk}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold rounded-xl text-xs shadow-lg transition-all"
          >
            <Camera className="w-4 h-4" />
            <span>Mode Kiosk Absensi</span>
          </button>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="max-w-lg w-full mx-auto my-6 bg-white/95 backdrop-blur-xl text-slate-800 rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
        {/* Card Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-6 text-white text-center relative">
          <div className="w-16 h-16 bg-white rounded-2xl p-1.5 mx-auto mb-3 shadow-md">
            <img
              src={profil.logo_url}
              alt="Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="text-xl font-black tracking-tight">Portal Masuk SIAKAD SD</h2>
          <p className="text-xs text-blue-100 mt-0.5">
            Silakan pilih peran akun Anda untuk mengakses sistem
          </p>
        </div>

        {/* Account Type Selector Tabs */}
        <div className="grid grid-cols-3 p-2 bg-slate-100 gap-1.5 border-b border-slate-200">
          <button
            type="button"
            onClick={() => handleTabChange('admin')}
            className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
              accountType === 'admin'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-white hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Admin</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('guru')}
            className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
              accountType === 'guru'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-white hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Guru</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('siswa')}
            className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
              accountType === 'siswa'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-white hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Siswa</span>
          </button>
        </div>

        {/* Login Form */}
        <div className="p-6 sm:p-8 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {accountType === 'siswa'
                  ? 'Nomor Induk Siswa Nasional (NISN)'
                  : accountType === 'guru'
                  ? 'NIP / Username Guru'
                  : 'Username Administrator'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={
                    accountType === 'siswa'
                      ? 'Contoh: 0123456781'
                      : accountType === 'guru'
                      ? 'Contoh: guru atau NIP'
                      : 'Contoh: admin'
                  }
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 font-mono text-slate-900"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {accountType === 'siswa' ? 'PIN / Sandi Siswa' : 'Kata Sandi'}
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 font-mono text-slate-900"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md transition-all ${
                accountType === 'admin'
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : accountType === 'guru'
                  ? 'bg-indigo-600 hover:bg-indigo-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              <span>{isLoading ? 'Memverifikasi Akun...' : `Masuk Sebagai ${accountType.toUpperCase()}`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Access Bar */}
          <div className="pt-4 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">
              Akses Cepat Pengujian (1-Klik):
            </p>
            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleFastDemoLogin('admin')}
                className="py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold border border-blue-200 transition-colors text-center"
              >
                Login Admin
              </button>
              <button
                type="button"
                onClick={() => handleFastDemoLogin('guru')}
                className="py-1.5 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold border border-indigo-200 transition-colors text-center"
              >
                Login Guru
              </button>
              <button
                type="button"
                onClick={() => handleFastDemoLogin('siswa')}
                className="py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-bold border border-emerald-200 transition-colors text-center"
              >
                Login Siswa
              </button>
            </div>
            <div className="mt-2.5 text-[10px] text-slate-400 text-center leading-relaxed">
              Default password: <code>admin123</code> (Admin), <code>guru123</code> (Guru), <code>123456</code> (Siswa).
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-500">
          Untuk absensi harian otomatis, silakan menuju{' '}
          <button
            onClick={onOpenKiosk}
            className="text-emerald-600 font-bold hover:underline"
          >
            Anjungan Kiosk Wajah &rarr;
          </button>
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="text-center text-xs text-slate-500 max-w-6xl mx-auto py-2">
        © 2026 UPTD SD Negeri 3 Sukra Wetan • Sistem Informasi Akademik & Presensi Cerdas
      </footer>
    </div>
  );
}
