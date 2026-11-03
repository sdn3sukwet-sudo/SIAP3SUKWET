import { SoalUjian, SekolahProfil } from '../types';

/**
 * Export Bank Soal ke format dokumen Word (.doc / .docx compatible HTML)
 * Dapat dibuka langsung oleh Microsoft Word, Google Docs, dan WPS Office
 */
export function exportSoalToWord(
  soalList: SoalUjian[],
  profil: SekolahProfil,
  mataPelajaran: string,
  kelas: string,
  includeKunci = true
) {
  const content = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>Naskah Soal Ujian - ${mataPelajaran}</title>
      <style>
        body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; margin: 2cm; }
        .kop { text-align: center; border-bottom: 3px double #000; padding-bottom: 8px; margin-bottom: 15px; }
        .kop h2 { margin: 0; font-size: 14pt; }
        .kop h3 { margin: 0; font-size: 16pt; font-weight: bold; }
        .kop p { margin: 2px 0; font-size: 10pt; }
        .identitas { width: 100%; margin-bottom: 20px; font-size: 11pt; border-collapse: collapse; }
        .identitas td { padding: 3px 5px; }
        .soal-item { margin-bottom: 15px; page-break-inside: avoid; }
        .pertanyaan { font-weight: bold; margin-bottom: 5px; }
        .pilihan { margin-left: 20px; }
        .pilihan div { margin-bottom: 3px; }
        .kunci-jawaban { margin-top: 30px; border-top: 2px dashed #333; padding-top: 15px; page-break-before: always; }
      </style>
    </head>
    <body>
      <div class="kop">
        <h2>PEMERINTAH KABUPATEN INDRAMAYU</h2>
        <h2>DINAS PENDIDIKAN DAN KEBUDAYAAN</h2>
        <h3>${profil.nama_sekolah.toUpperCase()}</h3>
        <p>${profil.alamat}</p>
        <p>NPSN: ${profil.npsn} | Tahun Ajaran 2026/2027</p>
      </div>

      <table class="identitas">
        <tr>
          <td width="20%"><strong>Mata Pelajaran</strong></td>
          <td width="30%">: ${mataPelajaran}</td>
          <td width="20%"><strong>Hari / Tanggal</strong></td>
          <td width="30%">: ............................</td>
        </tr>
        <tr>
          <td><strong>Kelas / Semester</strong></td>
          <td>: ${kelas} / Ganjil</td>
          <td><strong>Waktu</strong></td>
          <td>: 90 Menit</td>
        </tr>
      </table>

      <hr style="border: 1px solid #ccc; margin-bottom: 15px;" />
      <p style="font-style: italic; font-size: 10pt;">Petunjuk: Berilah tanda silang (X) pada huruf A, B, C, atau D di depan jawaban yang paling benar!</p>

      ${soalList
        .map(
          (s, idx) => `
        <div class="soal-item">
          <div class="pertanyaan">${idx + 1}. ${s.pertanyaan}</div>
          <div class="pilihan">
            ${s.pilihan.map((p) => `<div>${p}</div>`).join('')}
          </div>
        </div>
      `
        )
        .join('')}

      ${
        includeKunci
          ? `
        <div class="kunci-jawaban">
          <h3 style="text-align: center;">KUNCI JAWABAN & PEMBAHASAN GURU</h3>
          <table border="1" cellpadding="6" cellspacing="0" style="width: 100%; border-collapse: collapse; font-size: 10pt;">
            <tr style="background-color: #f2f2f2;">
              <th width="8%">No</th>
              <th width="15%">Kunci</th>
              <th>Pembahasan / Keterangan</th>
            </tr>
            ${soalList
              .map(
                (s, idx) => `
              <tr>
                <td align="center">${idx + 1}</td>
                <td align="center"><strong>${s.kunci}</strong></td>
                <td>${s.pembahasan || '-'}</td>
              </tr>
            `
              )
              .join('')}
          </table>
        </div>
      `
          : ''
      }
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', content], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Naskah_Soal_${mataPelajaran.replace(/\s+/g, '_')}_${kelas.replace(/\s+/g, '_')}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import Soal dari file Teks atau Word hasil copy/paste
 */
export function parseSoalFromText(
  rawText: string,
  mataPelajaran: string,
  kelas: string
): SoalUjian[] {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const result: SoalUjian[] = [];
  let currentPertanyaan = '';
  let currentPilihan: string[] = [];
  let currentKunci = 'A';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect question start like "1. ", "1) "
    if (/^\d+[\.\)]\s*/.test(line)) {
      if (currentPertanyaan && currentPilihan.length >= 2) {
        result.push({
          id: 'soal-' + Date.now() + '-' + result.length,
          mata_pelajaran: mataPelajaran,
          kelas,
          topik: 'Import Dokumen',
          pertanyaan: currentPertanyaan,
          pilihan: currentPilihan,
          kunci: currentKunci,
        });
        currentPilihan = [];
      }
      currentPertanyaan = line.replace(/^\d+[\.\)]\s*/, '');
    } else if (/^[A-D][\.\)]\s*/i.test(line)) {
      currentPilihan.push(line);
    } else if (/^Kunci:\s*([A-D])/i.test(line)) {
      const match = line.match(/^Kunci:\s*([A-D])/i);
      if (match) currentKunci = match[1].toUpperCase();
    } else if (currentPertanyaan && currentPilihan.length === 0) {
      currentPertanyaan += ' ' + line;
    }
  }

  // Push last question
  if (currentPertanyaan && currentPilihan.length >= 2) {
    result.push({
      id: 'soal-' + Date.now() + '-' + result.length,
      mata_pelajaran: mataPelajaran,
      kelas,
      topik: 'Import Dokumen',
      pertanyaan: currentPertanyaan,
      pilihan: currentPilihan,
      kunci: currentKunci,
    });
  }

  return result;
}
