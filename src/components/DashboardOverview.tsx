import { useState, useEffect } from 'react';
import { Siswa, Absensi, SekolahProfil, TransaksiKeuangan } from '../types';
import { store } from '../services/store';
import {
  Users,
  UserCheck,
  Clock,
  Sparkles,
  ArrowUpRight,
  Send,
  Calendar,
  Wallet,
  FileSpreadsheet,
  FileText,
  AlertCircle,
} from 'lucide-react';

interface DashboardOverviewProps {
  onNavigateTab: (tab: string) => void;
  onOpenKiosk: () => void;
  onOpenSupabaseModal: () => void;
}

export function DashboardOverview({
  onNavigateTab,
  onOpenKiosk,
  onOpenSupabaseModal,
}: DashboardOverviewProps) {
  const [profil, setProfil] = useState<SekolahProfil>(store.getProfil());
  const [students, setStudents] = useState<Siswa[]>(store.getSiswa());
  const todayDate = new Date().toISOString().split('T')[0];
  const [todayAbsensi, setTodayAbsensi] = useState<Absensi[]>(store.getAbsensi(todayDate));
  const [transaksi, setTransaksi] = useState<TransaksiKeuangan[]>(store.getTransaksi());

  useEffect(() => {
    const unsub = store.subscribe(() => {
      setProfil(store.getProfil());
      setStudents(store.getSiswa());
      setTodayAbsensi(store.getAbsensi(new Date().toISOString().split('T')[0]));
      setTransaksi(store.getTransaksi());
    });
    return unsub;
  }, []);

  const hadirCount = todayAbsensi.filter((a) => a.status === 'Hadir').length;
  const terlambatCount = todayAbsensi.filter((a) => a.status === 'Terlambat').length;
  const sakitIzinCount = todayAbsensi.filter((a) => a.status === 'Sakit' || a.status === 'Izin').length;
  const belumAbsenCount = Math.max(0, students.length - todayAbsensi.length);

  // Financial calculations
  const totalTabungan = students.reduce((sum, s) => sum + (s.saldo_tabungan || 0), 0);
  const totalSppBulanIni = transaksi
    .filter((t) => t.jenis === 'SPP' && t.tipe === 'Masuk')
    .reduce((sum, t) => sum + t.nominal, 0);

  const faceRegisteredCount = students.filter((s) => s.face_registered).length;

  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-900 rounded-3xl p-6 md:p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold text-blue-100 border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>SIAKAD SD & Mode Kiosk Absensi Biometrik Wajah</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
            Selamat Datang di Portal Akademik {profil.nama_sekolah}
          </h2>

          <p className="text-blue-100 text-xs md:text-sm leading-relaxed max-w-2xl">
            Sistem terintegrasi untuk absensi otomatis pengenalan wajah di gerbang sekolah, penilaian rapor cerdas berbasis AI Gemini, manajemen tabungan & SPP siswa, serta gateway notifikasi WhatsApp ke wali murid.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onOpenKiosk}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold rounded-2xl text-xs md:text-sm flex items-center gap-2 shadow-lg hover:shadow-emerald-500/30 transition-all transform hover:-translate-y-0.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Buka Anjungan Kiosk Wajah</span>
            </button>

            <button
              onClick={() => onNavigateTab('akademik')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-2xl text-xs md:text-sm flex items-center gap-2 backdrop-blur-md border border-white/20 transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>Generator Rapor AI</span>
            </button>

            <button
              onClick={onOpenSupabaseModal}
              className="px-4 py-2.5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-200 font-medium rounded-2xl text-xs md:text-sm flex items-center gap-2 backdrop-blur-md border border-teal-400/30 transition-colors"
            >
              <span>Skema Supabase SQL</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Decorative background shapes */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center">
          <img
            src={profil.logo_url}
            alt="Logo Bg"
            className="w-80 h-80 object-contain"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Siswa */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-blue-400 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Siswa Aktif</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl md:text-3xl font-black text-slate-800">
              {students.length}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <span className="font-semibold text-emerald-600">{faceRegisteredCount}</span> wajah terkalibrasi
            </p>
          </div>
        </div>

        {/* Hadir Hari Ini */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-emerald-400 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Hadir Tepat Waktu</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl md:text-3xl font-black text-emerald-600">
              {hadirCount}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Masuk sebelum {profil.jam_masuk} WIB
            </p>
          </div>
        </div>

        {/* Terlambat */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-amber-400 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Terlambat Masuk</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl md:text-3xl font-black text-amber-600">
              {terlambatCount}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Masuk setelah {profil.jam_masuk} WIB
            </p>
          </div>
        </div>

        {/* Sakit / Izin / Belum Hadir */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-indigo-400 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Sakit / Izin / Alpa</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl md:text-3xl font-black text-slate-800">
              {sakitIzinCount} <span className="text-xs font-normal text-slate-400">/ {belumAbsenCount} blm absen</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {sakitIzinCount} surat izin terverifikasi
            </p>
          </div>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-emerald-900 to-teal-950 p-6 rounded-3xl text-white shadow-md flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-300 font-semibold uppercase tracking-wider">
              Total Tabungan Seluruh Siswa
            </span>
            <div className="text-2xl md:text-3xl font-black text-white mt-1">
              Rp {totalTabungan.toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-emerald-200/80 mt-1">
              Dikelola terpercaya di modul Buku Tabungan Sekolah
            </p>
          </div>
          <div className="p-3 bg-white/10 rounded-2xl text-emerald-300">
            <Wallet className="w-8 h-8" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-6 rounded-3xl text-white shadow-md flex items-center justify-between">
          <div>
            <span className="text-xs text-indigo-300 font-semibold uppercase tracking-wider">
              Penerimaan SPP Bulan Ini
            </span>
            <div className="text-2xl md:text-3xl font-black text-white mt-1">
              Rp {totalSppBulanIni.toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-indigo-200/80 mt-1">
              Pencatatan iuran komite terotomatisasi & cetak kuitansi
            </p>
          </div>
          <div className="p-3 bg-white/10 rounded-2xl text-indigo-300">
            <Calendar className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Today's Presensi & Quick Action Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 cols): Today's Attendance Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                Jurnal Kehadiran Siswa Hari Ini
              </h3>
              <p className="text-xs text-slate-500">
                Pembaruan waktu nyata dari Anjungan Kiosk & Surat Izin
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('absensi')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Buka Jurnal Lengkap</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="pb-3">Siswa</th>
                  <th className="pb-3">Kelas</th>
                  <th className="pb-3">Waktu Masuk</th>
                  <th className="pb-3">Metode</th>
                  <th className="pb-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {todayAbsensi.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Belum ada siswa yang melakukan absensi hari ini.
                    </td>
                  </tr>
                ) : (
                  todayAbsensi.slice(0, 6).map((absen) => {
                    const student = students.find((s) => s.id === absen.siswa_id);
                    return (
                      <tr key={absen.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 font-semibold text-slate-800 flex items-center gap-2.5">
                          <img
                            src={
                              student?.foto_url ||
                              'https://images.unsplash.com/photo-1544717305-2782549b5136?w=100&h=100&fit=crop'
                            }
                            alt={student?.nama}
                            className="w-7 h-7 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <div>{student?.nama || 'Siswa'}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {student?.nisn}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-slate-600">{student?.kelas_id || '-'}</td>
                        <td className="py-3 font-mono text-slate-700">{absen.waktu_masuk}</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-medium text-[10px]">
                            {absen.metode}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <span
                            className={`px-2.5 py-0.5 font-bold rounded-full text-[10px] ${
                              absen.status === 'Hadir'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : absen.status === 'Terlambat'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {absen.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right (1 col): Quick Shortcuts & WA Alert Trigger */}
        <div className="space-y-4">
          {/* WA Gateway Quick Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-800">
                  Notifikasi WA Siswa Belum Hadir
                </h4>
                <p className="text-[11px] text-slate-500">
                  Fonnte / Wablas Auto-Notifier
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Kirimkan pemberitahuan instan via WhatsApp ke nomor HP orang tua bagi <strong>{belumAbsenCount} siswa</strong> yang belum melakukan absensi hingga melewati batas jam {profil.jam_masuk}.
            </p>

            <button
              onClick={() => onNavigateTab('absensi')}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Buka Menu Pengiriman WA</span>
            </button>
          </div>

          {/* Quick Module Navigation Links */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">
              Akses Cepat Modul Utama
            </h4>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => onNavigateTab('siswa')}
                className="p-3 rounded-2xl bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-medium flex items-center gap-2 transition-colors border border-slate-100"
              >
                <Users className="w-4 h-4 text-blue-500" />
                <span>Data Siswa</span>
              </button>

              <button
                onClick={() => onNavigateTab('akademik')}
                className="p-3 rounded-2xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 font-medium flex items-center gap-2 transition-colors border border-slate-100"
              >
                <FileText className="w-4 h-4 text-indigo-500" />
                <span>Rapor Siswa</span>
              </button>

              <button
                onClick={() => onNavigateTab('bank-soal')}
                className="p-3 rounded-2xl bg-slate-50 hover:bg-amber-50 hover:text-amber-700 text-slate-700 font-medium flex items-center gap-2 transition-colors border border-slate-100"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Bank Soal AI</span>
              </button>

              <button
                onClick={() => onNavigateTab('keuangan')}
                className="p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 font-medium flex items-center gap-2 transition-colors border border-slate-100"
              >
                <Wallet className="w-4 h-4 text-emerald-500" />
                <span>SPP & Tabungan</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
