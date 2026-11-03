import { useState, useRef } from 'react';
import { Siswa } from '../types';
import { store } from '../services/store';
import {
  importSiswaFromExcel,
  exportSiswaToExcel,
  downloadTemplateSiswaExcel,
} from '../services/excelService';
import { FaceRegisterModal } from './FaceRegisterModal';
import {
  Search,
  Plus,
  Upload,
  Download,
  FileSpreadsheet,
  Camera,
  Trash2,
  Edit,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Phone,
} from 'lucide-react';

export function DataSiswa() {
  const [students, setStudents] = useState<Siswa[]>(store.getSiswa());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKelas, setSelectedKelas] = useState('Semua');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Siswa | null>(null);
  const [calibratingStudent, setCalibratingStudent] = useState<Siswa | null>(null);

  // Excel import status
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    nisn: '',
    nis: '',
    nama: '',
    kelas_id: 'Kelas 4A',
    jenis_kelamin: 'L' as 'L' | 'P',
    nama_ortu: '',
    no_wa_ortu: '',
    alamat: '',
  });

  const refreshList = () => {
    setStudents(store.getSiswa());
  };

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormData({
      nisn: '',
      nis: '',
      nama: '',
      kelas_id: selectedKelas !== 'Semua' ? selectedKelas : 'Kelas 4A',
      jenis_kelamin: 'L',
      nama_ortu: '',
      no_wa_ortu: '08',
      alamat: '',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (s: Siswa) => {
    setEditingStudent(s);
    setFormData({
      nisn: s.nisn,
      nis: s.nis,
      nama: s.nama,
      kelas_id: s.kelas_id,
      jenis_kelamin: s.jenis_kelamin,
      nama_ortu: s.nama_ortu || '',
      no_wa_ortu: s.no_wa_ortu,
      alamat: s.alamat || '',
    });
    setIsAddModalOpen(true);
  };

  const handleSubmitStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nisn || !formData.nama) return;

    if (editingStudent) {
      const updated: Siswa = {
        ...editingStudent,
        ...formData,
      };
      store.addOrUpdateSiswa(updated);
    } else {
      const newSiswa: Siswa = {
        id: 'sis-' + Date.now(),
        ...formData,
        face_registered: false,
        saldo_tabungan: 0,
      };
      store.addOrUpdateSiswa(newSiswa);
    }

    refreshList();
    setIsAddModalOpen(false);
  };

  const handleDelete = (id: string, nama: string) => {
    if (confirm(`Hapus data siswa ${nama}? Data presensi terkait akan tetap ada.`)) {
      store.deleteSiswa(id);
      refreshList();
    }
  };

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportMessage(null);

    const result = await importSiswaFromExcel(file);
    setIsImporting(false);

    if (result.success) {
      result.data.forEach((s) => {
        store.addOrUpdateSiswa(s as Siswa);
      });
      refreshList();
      setImportMessage(
        `Sukses mengimpor ${result.importedCount} data siswa dari file Excel!`
      );
    } else {
      setImportMessage(`Gagal impor: ${result.errors.join(', ')}`);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
    setTimeout(() => setImportMessage(null), 5000);
  };

  const filteredStudents = students.filter((s) => {
    const matchKelas = selectedKelas === 'Semua' || s.kelas_id === selectedKelas;
    const matchSearch =
      s.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nisn.includes(searchQuery) ||
      s.nis.includes(searchQuery);
    return matchKelas && matchSearch;
  });

  const uniqueClasses = ['Semua', 'Kelas 1A', 'Kelas 2A', 'Kelas 3A', 'Kelas 4A', 'Kelas 5A', 'Kelas 6A'];

  return (
    <div className="space-y-6">
      {/* Title & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-800">
            Data Siswa & Kalibrasi Wajah
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola profil peserta didik, nomor WhatsApp orang tua, dan pendaftaran biometrik face-api
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Hidden File Input for Excel */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleExcelImport}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors border border-emerald-200"
          >
            <Upload className="w-4 h-4" />
            <span>{isImporting ? 'Mengimpor...' : 'Impor Excel'}</span>
          </button>

          <button
            onClick={() => exportSiswaToExcel(students)}
            className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors border border-slate-200"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor Excel</span>
          </button>

          <button
            onClick={downloadTemplateSiswaExcel}
            title="Download Template Format Excel"
            className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl text-xs transition-colors border border-slate-200"
          >
            <FileSpreadsheet className="w-4 h-4" />
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Siswa</span>
          </button>
        </div>
      </div>

      {importMessage && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-2xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{importMessage}</span>
          </div>
          <button onClick={() => setImportMessage(null)} className="text-blue-500 hover:text-blue-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
        {/* Class Filter Tabs */}
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

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama atau NISN..."
            className="w-full py-2 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Student Cards / Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3 px-4">Siswa</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4">L/P</th>
                <th className="py-3 px-4">WhatsApp Ortu</th>
                <th className="py-3 px-4">Tabungan</th>
                <th className="py-3 px-4 text-center">Status Wajah Biometrik</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Tidak ada data siswa ditemukan untuk kriteria pencarian ini.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((siswa) => (
                  <tr key={siswa.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Student Info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            siswa.foto_url ||
                            'https://images.unsplash.com/photo-1544717305-2782549b5136?w=100&h=100&fit=crop'
                          }
                          alt={siswa.nama}
                          className="w-9 h-9 rounded-xl object-cover border border-slate-200"
                        />
                        <div>
                          <div className="font-bold text-slate-900">{siswa.nama}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            NISN: {siswa.nisn} | NIS: {siswa.nis}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-700">
                      {siswa.kelas_id}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          siswa.jenis_kelamin === 'L'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-pink-50 text-pink-700'
                        }`}
                      >
                        {siswa.jenis_kelamin}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      <div className="flex items-center gap-1.5 font-mono">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{siswa.no_wa_ortu}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {siswa.nama_ortu || 'Wali Murid'}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-800">
                      Rp {(siswa.saldo_tabungan || 0).toLocaleString('id-ID')}
                    </td>

                    {/* Biometric Face Status */}
                    <td className="py-3 px-4 text-center">
                      {siswa.face_registered ? (
                        <button
                          onClick={() => setCalibratingStudent(siswa)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full font-semibold text-[11px] transition-colors"
                          title="Klik untuk kalibrasi ulang wajah"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>128-Vektor Terdaftar</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setCalibratingStudent(siswa)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-full font-semibold text-[11px] transition-colors"
                        >
                          <Camera className="w-3.5 h-3.5 text-amber-600" />
                          <span>Daftarkan Wajah</span>
                        </button>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setCalibratingStudent(siswa)}
                          title="Kalibrasi Kamera Wajah"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(siswa)}
                          title="Ubah Data"
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(siswa.id, siswa.nama)}
                          title="Hapus Siswa"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingStudent ? 'Ubah Data Siswa' : 'Tambah Siswa Baru'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitStudent} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NISN *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nisn}
                    onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                    placeholder="Contoh: 0123456789"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NIS
                  </label>
                  <input
                    type="text"
                    value={formData.nis}
                    onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                    placeholder="Contoh: 232401"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap Siswa *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Nama lengkap sesuai akta lahir"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kelas / Rombel
                  </label>
                  <select
                    value={formData.kelas_id}
                    onChange={(e) => setFormData({ ...formData, kelas_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="Kelas 1A">Kelas 1A</option>
                    <option value="Kelas 2A">Kelas 2A</option>
                    <option value="Kelas 3A">Kelas 3A</option>
                    <option value="Kelas 4A">Kelas 4A</option>
                    <option value="Kelas 5A">Kelas 5A</option>
                    <option value="Kelas 6A">Kelas 6A</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jenis Kelamin
                  </label>
                  <select
                    value={formData.jenis_kelamin}
                    onChange={(e) =>
                      setFormData({ ...formData, jenis_kelamin: e.target.value as 'L' | 'P' })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Orang Tua / Wali
                  </label>
                  <input
                    type="text"
                    value={formData.nama_ortu}
                    onChange={(e) => setFormData({ ...formData, nama_ortu: e.target.value })}
                    placeholder="Nama ayah / ibu"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor WhatsApp Ortu *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.no_wa_ortu}
                    onChange={(e) => setFormData({ ...formData, no_wa_ortu: e.target.value })}
                    placeholder="Contoh: 081234567890"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alamat Rumah
                </label>
                <input
                  type="text"
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  placeholder="Dusun / Desa / Blok RT-RW"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm"
                >
                  {editingStudent ? 'Simpan Perubahan' : 'Tambahkan Siswa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Face Calibration Modal */}
      {calibratingStudent && (
        <FaceRegisterModal
          siswa={calibratingStudent}
          isOpen={!!calibratingStudent}
          onClose={() => setCalibratingStudent(null)}
          onSuccess={() => {
            refreshList();
          }}
        />
      )}
    </div>
  );
}
