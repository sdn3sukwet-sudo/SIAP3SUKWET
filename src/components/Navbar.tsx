import { useState, useEffect } from 'react';
import { AuthUser, SekolahProfil } from '../types';
import { store } from '../services/store';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  GraduationCap,
  Sparkles,
  Wallet,
  FileText,
  Settings,
  Database,
  Camera,
  Menu,
  X,
  LogOut,
  ShieldCheck,
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  currentUser: AuthUser;
  onLogout: () => void;
  onOpenKiosk: () => void;
  onOpenSupabaseModal: () => void;
}

export function Navbar({
  activeTab,
  onSelectTab,
  currentUser,
  onLogout,
  onOpenKiosk,
  onOpenSupabaseModal,
}: NavbarProps) {
  const [profil, setProfil] = useState<SekolahProfil>(store.getProfil());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [supabaseConfig, setSupabaseConfig] = useState(store.getSupabaseConfig());

  useEffect(() => {
    const unsub = store.subscribe(() => {
      setProfil(store.getProfil());
      setSupabaseConfig(store.getSupabaseConfig());
    });
    return unsub;
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Ringkasan', icon: LayoutDashboard, roles: ['admin', 'guru'] },
    { id: 'siswa', label: 'Data Siswa', icon: Users, roles: ['admin', 'guru'] },
    { id: 'absensi', label: 'Jurnal Absensi', icon: CalendarCheck, roles: ['admin', 'guru'] },
    { id: 'akademik', label: 'Nilai & Rapor AI', icon: GraduationCap, roles: ['admin', 'guru'] },
    { id: 'bank-soal', label: 'Bank Soal Ujian', icon: Sparkles, roles: ['admin', 'guru'] },
    { id: 'keuangan', label: 'SPP & Tabungan', icon: Wallet, roles: ['admin'] },
    { id: 'izin', label: 'Surat Izin Ortu', icon: FileText, roles: ['admin', 'guru'] },
    { id: 'pengaturan', label: 'Pengaturan', icon: Settings, roles: ['admin'] },
  ];

  const visibleNavItems = navItems.filter((item) =>
    item.roles.includes(currentUser.accountType)
  );

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Brand & Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectTab('dashboard')}
              className="flex items-center gap-3 text-left group"
            >
              <img
                src={profil.logo_url}
                alt={profil.nama_sekolah}
                className="w-11 h-11 object-contain drop-shadow-sm p-0.5 rounded-lg bg-slate-50 border border-slate-200 group-hover:scale-105 transition-transform"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div>
                <span className="text-[10px] font-black tracking-wider uppercase text-blue-600 block">
                  SIAKAD SD TERPADU
                </span>
                <h1 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                  {profil.nama_sekolah}
                </h1>
                <span className="text-[10px] text-slate-400 hidden sm:block">
                  Kec. Sukra, Kab. Indramayu • NPSN {profil.npsn}
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Action Tools & User Profile / Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Supabase Status Pill */}
            <button
              onClick={onOpenSupabaseModal}
              title="Skema Supabase PostgreSQL"
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                supabaseConfig.isConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>{supabaseConfig.isConnected ? 'Supabase Online' : 'Supabase SQL'}</span>
            </button>

            {/* Launch Kiosk Button */}
            <button
              onClick={onOpenKiosk}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
            >
              <Camera className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kiosk Wajah</span>
              <span className="sm:hidden">Kiosk</span>
            </button>

            {/* Authenticated User Badge */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <img
                src={
                  currentUser.avatar ||
                  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop'
                }
                alt={currentUser.nama}
                className="w-8 h-8 rounded-full object-cover border border-slate-300"
              />
              <div className="hidden lg:block text-left">
                <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[140px]">
                  {currentUser.nama.split('(')[0]}
                </div>
                <div className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 uppercase">
                  <ShieldCheck className="w-3 h-3" />
                  <span>
                    {currentUser.accountType === 'admin'
                      ? 'Admin'
                      : currentUser.accountType === 'guru'
                      ? 'Guru'
                      : 'Siswa'}
                  </span>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                title="Keluar dari akun"
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-slate-200"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="xl:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="xl:hidden bg-white border-b border-slate-200 px-4 py-3 space-y-1">
          <div className="p-3 bg-slate-50 rounded-2xl mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img
                src={
                  currentUser.avatar ||
                  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop'
                }
                alt={currentUser.nama}
                className="w-9 h-9 rounded-full object-cover border border-slate-200"
              />
              <div>
                <p className="text-xs font-bold text-slate-900">{currentUser.nama}</p>
                <p className="text-[10px] text-blue-600 font-bold uppercase">
                  Peran: {currentUser.accountType}
                </p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="text-xs font-bold text-rose-600 px-2 py-1 bg-rose-50 rounded-lg"
            >
              Keluar
            </button>
          </div>

          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold text-left flex items-center gap-2.5 ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
