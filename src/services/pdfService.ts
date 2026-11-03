import { jsPDF } from 'jspdf';
import { Siswa, NilaiSiswa, SekolahProfil } from '../types';

export function generateRaporPDF(
  siswa: Siswa,
  nilaiList: NilaiSiswa[],
  profil: SekolahProfil,
  catatanWaliKelas: string
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const margin = 14;
  let y = 14;

  // Header / Kop Surat
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('PEMERINTAH KABUPATEN INDRAMAYU', pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.text('DINAS PENDIDIKAN DAN KEBUDAYAAN', pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.setFontSize(14);
  doc.text(profil.nama_sekolah.toUpperCase(), pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(profil.alamat, pageWidth / 2, y, { align: 'center' });
  y += 4;
  doc.text(`NPSN: ${profil.npsn} | Email: sdn3sukwet@gmail.com`, pageWidth / 2, y, { align: 'center' });
  y += 3;

  // Double horizontal lines
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageWidth - margin, y);
  y += 1;
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 7;

  // Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('LAPORAN HASIL BELAJAR PESERTA DIDIK (RAPOR SISWA)', pageWidth / 2, y, { align: 'center' });
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.text('TAHUN AJARAN 2026/2027 - SEMESTER GANJIL', pageWidth / 2, y + 4.5, { align: 'center' });
  y += 11;

  // Student Bio Box
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, pageWidth - margin * 2, 22, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y, pageWidth - margin * 2, 22, 'S');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Nama Peserta Didik', margin + 4, y + 5);
  doc.text('NISN / NIS', margin + 4, y + 10);
  doc.text('Nama Sekolah', margin + 4, y + 15);

  doc.setFont('helvetica', 'normal');
  doc.text(`:  ${siswa.nama}`, margin + 38, y + 5);
  doc.text(`:  ${siswa.nisn} / ${siswa.nis}`, margin + 38, y + 10);
  doc.text(`:  ${profil.nama_sekolah}`, margin + 38, y + 15);

  doc.setFont('helvetica', 'bold');
  doc.text('Kelas / Rombel', pageWidth / 2 + 10, y + 5);
  doc.text('Fase / Kurikulum', pageWidth / 2 + 10, y + 10);
  doc.text('Tahun Ajaran', pageWidth / 2 + 10, y + 15);

  doc.setFont('helvetica', 'normal');
  doc.text(`:  ${siswa.kelas_id}`, pageWidth / 2 + 42, y + 5);
  doc.text(':  Fase B / Kurikulum Merdeka', pageWidth / 2 + 42, y + 10);
  doc.text(':  2026/2027 (Ganjil)', pageWidth / 2 + 42, y + 15);

  y += 27;

  // Grades Table Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('A. CAPAIAN KOMPETENSI MATA PELAJARAN', margin, y);
  y += 4;

  const colX = {
    no: margin,
    mapel: margin + 8,
    harian: margin + 78,
    uts: margin + 98,
    uas: margin + 118,
    akhir: margin + 138,
    predikat: margin + 160,
  };

  // Table header background
  doc.setFillColor(226, 232, 240);
  doc.rect(margin, y, pageWidth - margin * 2, 7, 'F');
  doc.setDrawColor(148, 163, 184);
  doc.rect(margin, y, pageWidth - margin * 2, 7, 'S');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('No', colX.no + 2, y + 4.8);
  doc.text('Mata Pelajaran', colX.mapel + 2, y + 4.8);
  doc.text('Harian', colX.harian + 2, y + 4.8);
  doc.text('UTS', colX.uts + 3, y + 4.8);
  doc.text('UAS', colX.uas + 3, y + 4.8);
  doc.text('Akhir', colX.akhir + 3, y + 4.8);
  doc.text('Predikat', colX.predikat + 3, y + 4.8);

  y += 7;

  // Table rows
  doc.setFont('helvetica', 'normal');
  let totalScore = 0;

  nilaiList.forEach((n, idx) => {
    const finalScore = Math.round((n.nilai_harian * 0.4) + (n.nilai_uts * 0.3) + (n.nilai_uas * 0.3));
    totalScore += finalScore;

    let predikat = 'C (Cukup)';
    if (finalScore >= 90) predikat = 'A (Sangat Baik)';
    else if (finalScore >= 80) predikat = 'B (Baik)';
    else if (finalScore < 70) predikat = 'D (Perlu Bimbingan)';

    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, pageWidth - margin * 2, 6.5, 'F');
    }
    doc.rect(margin, y, pageWidth - margin * 2, 6.5, 'S');

    doc.text(String(idx + 1), colX.no + 3, y + 4.5);
    const mapelShort = n.mata_pelajaran.length > 34 ? n.mata_pelajaran.substring(0, 32) + '...' : n.mata_pelajaran;
    doc.text(mapelShort, colX.mapel + 2, y + 4.5);
    doc.text(String(n.nilai_harian), colX.harian + 5, y + 4.5);
    doc.text(String(n.nilai_uts), colX.uts + 5, y + 4.5);
    doc.text(String(n.nilai_uas), colX.uas + 5, y + 4.5);
    doc.setFont('helvetica', 'bold');
    doc.text(String(finalScore), colX.akhir + 5, y + 4.5);
    doc.setFont('helvetica', 'normal');
    doc.text(predikat, colX.predikat + 2, y + 4.5);

    y += 6.5;
  });

  // Table summary
  const average = nilaiList.length > 0 ? Math.round(totalScore / nilaiList.length) : 0;
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, pageWidth - margin * 2, 6.5, 'F');
  doc.rect(margin, y, pageWidth - margin * 2, 6.5, 'S');
  doc.setFont('helvetica', 'bold');
  doc.text('Rata-rata Capaian Nilai Akhir', colX.mapel + 2, y + 4.5);
  doc.text(String(average), colX.akhir + 5, y + 4.5);
  doc.text(average >= 85 ? 'Sangat Memuaskan' : average >= 75 ? 'Memuaskan' : 'Cukup', colX.predikat + 2, y + 4.5);

  y += 11;

  // Section B: AI Narrative Report / Catatan Wali Kelas
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('B. DESKRIPSI CAPAIAN & CATATAN WALI KELAS (CERDAS AI GEMINI)', margin, y);
  y += 4;

  doc.setFillColor(255, 255, 255);
  doc.rect(margin, y, pageWidth - margin * 2, 28, 'S');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  const cleanNote = catatanWaliKelas.replace(/\*\*/g, '').replace(/#/g, '');
  const splitText = doc.splitTextToSize(cleanNote, pageWidth - margin * 2 - 6);
  doc.text(splitText.slice(0, 5), margin + 3, y + 5);

  y += 33;

  // Signatures block
  const dateStr = `Sukra Wetan, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(dateStr, pageWidth - margin - 45, y, { align: 'center' });
  y += 4;

  const sigCol1 = margin + 25;
  const sigCol2 = pageWidth - margin - 45;

  doc.text('Orang Tua / Wali Murid,', sigCol1, y, { align: 'center' });
  doc.text('Guru Wali Kelas,', sigCol2, y, { align: 'center' });

  y += 18;
  doc.setFont('helvetica', 'bold');
  doc.text(`( ${siswa.nama_ortu || '.....................................'} )`, sigCol1, y, { align: 'center' });
  doc.text('( Bpk. Ridwan Fauzi, S.Pd. )', sigCol2, y, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('NIP. 19850614 201101 1 002', sigCol2, y + 4, { align: 'center' });

  y += 8;
  doc.text('Mengetahui,', pageWidth / 2, y, { align: 'center' });
  doc.text('Kepala Sekolah UPTD SD Negeri 3 Sukra Wetan', pageWidth / 2, y + 4, { align: 'center' });

  y += 18;
  doc.setFont('helvetica', 'bold');
  doc.text(`( ${profil.kepala_sekolah} )`, pageWidth / 2, y, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text(`NIP. ${profil.nip_kepala_sekolah}`, pageWidth / 2, y + 4, { align: 'center' });

  // Save the PDF
  const filename = `Rapor_${siswa.nama.replace(/\s+/g, '_')}_${siswa.kelas_id.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
}
