import { useState, useEffect } from 'react';
import { Siswa, Absensi, StatusAbsensi, SekolahProfil } from '../types';
import { store } from '../services/store';
import { exportAbsensiToExcel } from '../services/excelService';
import { sendWhatsAppNotification, scanAndNotifyUncheckedStudents } from '../services/whatsapp';
import {
  Calendar,
  Filter,
  Download,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  Search,
  Check,
} from 'lucide-react';

export function AbsensiManager() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [selectedKelas, setSelectedKelas] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  const [students, setStudents] = useState<Siswa[]>(store.getSiswa());
  const [absensiList, setAbsensiList] = useState<Absensi[]>(store.getAbsensi(selectedDate));
  const [profil, setProfil] = useState<SekolahProfil>(store.getProfil());

  // WA sending state
  const [isSendingWa, setIsSendingWa] = useState(false);
  const [waNotification, setWaNotification] = useState<string | null>(null);

  useEffect(() => {
    const unsub = store.subscribe(() => {
      setStudents(store.getSiswa());
      setAbsensiList(store.getAbsensi(selectedDate));
      setProfil(store.getProfil());
    });
    return unsub;
  }, [selectedDate]);

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setAbsensiList(store.getAbsensi(date));
  };

  // Change status of attendance directly
  const handleStatusChange = (siswa: Siswa, newStatus: StatusAbsensi) => {
    const existing = absensiList.find((a) => a.siswa_id === siswa.id);
    if (existing) {
      store.updateAbsensiStatus(existing.id, newStatus);
    } else {
      store.recordAbsensi(
        siswa.id,
        newStatus,
        'Manual',
        `Diinput manual oleh Guru/Admin (${newStatus})`
      );
    }
  };

  const handleSendSingleWa = async (siswa: Siswa) => {
    const res = await sendWhatsAppNotification(siswa);
    setWaNotification(
      `Notifikasi WhatsApp berhasil dikirim ke orang tua ${siswa.nama} (${res.no_wa}).`
    );
    setTimeout(() => setWaNotification(null), 4000);
  };

  const handleBulkWaAlerts = async () => {
    setIsSendingWa(true);
    setWaNotification('Sedang mengirimkan notifikasi WA ke seluruh siswa belum absen...');
    try {
      const results = await scanAndNotifyUncheckedStudents();
      setWaNotification(
        `Sukses memproses ${results.length} notifikasi WhatsApp kepada wali murid.`
      );
    } catch {
      setWaNotification('Gagal mengirim WhatsApp.');
    } finally {
      setIsSendingWa(false);
      setTimeout(() => setWaNotification(null), 5000);
    }
  };

  const filteredStudents = students.filter((s) => {
    const matchKelas = selectedKelas === 'Semua' || s.kelas_id === selectedKelas;
    const matchSearch =
      s.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nisn.includes(searchQuery);
    return matchKelas && matchSearch;
  });

  // Calculate stats for this date & filtered students
  const studentMap = new Map(absensiList.map((a) => [a.siswa_id, a]));
  let hadir = 0;
  let terlambat = 0;
  let sakit = 0;
  let izin = 0;
  let belumHadir = 0;

  filteredStudents.forEach((s) => {
    const a = studentMap.get(s.id);
    if (!a) belumHadir++;
    else if (a.status === 'Hadir') hadir++;
    else if (a.status === 'Terlambat') terlambat++;
    else if (a.status === 'Sakit') sakit++;
    else if (a.status === 'Izin') izin++;
    else if (a.status === 'Alpa') belumHadir++;
  });

  const uniqueClasses = ['Semua', 'Kelas 1A', 'Kelas 2A', 'Kelas 3A', 'Kelas 4A', 'Kelas 5A', 'Kelas 6A'];

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800">
            Jurnal & Rekapitulasi Presensi Siswa
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola kehadiran harian, penyesuaian status izin sakit, dan ekspor rekapitulasi Excel
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Date Picker */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
            <Calendar className="w-4 h-4 text-slate-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="bg-transparent text-slate-700 font-bold focus:outline-none"
            />
          </div>

          <button
            onClick={() => exportAbsensiToExcel(absensiList, students, selectedKelas !== 'Semua' ? selectedKelas : undefined)}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors border border-emerald-200"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor Rekap Excel</span>
          </button>

          <button
            onClick={handleBulkWaAlerts}
            disabled={isSendingWa}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSendingWa ? 'Mengirim...' : 'Kirim Alert WA Siswa Belum Absen'}</span>
          </button>
        </div>
      </div>

      {waNotification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{waNotification}</span>
        </div>
      )}

      {/* Stats Counter Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-emerald-50 border border-emerald-200/80 p-3.5 rounded-2xl">
          <span className="text-[11px] font-bold text-emerald-700">Hadir Tepat Waktu</span>
          <div className="text-xl font-black text-emerald-900 mt-1">{hadir} Siswa</div>
        </div>
        <div className="bg-amber-50 border border-amber-200/80 p-3.5 rounded-2xl">
          <span className="text-[11px] font-bold text-amber-700">Terlambat (&gt;{profil.jam_masuk})</span>
          <div className="text-xl font-black text-amber-900 mt-1">{terlambat} Siswa</div>
        </div>
        <div className="bg-blue-50 border border-blue-200/80 p-3.5 rounded-2xl">
          <span className="text-[11px] font-bold text-blue-700">Sakit</span>
          <div className="text-xl font-black text-blue-900 mt-1">{sakit} Siswa</div>
        </div>
        <div className="bg-purple-50 border border-purple-200/80 p-3.5 rounded-2xl">
          <span className="text-[11px] font-bold text-purple-700">Izin</span>
          <div className="text-xl font-black text-purple-900 mt-1">{izin} Siswa</div>
        </div>
        <div className="bg-rose-50 border border-rose-200/80 p-3.5 rounded-2xl col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-rose-700">Belum Hadir / Alpa</span>
          <div className="text-xl font-black text-rose-900 mt-1">{belumHadir} Siswa</div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {uniqueClasses.map((kls) => (
            <button
              key={kls}
              onClick={() => setSelectedKelas(kls)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedKelas === kls
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {kls}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama atau NISN siswa..."
            className="w-full py-2 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3 px-4">Siswa</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4">Waktu Masuk</th>
                <th className="py-3 px-4">Metode</th>
                <th className="py-3 px-4">Status Kehadiran</th>
                <th className="py-3 px-4">Keterangan</th>
                <th className="py-3 px-4 text-right">Notifikasi WA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Tidak ada siswa ditemukan pada kelas ini.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((siswa) => {
                  const absen = studentMap.get(siswa.id);
                  const currentStatus: StatusAbsensi = absen ? absen.status : 'Alpa';

                  return (
                    <tr key={siswa.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={
                              siswa.foto_url ||
                              'https://images.unsplash.com/photo-1544717305-2782549b5136?w=100&h=100&fit=crop'
                            }
                            alt={siswa.nama}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <div className="font-bold text-slate-900">{siswa.nama}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              NISN: {siswa.nisn}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-600 font-medium">{siswa.kelas_id}</td>

                      <td className="py-3 px-4 font-mono text-slate-700">
                        {absen?.waktu_masuk || '-'}
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-medium text-[10px]">
                          {absen?.metode || 'Belum Absen'}
                        </span>
                      </td>

                      {/* Status Selector Dropdown */}
                      <td className="py-3 px-4">
                        <select
                          value={currentStatus}
                          onChange={(e) =>
                            handleStatusChange(siswa, e.target.value as StatusAbsensi)
                          }
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold border focus:outline-none cursor-pointer ${
                            currentStatus === 'Hadir'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : currentStatus === 'Terlambat'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : currentStatus === 'Sakit'
                              ? 'bg-blue-50 text-blue-800 border-blue-300'
                              : currentStatus === 'Izin'
                              ? 'bg-purple-50 text-purple-800 border-purple-300'
                              : 'bg-rose-50 text-rose-800 border-rose-300'
                          }`}
                        >
                          <option value="Hadir">Hadir</option>
                          <option value="Terlambat">Terlambat</option>
                          <option value="Sakit">Sakit</option>
                          <option value="Izin">Izin</option>
                          <option value="Alpa">Alpa / Belum Hadir</option>
                        </select>
                      </td>

                      <td className="py-3 px-4 text-slate-500 text-[11px] max-w-xs truncate">
                        {absen?.keterangan || '-'}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleSendSingleWa(siswa)}
                          title={`Kirim WA ke Orang Tua (${siswa.no_wa_ortu})`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 rounded-lg text-[11px] font-medium transition-colors"
                        >
                          <Send className="w-3 h-3 text-emerald-600" />
                          <span>Kirim WA</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
