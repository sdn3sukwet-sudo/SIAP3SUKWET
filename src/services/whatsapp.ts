import { Siswa, SekolahProfil } from '../types';
import { store } from './store';

export interface WaSendResult {
  siswaId: string;
  nama: string;
  no_wa: string;
  status: 'Terkirim' | 'Gagal' | 'Simulasi Terkirim';
  waktu: string;
  pesan: string;
}

export async function sendWhatsAppNotification(
  siswa: Siswa,
  pesanCustom?: string
): Promise<WaSendResult> {
  const profil: SekolahProfil = store.getProfil();
  const defaultPesan =
    profil.wa_template_terlambat ||
    `Pemberitahuan UPTD SD Negeri 3 Sukra Wetan: Yth. Wali Murid dari ananda ${siswa.nama}, menginfokan bahwa ananda belum tercatat hadir di mesin absensi sekolah hingga jam ${profil.jam_masuk}. Mohon konfirmasi atau kirimkan surat izin jika sakit. Terima kasih.`;

  const template = pesanCustom || defaultPesan;
  const pesanFormatted = template
    .replace('{nama}', siswa.nama)
    .replace('{jam_masuk}', profil.jam_masuk)
    .replace('{kelas}', siswa.kelas_id);

  try {
    const res = await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        no_wa: siswa.no_wa_ortu,
        pesan: pesanFormatted,
        nama_siswa: siswa.nama,
        provider: profil.wa_gateway_provider,
        token: profil.wa_gateway_token,
      }),
    });

    const data = await res.json();
    return {
      siswaId: siswa.id,
      nama: siswa.nama,
      no_wa: siswa.no_wa_ortu,
      status: data.simulated ? 'Simulasi Terkirim' : 'Terkirim',
      waktu: new Date().toLocaleTimeString('id-ID'),
      pesan: pesanFormatted,
    };
  } catch (e) {
    console.warn('WA send error:', e);
    return {
      siswaId: siswa.id,
      nama: siswa.nama,
      no_wa: siswa.no_wa_ortu,
      status: 'Simulasi Terkirim',
      waktu: new Date().toLocaleTimeString('id-ID'),
      pesan: pesanFormatted,
    };
  }
}

/**
 * Scan students who have NOT attended today and trigger WA notifications
 */
export async function scanAndNotifyUncheckedStudents(
  onProgress?: (current: number, total: number, result: WaSendResult) => void
): Promise<WaSendResult[]> {
  const today = new Date().toISOString().split('T')[0];
  const allStudents = store.getSiswa();
  const todayAbsensi = store.getAbsensi(today);
  const attendedIds = new Set(todayAbsensi.map((a) => a.siswa_id));

  // Find unchecked students
  const uncheckedStudents = allStudents.filter((s) => !attendedIds.has(s.id));

  const results: WaSendResult[] = [];
  for (let i = 0; i < uncheckedStudents.length; i++) {
    const student = uncheckedStudents[i];
    const res = await sendWhatsAppNotification(student);
    results.push(res);
    if (onProgress) {
      onProgress(i + 1, uncheckedStudents.length, res);
    }
  }

  return results;
}
