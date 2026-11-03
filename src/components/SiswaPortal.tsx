import { useState, useEffect } from 'react';
import { AuthUser, Siswa, Absensi, NilaiSiswa, TransaksiKeuangan, SekolahProfil } from '../types';
import { store } from '../services/store';
import { generateRaporPDF } from '../services/pdfService';
import { IzinOrtuForm } from './IzinOrtuForm';
import { BankSoalModule } from './BankSoalModule';
import {
  GraduationCap,
  CalendarCheck,
  Wallet,
  Sparkles,
  FileText,
  Printer,
  LogOut,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  Phone,
} from 'lucide-react';

interface SiswaPortalProps {
  user: AuthUser;
  onLogout: () => void;
  onOpenKiosk: () => void;
}

export function SiswaPortal({ user, onLogout, onOpenKiosk }: SiswaPortalProps) {
  const [activeTab, setActiveTab] = useState<'rapor' | 'presensi' | 'tabungan' | 'ujian' | 'izin'>('rapor');
  const [students, setStudents] = useState<Siswa[]>(store.getSiswa());
  const profil: SekolahProfil = store.getProfil();

  // Find the logged-in student record
  const student = students.find(
    (s) => s.id === user.studentId || s.nisn === user.username
  ) || students[0];

  const today = new Date().toISOString().split('T')[0];
  const [myAbsensi, setMyAbsensi] = useState<Absensi[]>([]);
  const [myNilai, setMyNilai] = useState<NilaiSiswa[]>([]);
  const [myTransaksi, setMyTransaksi] = useState<TransaksiKeuangan[]>([]);

  useEffect(() => {
    const unsub = store.subscribe(() => {
      setStudents(store.getSiswa());
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (student) {
      const allAbsen = store.getAbsensi();
      setMyAbsensi(allAbsen.filter((a) => a.siswa_id === student.id));
      setMyNilai(store.getNilai(student.id));
      setMyTransaksi(store.getTransaksi(student.id));
    }
  }, [student]);

  if (!student) {
    return (
      <div className="p-8 text-center">
        <p>Data profil siswa tidak ditemukan.</p>
        <button onClick={onLogout} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl">
          Kembali ke Login
        </button>
      </div>
    );
  }

  // Check today's attendance status
  const todayAttendance = myAbsensi.find((a) => a.tanggal === today);

  // Grade averages
  const totalScore = myNilai.reduce(
    (acc, curr) => acc + Math.round(curr.nilai_harian * 0.4 + curr.nilai_uts * 0.3 + curr.nilai_uas * 0.3),
    0
  );
  const avgScore = myNilai.length > 0 ? Math.round(totalScore / myNilai.length) : 85;

  const handleDownloadRaporPDF = () => {
    const aiNote =
      myNilai.find((n) => n.catatan_ai)?.catatan_ai ||
      `Ananda ${student.nama} menunjukkan proses belajar yang aktif dan kepribadian yang santun selama proses pembelajaran di kelas ${student.kelas_id}.`;
    generateRaporPDF(student, myNilai, profil, aiNote);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between text-slate-800 antialiased font-sans">
      <div>
        {/* Siswa Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={profil.logo_url}
                alt="Logo"
                className="w-10 h-10 object-contain rounded-lg p-0.5 bg-slate-50 border border-slate-200"
              />
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">
                  Portal Siswa SD
                </span>
                <h1 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                  {profil.nama_sekolah}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onOpenKiosk}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-bold border border-emerald-200 transition-colors"
              >
                <span>Anjungan Kiosk</span>
              </button>

              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
          {/* Student Profile Hero Card */}
          <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
              <img
                src={
                  student.foto_url ||
                  'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&h=200&fit=crop'
                }
                alt={student.nama}
                className="w-24 h-24 rounded-3xl object-cover border-4 border-white/20 shadow-lg"
              />
              <div className="space-y-1">
                <span className="px-3 py-1 bg-white/20 text-emerald-200 rounded-full text-xs font-bold inline-block">
                  {student.kelas_id}
                </span>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">{student.nama}</h2>
                <p className="text-xs text-emerald-100 font-mono">
                  NISN: {student.nisn} • NIS: {student.nis}
                </p>
                <p className="text-xs text-emerald-200">
                  Wali Murid: {student.nama_ortu || '-'} ({student.no_wa_ortu})
                </p>
              </div>
            </div>

            {/* Quick Stats Badges */}
            <div className="flex sm:flex-col gap-3 w-full sm:w-auto">
              <div className="flex-1 bg-white/10 backdrop-blur-md border border-white/15 p-3 rounded-2xl text-center sm:text-right">
                <span className="text-[10px] text-emerald-200 uppercase font-bold block">
                  Status Hari Ini
                </span>
                <span className="text-sm font-black text-white flex items-center justify-center sm:justify-end gap-1 mt-0.5">
                  {todayAttendance ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      <span>{todayAttendance.status} ({todayAttendance.waktu_masuk})</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 text-yellow-300" />
                      <span>Belum Absen</span>
                    </>
                  )}
                </span>
              </div>

              <div className="flex-1 bg-white/10 backdrop-blur-md border border-white/15 p-3 rounded-2xl text-center sm:text-right">
                <span className="text-[10px] text-emerald-200 uppercase font-bold block">
                  Saldo Tabungan Saya
                </span>
                <span className="text-sm font-black text-white block mt-0.5">
                  Rp {(student.saldo_tabungan || 0).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
            <button
              onClick={() => setActiveTab('rapor')}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'rapor'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Rapor & Nilai Saya</span>
            </button>

            <button
              onClick={() => setActiveTab('presensi')}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'presensi'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Riwayat Presensi</span>
            </button>

            <button
              onClick={() => setActiveTab('tabungan')}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'tabungan'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>Buku Tabungan</span>
            </button>

            <button
              onClick={() => setActiveTab('ujian')}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'ujian'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Latihan Soal CBT</span>
            </button>

            <button
              onClick={() => setActiveTab('izin')}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'izin'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Kirim Izin Sakit</span>
            </button>
          </div>

          {/* TAB 1: Rapor & Nilai Saya */}
          {activeTab === 'rapor' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Laporan Hasil Belajar Peserta Didik
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tahun Ajaran 2026/2027 • Semester Ganjil • Kurikulum Merdeka
                  </p>
                </div>

                <button
                  onClick={handleDownloadRaporPDF}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>Unduh Rapor PDF Resmi</span>
                </button>
              </div>

              {/* Table of Grades */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-200">
                      <th className="py-3 px-3">Mata Pelajaran</th>
                      <th className="py-3 px-3 text-center">Nilai Harian</th>
                      <th className="py-3 px-3 text-center">UTS</th>
                      <th className="py-3 px-3 text-center">UAS</th>
                      <th className="py-3 px-3 text-center">Nilai Akhir</th>
                      <th className="py-3 px-3 text-right">Predikat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {myNilai.map((item) => {
                      const finalScore = Math.round(
                        item.nilai_harian * 0.4 + item.nilai_uts * 0.3 + item.nilai_uas * 0.3
                      );
                      const predikat = finalScore >= 90 ? 'A (Sangat Baik)' : finalScore >= 80 ? 'B (Baik)' : 'C (Cukup)';

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/60">
                          <td className="py-3 px-3 font-semibold text-slate-800">
                            {item.mata_pelajaran}
                          </td>
                          <td className="py-3 px-3 text-center font-mono">{item.nilai_harian}</td>
                          <td className="py-3 px-3 text-center font-mono">{item.nilai_uts}</td>
                          <td className="py-3 px-3 text-center font-mono">{item.nilai_uas}</td>
                          <td className="py-3 px-3 text-center font-black text-slate-900 text-sm">
                            {finalScore}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-md font-bold text-[10px]">
                              {predikat}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Catatan Karakter & AI */}
              <div className="bg-emerald-50/70 border border-emerald-200 p-5 rounded-2xl space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <h4 className="font-bold text-xs text-emerald-950 uppercase tracking-wider">
                    Catatan Capaian Pembelajaran & Perkembangan Karakter:
                  </h4>
                </div>
                <p className="text-xs text-emerald-900 leading-relaxed">
                  {myNilai.find((n) => n.catatan_ai)?.catatan_ai ||
                    `Ananda ${student.nama} menunjukkan pencapaian yang membanggakan pada semester ini dengan rata-rata nilai ${avgScore}. Ananda aktif dalam pembelajaran, memiliki sikap santun kepada guru dan rukun dengan teman sebaya.`}
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: Presensi Saya */}
          {activeTab === 'presensi' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-800">
                Riwayat Kehadiran Ananda
              </h3>
              <p className="text-xs text-slate-500">
                Pencatatan waktu nyata dari Anjungan Absensi Wajah dan Izin Orang Tua
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-200">
                      <th className="py-3 px-3">Tanggal</th>
                      <th className="py-3 px-3">Jam Masuk</th>
                      <th className="py-3 px-3">Metode</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {myAbsensi.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          Belum ada riwayat absensi tercatat.
                        </td>
                      </tr>
                    ) : (
                      myAbsensi.map((absen) => (
                        <tr key={absen.id} className="hover:bg-slate-50/60">
                          <td className="py-3 px-3 font-mono font-bold text-slate-800">{absen.tanggal}</td>
                          <td className="py-3 px-3 font-mono text-slate-600">{absen.waktu_masuk}</td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px]">
                              {absen.metode}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
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
                          <td className="py-3 px-3 text-slate-500 text-[11px]">{absen.keterangan || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Buku Tabungan Saya */}
          {activeTab === 'tabungan' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Buku Tabungan Siswa
                  </h3>
                  <p className="text-xs text-slate-500">
                    Mutasi setoran dan penarikan tabungan sekolah
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Saldo Akhir</span>
                  <div className="text-xl font-black text-emerald-600">
                    Rp {(student.saldo_tabungan || 0).toLocaleString('id-ID')}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-200">
                      <th className="py-3 px-3">Tanggal</th>
                      <th className="py-3 px-3">Keterangan</th>
                      <th className="py-3 px-3">Tipe</th>
                      <th className="py-3 px-3">Nominal</th>
                      <th className="py-3 px-3">Petugas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {myTransaksi.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          Belum ada transaksi tabungan tercatat.
                        </td>
                      </tr>
                    ) : (
                      myTransaksi.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/60">
                          <td className="py-3 px-3 font-mono text-slate-600">{t.tanggal}</td>
                          <td className="py-3 px-3 font-semibold text-slate-800">{t.keterangan}</td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                t.tipe === 'Masuk'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {t.tipe}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-black text-slate-900">
                            {t.tipe === 'Masuk' ? '+' : '-'} Rp {t.nominal.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3 px-3 text-slate-500 text-[11px]">{t.petugas}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: Latihan Soal CBT */}
          {activeTab === 'ujian' && <BankSoalModule />}

          {/* TAB 5: Kirim Izin Sakit */}
          {activeTab === 'izin' && <IzinOrtuForm />}
        </main>
      </div>

      {/* Footer */}
      <footer className="mt-12 bg-white border-t border-slate-200 py-6 px-4 text-center text-xs text-slate-500">
        © 2026 UPTD SD Negeri 3 Sukra Wetan • Portal Akademik Peserta Didik
      </footer>
    </div>
  );
}
