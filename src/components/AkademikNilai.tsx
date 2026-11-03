import { useState, useEffect } from 'react';
import { Siswa, NilaiSiswa, SekolahProfil, MataPelajaran } from '../types';
import { store } from '../services/store';
import { INITIAL_MAPEL } from '../data/initialData';
import { generateCatatanRaporAI } from '../services/gemini';
import { generateRaporPDF } from '../services/pdfService';
import {
  FileText,
  Sparkles,
  Printer,
  Save,
  CheckCircle2,
  BookOpen,
  User,
  GraduationCap,
  AlertCircle,
} from 'lucide-react';

export function AkademikNilai() {
  const [students, setStudents] = useState<Siswa[]>(store.getSiswa());
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    students[0]?.id || ''
  );
  const [semester, setSemester] = useState<'Ganjil' | 'Genap'>('Ganjil');
  const [profil, setProfil] = useState<SekolahProfil>(store.getProfil());

  // Grade records for selected student
  const [nilaiList, setNilaiList] = useState<NilaiSiswa[]>([]);
  const [catatanKarakterGuru, setCatatanKarakterGuru] = useState(
    'Ananda rajin, sopan, aktif dalam diskusi kelompok, serta memiliki budi pekerti luhur.'
  );
  const [catatanRaporAI, setCatatanRaporAI] = useState<string>('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  useEffect(() => {
    const unsub = store.subscribe(() => {
      setStudents(store.getSiswa());
      setProfil(store.getProfil());
    });
    return unsub;
  }, []);

  // When selected student changes, populate or build their subjects list
  useEffect(() => {
    if (!selectedStudentId) return;

    const existingNilai = store.getNilai(selectedStudentId);

    // Ensure all standard subjects are present
    const mapels: MataPelajaran[] = INITIAL_MAPEL;
    const combined: NilaiSiswa[] = mapels.map((m) => {
      const found = existingNilai.find(
        (n) => n.mata_pelajaran === m.nama && n.semester === semester
      );
      if (found) return found;

      return {
        id: `nil-${selectedStudentId}-${m.kode}`,
        siswa_id: selectedStudentId,
        mata_pelajaran: m.nama,
        semester: semester,
        tahun_ajaran: '2026/2027',
        nilai_harian: 85,
        nilai_uts: 85,
        nilai_uas: 85,
        catatan_ai: '',
      };
    });

    setNilaiList(combined);

    // Look for previous AI note if any
    const firstWithAi = existingNilai.find((n) => n.catatan_ai);
    if (firstWithAi?.catatan_ai) {
      setCatatanRaporAI(firstWithAi.catatan_ai);
    } else {
      setCatatanRaporAI('');
    }
  }, [selectedStudentId, semester]);

  const handleGradeChange = (
    index: number,
    field: 'nilai_harian' | 'nilai_uts' | 'nilai_uas',
    value: number
  ) => {
    const updated = [...nilaiList];
    updated[index] = {
      ...updated[index],
      [field]: Math.max(0, Math.min(100, value)),
    };
    setNilaiList(updated);
  };

  const handleSaveGrades = () => {
    nilaiList.forEach((n) => {
      store.saveNilai({
        ...n,
        catatan_ai: catatanRaporAI,
      });
    });
    setSaveMessage('Seluruh nilai dan catatan rapor berhasil disimpan ke sistem!');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleGenerateCatatanAI = async () => {
    if (!selectedStudent) return;
    setIsGeneratingAI(true);

    try {
      const narasi = await generateCatatanRaporAI({
        nama: selectedStudent.nama,
        nisn: selectedStudent.nisn,
        kelas: selectedStudent.kelas_id,
        semester: semester,
        nilaiList: nilaiList,
        catatanKarakter: catatanKarakterGuru,
      });

      setCatatanRaporAI(narasi);
      setSaveMessage('Narasi rapor cerdas berhasil digenerate oleh Gemini AI!');
    } catch {
      setSaveMessage('Gagal generate AI, silakan tulis narasi manual.');
    } finally {
      setIsGeneratingAI(false);
      setTimeout(() => setSaveMessage(null), 4000);
    }
  };

  const handlePrintPDF = () => {
    if (!selectedStudent) return;
    const finalNote =
      catatanRaporAI ||
      `Ananda ${selectedStudent.nama} telah menyelesaikan proses pembelajaran semester ${semester} dengan capaian yang sangat baik dan berbudi pekerti terpuji.`;

    generateRaporPDF(selectedStudent, nilaiList, profil, finalNote);
  };

  // Average Score
  const totalScore = nilaiList.reduce(
    (acc, curr) =>
      acc + Math.round(curr.nilai_harian * 0.4 + curr.nilai_uts * 0.3 + curr.nilai_uas * 0.3),
    0
  );
  const averageScore = nilaiList.length > 0 ? Math.round(totalScore / nilaiList.length) : 0;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800">
            Penilaian Akademik & Narasi Rapor AI Gemini
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Input Nilai Harian, UTS, UAS, Generator Narasi Deskriptif Otomatis, dan Cetak PDF Rapor Siap Cetak
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSaveGrades}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Nilai</span>
          </button>

          <button
            onClick={handlePrintPDF}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Rapor Siswa (PDF)</span>
          </button>
        </div>
      </div>

      {saveMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Student & Semester Selector Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
            <User className="w-5 h-5" />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400">
              Pilih Siswa
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="py-1 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nama} ({s.kelas_id}) - NISN: {s.nisn}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto justify-end">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400">
              Semester
            </label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value as 'Ganjil' | 'Genap')}
              className="py-1 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
            >
              <option value="Ganjil">Semester Ganjil</option>
              <option value="Genap">Semester Genap</option>
            </select>
          </div>

          <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              Rata-rata Nilai Akhir
            </span>
            <div className="text-xl font-black text-blue-600">
              {averageScore}{' '}
              <span className="text-xs font-semibold text-slate-500">
                ({averageScore >= 85 ? 'Sangat Baik' : averageScore >= 75 ? 'Baik' : 'Cukup'})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Grades Table & AI Narrative Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Subject Grades Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-sm">
                Capaian Kompetensi Mata Pelajaran
              </h3>
            </div>
            <span className="text-xs text-slate-400">Bobot: 40% Harian + 30% UTS + 30% UAS</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-2.5 px-3">Mata Pelajaran</th>
                  <th className="py-2.5 px-3 text-center">Harian (40%)</th>
                  <th className="py-2.5 px-3 text-center">UTS (30%)</th>
                  <th className="py-2.5 px-3 text-center">UAS (30%)</th>
                  <th className="py-2.5 px-3 text-center">Nilai Akhir</th>
                  <th className="py-2.5 px-3 text-right">Predikat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {nilaiList.map((item, idx) => {
                  const finalScore = Math.round(
                    item.nilai_harian * 0.4 + item.nilai_uts * 0.3 + item.nilai_uas * 0.3
                  );
                  let predikat = 'C';
                  let predikatColor = 'text-amber-600 bg-amber-50';
                  if (finalScore >= 90) {
                    predikat = 'A (Sangat Baik)';
                    predikatColor = 'text-emerald-700 bg-emerald-50';
                  } else if (finalScore >= 80) {
                    predikat = 'B (Baik)';
                    predikatColor = 'text-blue-700 bg-blue-50';
                  } else if (finalScore < 70) {
                    predikat = 'D (Perlu Bimbingan)';
                    predikatColor = 'text-rose-700 bg-rose-50';
                  }

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {item.mata_pelajaran}
                      </td>

                      <td className="py-2 px-3 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.nilai_harian}
                          onChange={(e) =>
                            handleGradeChange(idx, 'nilai_harian', Number(e.target.value))
                          }
                          className="w-16 py-1 px-1.5 text-center font-bold bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                        />
                      </td>

                      <td className="py-2 px-3 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.nilai_uts}
                          onChange={(e) =>
                            handleGradeChange(idx, 'nilai_uts', Number(e.target.value))
                          }
                          className="w-16 py-1 px-1.5 text-center font-bold bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                        />
                      </td>

                      <td className="py-2 px-3 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.nilai_uas}
                          onChange={(e) =>
                            handleGradeChange(idx, 'nilai_uas', Number(e.target.value))
                          }
                          className="w-16 py-1 px-1.5 text-center font-bold bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                        />
                      </td>

                      <td className="py-2.5 px-3 text-center font-black text-slate-900 text-sm">
                        {finalScore}
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${predikatColor}`}>
                          {predikat}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: AI Gemini Report Narrative Generator */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-yellow-400/20 text-yellow-300 rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">
                    Generator Catatan Rapor AI
                  </h3>
                  <p className="text-[10px] text-indigo-200">
                    Didukung Google Gemini 2.5 / 3.8 Flash
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-indigo-100 leading-relaxed">
              Secara otomatis menyusun narasi evaluasi capaian belajar, keunggulan siswa, area pengembangan, serta catatan karakter Kurikulum Merdeka berdasar data nilai.
            </p>

            {/* Teacher's Character Input Hint */}
            <div>
              <label className="block text-[11px] font-bold text-indigo-200 mb-1">
                Catatan Karakter Tambahan dari Wali Kelas:
              </label>
              <input
                type="text"
                value={catatanKarakterGuru}
                onChange={(e) => setCatatanKarakterGuru(e.target.value)}
                placeholder="Contoh: Sangat aktif, gemar membaca, sopan santun..."
                className="w-full px-3 py-2 bg-slate-800/80 border border-indigo-400/30 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-yellow-400"
              />
            </div>

            <button
              onClick={handleGenerateCatatanAI}
              disabled={isGeneratingAI}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {isGeneratingAI ? 'Menyusun Narasi dengan AI...' : 'Buat Narasi Catatan Rapor AI'}
              </span>
            </button>

            {/* Generated Narrative Display / Editor */}
            <div>
              <label className="block text-[11px] font-bold text-indigo-200 mb-1">
                Hasil Narasi Rapor (Dapat diedit oleh Guru):
              </label>
              <textarea
                rows={6}
                value={catatanRaporAI}
                onChange={(e) => setCatatanRaporAI(e.target.value)}
                placeholder="Klik tombol di atas untuk membuat narasi otomatis dengan Gemini AI, atau ketik langsung di sini..."
                className="w-full p-3 bg-slate-950/70 border border-indigo-400/30 rounded-2xl text-xs text-indigo-50 leading-relaxed focus:outline-none focus:border-yellow-400"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-indigo-800/60 flex items-center justify-between text-[11px] text-indigo-300">
            <span>Kurikulum Merdeka SD</span>
            <button
              onClick={handlePrintPDF}
              className="text-yellow-300 hover:text-yellow-200 font-bold underline"
            >
              Cetak ke PDF &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
