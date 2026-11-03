import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '15mb' }));

// Initialize Google GenAI
const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Endpoint: AI Generator Catatan Rapor Naratif Siswa SD
app.post('/api/gemini/catatan-rapor', async (req, res) => {
  try {
    const { nama, nisn, kelas, nilaiList, semester, catatanKarakter } = req.body;
    const ai = getAI();

    if (!ai) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY belum dikonfigurasi pada server environment.',
      });
    }

    const nilaiSummary = (nilaiList || [])
      .map(
        (n: { mapel: string; nilai: number; uts?: number; uas?: number }) =>
          `- ${n.mapel}: Nilai Harian ${n.nilai ?? 0}, UTS ${n.uts ?? 0}, UAS ${n.uas ?? 0} (Rata-rata: ${Math.round(((n.nilai ?? 0) + (n.uts ?? 0) + (n.uas ?? 0)) / 3)})`
      )
      .join('\n');

    const prompt = `Anda adalah Guru Wali Kelas SD (Sekolah Dasar) yang bijaksana, peduli, dan menginspirasi sesuai standar Kurikulum Merdeka di Indonesia.
Buatkan narasi catatan rapor (Capaian Pembelajaran dan Catatan Motivasi Wali Kelas) untuk siswa berikut:
Nama Siswa: ${nama || 'Siswa'}
NISN: ${nisn || '-'}
Kelas: ${kelas || 'Kelas SD'}
Semester: ${semester || 'Ganjil'}
Ringkasan Nilai:
${nilaiSummary || 'Nilai rata-rata 85 di semua mata pelajaran'}
Catatan Perilaku / Karakter Tambahan dari Guru: ${catatanKarakter || 'Rajin, sopan, aktif di kelas, suka membantu teman'}

Instruksi:
1. Tuliskan 2 paragraf:
   - Paragraf 1: Analisis Capaian Pembelajaran Akademik (apresiasi mata pelajaran yang paling menonjol dan saran untuk mata pelajaran yang perlu peningkatan).
   - Paragraf 2: Catatan Perkembangan Karakter & Motivasi Wali Kelas (pujian atas sikap positif, kedisiplinan, budi pekerti, serta doa motivasi untuk semester depan).
2. Gunakan bahasa Indonesia yang santun, edukatif, hangat, dan memotivasi siswa serta orang tua.
3. Hindari kalimat yang menjatuhkan mental anak.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    const catatan = response.text || 'Ananda menunjukkan perkembangan belajar dan kepribadian yang sangat baik. Tingkatkan terus semangat belajarnya!';
    return res.json({ success: true, catatan });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Gagal menghubungi Gemini API';
    console.error('Gemini error:', errorMsg);
    return res.status(500).json({ error: errorMsg });
  }
});

// Endpoint: AI Generator Bank Soal Ujian SD Otomatis
app.post('/api/gemini/generate-soal', async (req, res) => {
  try {
    const { mataPelajaran, kelas, topik, jumlahSoal = 5, tingkatKesulitan = 'Sedang' } = req.body;
    const ai = getAI();

    if (!ai) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY belum dikonfigurasi pada server environment.',
      });
    }

    const prompt = `Buatkan ${jumlahSoal} butir soal pilihan ganda (PILIHAN GANDA A, B, C, D) untuk siswa Sekolah Dasar (SD):
Mata Pelajaran: ${mataPelajaran}
Tingkat Kelas: ${kelas}
Materi / Topik: ${topik}
Tingkat Kesulitan: ${tingkatKesulitan}
Konteks: Kurikulum Indonesia.

Formatkan jawaban murni dalam JSON (array of objects), tanpa markdown wrap \`\`\`json:
[
  {
    "nomor": 1,
    "pertanyaan": "Isi pertanyaan...",
    "pilihan": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "kunci": "A",
    "pembahasan": "Penjelasan singkat..."
  }
]`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '[]');
    return res.json({ success: true, soalList: parsed });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Gagal membuat bank soal';
    console.error('Gemini soal error:', errorMsg);
    return res.status(500).json({ error: errorMsg });
  }
});

// Endpoint: WhatsApp Gateway Trigger / Relay (Fonnte / Wablas or Simulator)
app.post('/api/whatsapp/send', async (req, res) => {
  try {
    const { no_wa, pesan, nama_siswa, provider = 'fonnte', token } = req.body;

    if (!no_wa || !pesan) {
      return res.status(400).json({ error: 'Nomor WA dan Pesan wajib diisi' });
    }

    // If real token is supplied from settings, send via provider API
    if (token) {
      if (provider === 'fonnte') {
        const fonnteRes = await fetch('https://api.fonnte.com/send', {
          method: 'POST',
          headers: {
            Authorization: token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            target: no_wa,
            message: pesan,
          }),
        });
        const fonnteData = await fonnteRes.json();
        return res.json({ success: true, simulated: false, data: fonnteData });
      }
    }

    // Simulation response for local test or fallback
    return res.json({
      success: true,
      simulated: true,
      timestamp: new Date().toISOString(),
      recipient: no_wa,
      siswa: nama_siswa,
      message: 'Pesan berhasil diproses dan dikirimkan ke Gateway WhatsApp.',
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Gagal mengirim WhatsApp';
    return res.status(500).json({ error: errorMsg });
  }
});

// Vite dev server or static dist
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`Server SIAKAD SD berjalan di http://localhost:${port}`);
  });
}

startServer();
