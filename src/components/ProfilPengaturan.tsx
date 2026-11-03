import { useState } from 'react';
import { SekolahProfil } from '../types';
import { store } from '../services/store';
import {
  Building2,
  Clock,
  Send,
  Database,
  Save,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

interface ProfilPengaturanProps {
  onOpenSupabaseModal: () => void;
}

export function ProfilPengaturan({ onOpenSupabaseModal }: ProfilPengaturanProps) {
  const [profil, setProfil] = useState<SekolahProfil>(store.getProfil());
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    store.saveProfil(profil);
    setSuccessMessage('Pengaturan profil lembaga dan WhatsApp berhasil diperbarui!');
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const handleReset = () => {
    if (confirm('Kembalikan semua data ke pengaturan awal sampel UPTD SDN 3 Sukra Wetan?')) {
      store.resetToDefault();
      setProfil(store.getProfil());
      setSuccessMessage('Seluruh data berhasil direset ke sampel awal.');
      setTimeout(() => setSuccessMessage(null), 3500);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800">
            Profil Lembaga & Pengaturan Sistem
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Konfigurasi identitas sekolah, jam operasional presensi wajah, dan gateway WhatsApp
          </p>
        </div>

        <button
          onClick={handleReset}
          className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-rose-200"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset Data Sampel</span>
        </button>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Profil Sekolah */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900">
              Identitas Resmi Lembaga Sekolah
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Sekolah *
              </label>
              <input
                type="text"
                required
                value={profil.nama_sekolah}
                onChange={(e) => setProfil({ ...profil, nama_sekolah: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                NPSN *
              </label>
              <input
                type="text"
                required
                value={profil.npsn}
                onChange={(e) => setProfil({ ...profil, npsn: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Alamat Lengkap Sekolah *
            </label>
            <input
              type="text"
              required
              value={profil.alamat}
              onChange={(e) => setProfil({ ...profil, alamat: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Kepala Sekolah *
              </label>
              <input
                type="text"
                required
                value={profil.kepala_sekolah}
                onChange={(e) => setProfil({ ...profil, kepala_sekolah: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                NIP Kepala Sekolah
              </label>
              <input
                type="text"
                value={profil.nip_kepala_sekolah}
                onChange={(e) => setProfil({ ...profil, nip_kepala_sekolah: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Logo Sekolah
            </label>
            <div className="flex items-center gap-4">
              <img
                src={profil.logo_url}
                alt="Logo Sekolah"
                className="w-14 h-14 object-contain rounded-xl border border-slate-200 p-1 bg-slate-50"
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={profil.logo_url}
                  onChange={(e) => setProfil({ ...profil, logo_url: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Path default: /assets/aistudio/logo_HD_989a88d4.png (Logo Resmi SDN 3 Sukra Wetan)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Jam Operasional Kiosk Absensi */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Clock className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-sm text-slate-900">
              Jadwal Masuk & Batas Keterlambatan Kiosk
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Batas Jam Masuk Pagi (WIB) *
              </label>
              <input
                type="time"
                required
                value={profil.jam_masuk}
                onChange={(e) => setProfil({ ...profil, jam_masuk: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-amber-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Siswa yang absen setelah jam ini akan otomatis berstatus <strong>Terlambat</strong>.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Jam Pulang Sekolah (WIB) *
              </label>
              <input
                type="time"
                required
                value={profil.jam_pulang}
                onChange={(e) => setProfil({ ...profil, jam_pulang: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: WhatsApp Gateway API */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-sm text-slate-900">
                Integrasi WhatsApp Gateway (Fonnte / Wablas)
              </h3>
            </div>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold">
              Simulator / Real API
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Penyedia Gateway WhatsApp
              </label>
              <select
                value={profil.wa_gateway_provider}
                onChange={(e) =>
                  setProfil({
                    ...profil,
                    wa_gateway_provider: e.target.value as 'fonnte' | 'wablas',
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
              >
                <option value="fonnte">Fonnte API (https://api.fonnte.com)</option>
                <option value="wablas">Wablas API (https://wablas.com)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                API Token / Secret Key (Opsional)
              </label>
              <input
                type="password"
                value={profil.wa_gateway_token || ''}
                onChange={(e) => setProfil({ ...profil, wa_gateway_token: e.target.value })}
                placeholder="Kosongkan untuk menggunakan mode simulator"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Template Pesan WhatsApp Keterlambatan / Belum Absen
            </label>
            <textarea
              rows={3}
              value={profil.wa_template_terlambat || ''}
              onChange={(e) =>
                setProfil({ ...profil, wa_template_terlambat: e.target.value })
              }
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Gunakan placeholder: <code>{'{nama}'}</code>, <code>{'{jam_masuk}'}</code>, <code>{'{kelas}'}</code>
            </p>
          </div>
        </div>

        {/* Section 4: Supabase Cloud Database */}
        <div className="bg-gradient-to-r from-teal-900 to-emerald-950 rounded-3xl p-6 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-teal-300" />
              <h3 className="font-bold text-sm text-white">
                Skema Database Supabase PostgreSQL
              </h3>
            </div>
            <p className="text-xs text-teal-200/80 leading-relaxed max-w-xl">
              Lihat dan salin query SQL DDL lengkap (8 tabel, relasi, RLS policies, trigger tabungan) untuk di-deploy ke Supabase project Anda.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenSupabaseModal}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold rounded-xl text-xs flex items-center gap-2 shrink-0 shadow-lg transition-all"
          >
            <Database className="w-4 h-4" />
            <span>Buka Skema Supabase</span>
          </button>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs shadow-md transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Semua Pengaturan</span>
          </button>
        </div>
      </form>
    </div>
  );
}
