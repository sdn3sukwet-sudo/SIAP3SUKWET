import { useState } from 'react';
import { SUPABASE_DDL_SQL } from '../services/supabaseSchema';
import { store } from '../services/store';
import { Database, Copy, Check, ExternalLink, ShieldCheck, Zap, X, AlertCircle } from 'lucide-react';

interface SupabaseSqlModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SupabaseSqlModal({ isOpen, onClose }: SupabaseSqlModalProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'sql' | 'config' | 'tutorial'>('sql');

  // Supabase config
  const initialConfig = store.getSupabaseConfig();
  const [url, setUrl] = useState(initialConfig.url);
  const [anonKey, setAnonKey] = useState(initialConfig.anonKey);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(SUPABASE_DDL_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await store.testSupabaseConnection(url, anonKey);
      setTestResult(result);
      if (result.success) {
        store.saveSupabaseConfig({ url, anonKey, isConnected: true });
      }
    } catch {
      setTestResult({ success: false, message: 'Gagal menghubungi Supabase' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 rounded-2xl border border-emerald-400/30">
              <Database className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Skema Database Supabase PostgreSQL & RLS</h3>
              <p className="text-xs text-emerald-200">
                DDL Query, Row Level Security, Trigger Saldo, dan Konfigurasi Koneksi BaaS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-2">
          <button
            onClick={() => setActiveTab('sql')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'sql'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Query DDL SQL & RLS</span>
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'config'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Koneksi Supabase URL & Key</span>
          </button>
          <button
            onClick={() => setActiveTab('tutorial')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'tutorial'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Panduan Setup 1-Klik</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'sql' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    Script DDL PostgreSQL (8 Tabel Lengkap + RLS & Trigger)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Termasuk tabel sekolah_profil, users_meta, siswa, absensi, nilai_harian, transaksi_keuangan, bank_soal, surat_izin_ortu.
                  </p>
                </div>
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin Seluruh SQL DDL'}</span>
                </button>
              </div>

              <div className="relative rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden text-left">
                <pre className="p-4 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-96 leading-relaxed select-all">
                  {SUPABASE_DDL_SQL}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'config' && (
            <div className="max-w-xl mx-auto space-y-5 py-4">
              <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl text-xs text-teal-800 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Zap className="w-4 h-4" />
                  <span>Mode Hybrid Client-Side & Supabase Cloud</span>
                </p>
                <p className="text-teal-700">
                  Aplikasi saat ini berjalan mulus secara offline-first dengan LocalStorage & IndexedDB. Jika Anda ingin menghubungkan langsung ke project Supabase Anda, masukkan kredensial di bawah.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Supabase Project URL
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://xyzcompany.supabase.co"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Supabase Anon Public Key
                  </label>
                  <input
                    type="password"
                    value={anonKey}
                    onChange={(e) => setAnonKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                {testResult && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                      testResult.success
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium'
                        : 'bg-rose-50 border border-rose-200 text-rose-800'
                    }`}
                  >
                    {testResult.success ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span>{testResult.message}</span>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={handleTestConnection}
                    disabled={isTesting || !url || !anonKey}
                    className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all"
                  >
                    <Zap className="w-4 h-4" />
                    <span>{isTesting ? 'Menguji Koneksi...' : 'Simpan & Uji Koneksi'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setUrl('');
                      setAnonKey('');
                      store.saveSupabaseConfig({ url: '', anonKey: '', isConnected: false });
                      setTestResult({ success: true, message: 'Kembali ke mode penyimpanan lokal browser.' });
                    }}
                    className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
                  >
                    Gunakan Mode Offline Lokal Saja
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tutorial' && (
            <div className="space-y-4 max-w-2xl mx-auto py-2">
              <h4 className="text-base font-bold text-slate-900">
                Cara Menjalankan Skema di Supabase Console:
              </h4>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-800">
                      Buka Dashboard Supabase
                    </h5>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Masuk ke akun Supabase Anda di{' '}
                      <a
                        href="https://supabase.com"
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-700 font-bold underline inline-flex items-center gap-0.5"
                      >
                        supabase.com <ExternalLink className="w-3 h-3" />
                      </a>{' '}
                      dan buat project baru (misal: "SIAKAD SDN 3 Sukra Wetan").
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-800">
                      Buka Menu "SQL Editor"
                    </h5>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Pilih menu <strong>SQL Editor</strong> di sidebar kiri Supabase, lalu klik tombol <strong>New Query</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-800">
                      Tempel (Paste) & Jalankan (Run)
                    </h5>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Salin script SQL dari tab "Query DDL SQL & RLS" di atas, tempelkan ke editor Supabase, lalu klik tombol <strong>RUN</strong>. Seluruh 8 tabel, relasi, RLS, index, dan trigger saldo tabungan otomatis dibuat dalam hitungan detik!
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    4
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-800">
                      Salin Project URL & Anon Key
                    </h5>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Buka menu <strong>Project Settings &gt; API</strong> di Supabase, salin Project URL dan `anon public` key, lalu masukkan pada tab "Koneksi Supabase URL & Key" aplikasi ini.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex items-center justify-between text-xs text-slate-500">
          <span>PostgreSQL 15+ Compatible with Row Level Security (RLS)</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-xl transition-colors"
          >
            Tutup Jendela
          </button>
        </div>
      </div>
    </div>
  );
}
