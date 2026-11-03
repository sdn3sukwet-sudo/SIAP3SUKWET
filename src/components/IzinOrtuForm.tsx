import { useState, useRef } from 'react';
import { Siswa, SuratIzin } from '../types';
import { store } from '../services/store';
import {
  FileText,
  Upload,
  Camera,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Eye,
  X,
  User,
} from 'lucide-react';

export function IzinOrtuForm() {
  const [students] = useState<Siswa[]>(store.getSiswa());
  const [izinList, setIzinList] = useState<SuratIzin[]>(store.getIzin());

  const today = new Date().toISOString().split('T')[0];

  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    students[0]?.id || ''
  );
  const [jenisIzin, setJenisIzin] = useState<'Sakit' | 'Izin'>('Sakit');
  const [tanggalMulai, setTanggalMulai] = useState<string>(today);
  const [tanggalSelesai, setTanggalSelesai] = useState<string>(today);
  const [alasan, setAlasan] = useState<string>('');
  const [fotoSuratUrl, setFotoSuratUrl] = useState<string | null>(null);

  const [notification, setNotification] = useState<string | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setFotoSuratUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !alasan.trim()) return;

    const newIzin: SuratIzin = {
      id: 'izn-' + Date.now(),
      siswa_id: selectedStudentId,
      tanggal_mulai: tanggalMulai,
      tanggal_selesai: tanggalSelesai,
      jenis_izin: jenisIzin,
      alasan: alasan,
      foto_surat_url: fotoSuratUrl || undefined,
      status_verifikasi: 'Disetujui',
      dibuat_pada: new Date().toISOString(),
    };

    store.submitSuratIzin(newIzin);
    setIzinList(store.getIzin());

    setNotification(
      `Surat izin ananda berhasil terkirim dan status absensi siswa telah otomatis diperbarui menjadi ${jenisIzin}!`
    );

    // Reset form
    setAlasan('');
    setFotoSuratUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    setTimeout(() => setNotification(null), 5000);
  };

  const studentMap = new Map(students.map((s) => [s.id, s]));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-black text-slate-800">
          Form Pengajuan Izin / Sakit Orang Tua
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Orang tua dan wali murid dapat mengunggah bukti surat dokter/keterangan sakit langsung dari HP. Status absensi siswa otomatis berubah dari Alpa menjadi Izin/Sakit.
        </p>
      </div>

      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Form */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Kirim Surat Keterangan / Izin</span>
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Pilih Nama Siswa / Ananda *
              </label>
              <select
                required
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nama} ({s.kelas_id}) - NISN: {s.nisn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kategori Permohonan Izin *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setJenisIzin('Sakit')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                    jenisIzin === 'Sakit'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>Sakit (Surat Dokter)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setJenisIzin('Izin')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                    jenisIzin === 'Izin'
                      ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Izin Keperluan Keluarga</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mulai Tanggal *
                </label>
                <input
                  type="date"
                  required
                  value={tanggalMulai}
                  onChange={(e) => setTanggalMulai(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sampai Tanggal *
                </label>
                <input
                  type="date"
                  required
                  value={tanggalSelesai}
                  onChange={(e) => setTanggalSelesai(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Alasan / Gejala / Keperluan *
              </label>
              <textarea
                rows={3}
                required
                value={alasan}
                onChange={(e) => setAlasan(e.target.value)}
                placeholder="Contoh: Ananda demam tinggi sejak semalam dan sedang berobat di Puskesmas Sukra..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Photo Upload for Medical Note */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Lampirkan Foto Surat Sakit / Bukti Resep
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoUpload}
                className="hidden"
              />

              {!fotoSuratUrl ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-4 border-2 border-dashed border-slate-300 hover:border-blue-400 bg-slate-50/70 hover:bg-blue-50/50 rounded-2xl flex flex-col items-center justify-center gap-1.5 text-slate-500 hover:text-blue-600 transition-colors"
                >
                  <Camera className="w-5 h-5 text-slate-400" />
                  <span className="text-xs font-semibold">
                    Klik untuk Ambil Foto Kamera / Pilih dari Galeri HP
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Format JPG, PNG (Maks 10MB)
                  </span>
                </button>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                  <img
                    src={fotoSuratUrl}
                    alt="Foto Surat Bukti"
                    className="w-full h-40 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setFotoSuratUrl(null)}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Kirim Surat Izin ke Sekolah</span>
            </button>
          </form>
        </div>

        {/* Right List: History of submitted leave requests */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-800">
              Riwayat Surat Izin Terkirim
            </h3>
            <span className="text-xs text-slate-400">
              {izinList.length} pengajuan
            </span>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
            {izinList.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Belum ada pengajuan surat izin tercatat.
              </div>
            ) : (
              izinList.map((item) => {
                const student = studentMap.get(item.siswa_id);
                return (
                  <div
                    key={item.id}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-xs text-slate-900">
                          {student?.nama || 'Siswa'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {student?.kelas_id} • Periode: {item.tanggal_mulai} s/d {item.tanggal_selesai}
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.jenis_izin === 'Sakit'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {item.jenis_izin}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-100">
                      {item.alasan}
                    </p>

                    <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Status: Terverifikasi Otomatis</span>
                      </span>

                      {item.foto_surat_url && (
                        <button
                          type="button"
                          onClick={() => setPreviewPhoto(item.foto_surat_url || null)}
                          className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Lihat Surat</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Photo Preview Modal */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-800">
                Lampiran Surat Dokter / Izin
              </h4>
              <button
                onClick={() => setPreviewPhoto(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={previewPhoto}
              alt="Bukti Surat Izin"
              className="w-full max-h-96 object-contain rounded-2xl bg-slate-100"
            />
          </div>
        </div>
      )}
    </div>
  );
}
