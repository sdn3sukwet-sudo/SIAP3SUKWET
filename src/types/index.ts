export type AccountType = 'admin' | 'guru' | 'siswa';

export interface AuthUser {
  id: string;
  username: string; // or NISN for student, NIP for teacher
  nama: string;
  accountType: AccountType;
  avatar?: string;
  studentId?: string; // set when accountType === 'siswa'
  nip?: string;
  kelas_id?: string;
}

export interface UserAccountCredentials {
  username: string;
  passwordHash: string; // demo plain or hashed
  nama: string;
  accountType: AccountType;
  avatar?: string;
  studentId?: string;
  nip?: string;
  kelas_id?: string;
}

export interface SekolahProfil {
  id: string;
  nama_sekolah: string;
  npsn: string;
  alamat: string;
  kepala_sekolah: string;
  nip_kepala_sekolah: string;
  logo_url: string;
  jam_masuk: string; // e.g. "07:30"
  jam_pulang: string; // e.g. "13:00"
  wa_gateway_provider: 'fonnte' | 'wablas';
  wa_gateway_token?: string;
  wa_template_terlambat?: string;
}

export interface Siswa {
  id: string;
  nisn: string;
  nis: string;
  nama: string;
  kelas_id: string; // e.g. "Kelas 1", "Kelas 6"
  jenis_kelamin: 'L' | 'P';
  tanggal_lahir?: string;
  alamat?: string;
  nama_ortu?: string;
  no_wa_ortu: string;
  foto_url?: string;
  face_descriptor?: number[]; // 128-dimensional vector
  face_registered: boolean;
  saldo_tabungan: number;
}

export type StatusAbsensi = 'Hadir' | 'Terlambat' | 'Sakit' | 'Izin' | 'Alpa';

export interface Absensi {
  id: string;
  siswa_id: string;
  tanggal: string; // YYYY-MM-DD
  waktu_masuk: string; // HH:mm:ss
  waktu_pulang?: string;
  status: StatusAbsensi;
  keterangan?: string;
  metode: 'Wajah' | 'Manual' | 'Surat Izin';
  foto_bukti?: string;
}

export interface MataPelajaran {
  id: string;
  kode: string;
  nama: string;
  kkm: number;
}

export interface NilaiSiswa {
  id: string;
  siswa_id: string;
  mata_pelajaran: string;
  semester: 'Ganjil' | 'Genap';
  tahun_ajaran: string; // e.g. "2026/2027"
  nilai_harian: number;
  nilai_uts: number;
  nilai_uas: number;
  catatan_ai?: string;
}

export interface SoalUjian {
  id: string;
  mata_pelajaran: string;
  kelas: string;
  topik: string;
  pertanyaan: string;
  pilihan: string[];
  kunci: string;
  pembahasan?: string;
}

export type JenisTransaksi = 'SPP' | 'Tabungan';
export type TipeTransaksi = 'Masuk' | 'Keluar';

export interface TransaksiKeuangan {
  id: string;
  siswa_id: string;
  jenis: JenisTransaksi;
  tipe: TipeTransaksi;
  nominal: number;
  tanggal: string;
  bulan_spp?: string; // e.g. "Januari 2027"
  keterangan: string;
  petugas: string;
}

export interface SuratIzin {
  id: string;
  siswa_id: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  jenis_izin: 'Sakit' | 'Izin';
  alasan: string;
  foto_surat_url?: string;
  status_verifikasi: 'Disetujui' | 'Menunggu' | 'Ditolak';
  dibuat_pada: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
}
