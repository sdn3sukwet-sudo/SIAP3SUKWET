import { useState } from 'react';
import { SoalUjian, SekolahProfil } from '../types';
import { store } from '../services/store';
import { exportSoalToWord, parseSoalFromText } from '../services/docxService';
import { generateBankSoalAI } from '../services/gemini';
import {
  Sparkles,
  Download,
  Upload,
  Plus,
  Play,
  CheckCircle2,
  HelpCircle,
  Clock,
  BookOpen,
  X,
  FileText,
} from 'lucide-react';

export function BankSoalModule() {
  const [soalList, setSoalList] = useState<SoalUjian[]>(store.getSoal());
  const profil: SekolahProfil = store.getProfil();

  // Filters
  const [filterMapel, setFilterMapel] = useState('Semua');
  const [filterKelas, setFilterKelas] = useState('Semua');

  // AI Generator Modal
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiMapel, setAiMapel] = useState('Ilmu Pengetahuan Alam dan Sosial (IPAS)');
  const [aiKelas, setAiKelas] = useState('Kelas 4');
  const [aiTopik, setAiTopik] = useState('Perubahan Bentuk Energi');
  const [aiJumlah, setAiJumlah] = useState(4);
  const [isGenerating, setIsGenerating] = useState(false);

  // Import Word / Text Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [rawTextImport, setRawTextImport] = useState('');
  const [importMapel, setImportMapel] = useState('Bahasa Indonesia');
  const [importKelas, setImportKelas] = useState('Kelas 4');

  // Student CBT Quiz Simulation Modal
  const [isCbtOpen, setIsCbtOpen] = useState(false);
  const [cbtIndex, setCbtIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [isCbtFinished, setIsCbtFinished] = useState(false);

  const refreshList = () => {
    setSoalList(store.getSoal());
  };

  const handleGenerateAI = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    try {
      const generated = await generateBankSoalAI({
        mataPelajaran: aiMapel,
        kelas: aiKelas,
        topik: aiTopik,
        jumlahSoal: aiJumlah,
      });

      generated.forEach((g) => {
        store.addSoal({
          id: 'soal-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          mata_pelajaran: aiMapel,
          kelas: aiKelas,
          topik: aiTopik,
          pertanyaan: g.pertanyaan,
          pilihan: g.pilihan,
          kunci: g.kunci,
          pembahasan: g.pembahasan,
        });
      });

      refreshList();
      setIsAiModalOpen(false);
    } catch {
      alert('Gagal menghasilkan soal.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImportText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawTextImport.trim()) return;

    const parsed = parseSoalFromText(rawTextImport, importMapel, importKelas);
    if (parsed.length === 0) {
      alert('Format soal tidak terdeteksi. Pastikan ada nomor (1.) dan opsi pilihan (A, B, C, D).');
      return;
    }

    parsed.forEach((s) => store.addSoal(s));
    refreshList();
    setIsImportModalOpen(false);
    setRawTextImport('');
  };

  const handleExportWord = () => {
    const listToExport = filteredSoal.length > 0 ? filteredSoal : soalList;
    const mapelName = filterMapel !== 'Semua' ? filterMapel : 'Campuran';
    const kelasName = filterKelas !== 'Semua' ? filterKelas : 'Kelas SD';
    exportSoalToWord(listToExport, profil, mapelName, kelasName, true);
  };

  const filteredSoal = soalList.filter((s) => {
    const m = filterMapel === 'Semua' || s.mata_pelajaran.includes(filterMapel);
    const k = filterKelas === 'Semua' || s.kelas.includes(filterKelas);
    return m && k;
  });

  // CBT Calculations
  const startCBT = () => {
    setCbtIndex(0);
    setSelectedAnswers({});
    setIsCbtFinished(false);
    setIsCbtOpen(true);
  };

  const cbtQuestions = filteredSoal.length > 0 ? filteredSoal : soalList;
  const currentQuestion = cbtQuestions[cbtIndex];

  let cbtScore = 0;
  if (isCbtFinished) {
    cbtQuestions.forEach((q, idx) => {
      const chosen = selectedAnswers[idx];
      if (chosen && chosen.startsWith(q.kunci)) {
        cbtScore++;
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800">
            Aplikasi Ujian & Bank Soal SD
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Penyusunan Naskah Soal, Generator Soal Otomatis Gemini AI, Ekspor Word (.doc), dan Simulasi CBT Siswa
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Buat Soal Cerdas AI</span>
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors border border-slate-200"
          >
            <Upload className="w-4 h-4" />
            <span>Impor Teks / Word</span>
          </button>

          <button
            onClick={handleExportWord}
            className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors border border-blue-200"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor Naskah Word</span>
          </button>

          <button
            onClick={startCBT}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Play className="w-4 h-4" />
            <span>Simulasi Ujian CBT</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-xs font-bold text-slate-500">Mata Pelajaran:</label>
          <select
            value={filterMapel}
            onChange={(e) => setFilterMapel(e.target.value)}
            className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="Semua">Semua Mata Pelajaran</option>
            <option value="Agama">Pendidikan Agama</option>
            <option value="Pancasila">PPKn</option>
            <option value="Bahasa Indonesia">Bahasa Indonesia</option>
            <option value="Matematika">Matematika</option>
            <option value="IPAS">IPAS</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Menampilkan <strong>{filteredSoal.length}</strong> butir soal terdaftar
        </div>
      </div>

      {/* Question Items List */}
      <div className="space-y-4">
        {filteredSoal.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-200">
            Belum ada butir soal dalam bank soal. Klik &quot;Buat Soal Cerdas AI&quot; untuk menghasilkan otomatis!
          </div>
        ) : (
          filteredSoal.map((soal, idx) => (
            <div
              key={soal.id}
              className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full text-[10px] font-semibold">
                    {soal.mata_pelajaran}
                  </span>
                  <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-semibold">
                    {soal.kelas}
                  </span>
                  <span className="text-xs text-slate-400">• {soal.topik}</span>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Kunci: {soal.kunci}</span>
                </div>
              </div>

              <p className="text-xs font-semibold text-slate-900 leading-relaxed pl-8">
                {soal.pertanyaan}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-8">
                {soal.pilihan.map((pil, pIdx) => (
                  <div
                    key={pIdx}
                    className={`p-2.5 rounded-xl text-xs font-medium border ${
                      pil.startsWith(soal.kunci)
                        ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    {pil}
                  </div>
                ))}
              </div>

              {soal.pembahasan && (
                <div className="ml-8 p-3 bg-amber-50/70 border border-amber-200 rounded-2xl text-[11px] text-amber-900">
                  <strong>Pembahasan:</strong> {soal.pembahasan}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* AI Generator Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100">
            <div className="bg-gradient-to-r from-amber-500 to-yellow-500 p-5 text-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                <h3 className="font-bold text-base">Generator Soal Cerdas Gemini AI</h3>
              </div>
              <button onClick={() => setIsAiModalOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateAI} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mata Pelajaran
                </label>
                <input
                  type="text"
                  required
                  value={aiMapel}
                  onChange={(e) => setAiMapel(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tingkat Kelas
                  </label>
                  <select
                    value={aiKelas}
                    onChange={(e) => setAiKelas(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                  >
                    <option value="Kelas 1">Kelas 1 SD</option>
                    <option value="Kelas 2">Kelas 2 SD</option>
                    <option value="Kelas 3">Kelas 3 SD</option>
                    <option value="Kelas 4">Kelas 4 SD</option>
                    <option value="Kelas 5">Kelas 5 SD</option>
                    <option value="Kelas 6">Kelas 6 SD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jumlah Butir Soal
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={aiJumlah}
                    onChange={(e) => setAiJumlah(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Materi / Pokok Bahasan
                </label>
                <input
                  type="text"
                  required
                  value={aiTopik}
                  onChange={(e) => setAiTopik(e.target.value)}
                  placeholder="Contoh: Operasi Hitung Pecahan, Siklus Air..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isGenerating ? 'Membuat Soal...' : 'Generate Soal'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <h3 className="font-bold text-base">Impor Soal dari Berkas Teks / Word</h3>
              <button onClick={() => setIsImportModalOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleImportText} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mata Pelajaran
                  </label>
                  <input
                    type="text"
                    required
                    value={importMapel}
                    onChange={(e) => setImportMapel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kelas
                  </label>
                  <input
                    type="text"
                    required
                    value={importKelas}
                    onChange={(e) => setImportKelas(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tempelkan Teks Soal (Format 1. Pertanyaan, A. ..., B. ..., Kunci: A)
                </label>
                <textarea
                  rows={8}
                  required
                  value={rawTextImport}
                  onChange={(e) => setRawTextImport(e.target.value)}
                  placeholder={`1. Ibukota provinsi Jawa Barat adalah...\nA. Bandung\nB. Surabaya\nC. Semarang\nD. Medan\nKunci: A`}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm"
                >
                  Ekstrak & Simpan ke Bank Soal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student CBT Quiz Simulation Modal */}
      {isCbtOpen && currentQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <Play className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Simulasi CBT Ujian Siswa SD</h3>
                  <p className="text-[11px] text-slate-400">
                    {currentQuestion.mata_pelajaran} • {currentQuestion.kelas}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsCbtOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* CBT Body */}
            <div className="p-6 space-y-6">
              {!isCbtFinished ? (
                <>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 border-b border-slate-100 pb-3">
                    <span>
                      Soal Nomor {cbtIndex + 1} dari {cbtQuestions.length}
                    </span>
                    <span className="flex items-center gap-1.5 text-blue-600">
                      <Clock className="w-4 h-4" />
                      <span>Sisa Waktu: 45 Menit</span>
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                    {currentQuestion.pertanyaan}
                  </p>

                  <div className="space-y-2.5">
                    {currentQuestion.pilihan.map((pil, idx) => {
                      const isChosen = selectedAnswers[cbtIndex] === pil;
                      return (
                        <button
                          key={idx}
                          onClick={() =>
                            setSelectedAnswers({ ...selectedAnswers, [cbtIndex]: pil })
                          }
                          className={`w-full p-3.5 rounded-2xl text-xs text-left font-semibold border transition-all flex items-center gap-3 ${
                            isChosen
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                          }`}
                        >
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${
                              isChosen ? 'border-white text-white' : 'border-slate-300 text-slate-600'
                            }`}
                          >
                            {pil.charAt(0)}
                          </span>
                          <span>{pil}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="py-8 text-center space-y-4">
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900">
                    Ujian CBT Telah Selesai!
                  </h3>
                  <div className="text-4xl font-black text-blue-600 font-mono">
                    {Math.round((cbtScore / cbtQuestions.length) * 100)} / 100
                  </div>
                  <p className="text-xs text-slate-500">
                    Jawaban Benar: {cbtScore} dari {cbtQuestions.length} butir soal
                  </p>
                </div>
              )}
            </div>

            {/* Footer Navigation */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between">
              {!isCbtFinished ? (
                <>
                  <button
                    disabled={cbtIndex === 0}
                    onClick={() => setCbtIndex((i) => i - 1)}
                    className="px-4 py-2 bg-slate-200 disabled:opacity-40 text-slate-700 font-semibold rounded-xl text-xs"
                  >
                    &larr; Soal Sebelumnya
                  </button>

                  {cbtIndex < cbtQuestions.length - 1 ? (
                    <button
                      onClick={() => setCbtIndex((i) => i + 1)}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs"
                    >
                      Soal Berikutnya &rarr;
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsCbtFinished(true)}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs"
                    >
                      Kirim & Selesaikan Ujian
                    </button>
                  )}
                </>
              ) : (
                <button
                  onClick={() => setIsCbtOpen(false)}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs"
                >
                  Tutup Hasil Simulasi
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
