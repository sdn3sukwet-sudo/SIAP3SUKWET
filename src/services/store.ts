import {
  Siswa,
  Absensi,
  SekolahProfil,
  NilaiSiswa,
  SoalUjian,
  TransaksiKeuangan,
  SuratIzin,
  SupabaseConfig,
  StatusAbsensi,
  AuthUser,
  UserAccountCredentials,
  AccountType,
} from '../types';
import {
  INITIAL_PROFIL,
  INITIAL_SISWA,
  INITIAL_NILAI,
  INITIAL_SOAL,
  INITIAL_TRANSAKSI,
  INITIAL_IZIN,
  INITIAL_ACCOUNTS,
} from '../data/initialData';
import { createClient } from '@supabase/supabase-js';

const STORAGE_KEYS = {
  PROFIL: 'siakad_sd_profil',
  SISWA: 'siakad_sd_siswa',
  ABSENSI: 'siakad_sd_absensi',
  NILAI: 'siakad_sd_nilai',
  SOAL: 'siakad_sd_soal',
  TRANSAKSI: 'siakad_sd_transaksi',
  IZIN: 'siakad_sd_izin',
  SUPABASE_CONFIG: 'siakad_sd_supabase_config',
  ACCOUNTS: 'siakad_sd_accounts',
  CURRENT_USER: 'siakad_sd_current_user',
};

// Seed sample attendance for today
function createInitialTodayAbsensi(students: Siswa[]): Absensi[] {
  const today = new Date().toISOString().split('T')[0];
  const list: Absensi[] = [];

  if (students.length > 0) {
    // Siswa 1 hadir jam 07:15
    list.push({
      id: 'abs-1',
      siswa_id: students[0].id,
      tanggal: today,
      waktu_masuk: '07:15:22',
      status: 'Hadir',
      metode: 'Wajah',
      keterangan: 'Tepat Waktu',
    });
  }
  if (students.length > 1) {
    // Siswa 2 hadir jam 07:22
    list.push({
      id: 'abs-2',
      siswa_id: students[1].id,
      tanggal: today,
      waktu_masuk: '07:22:45',
      status: 'Hadir',
      metode: 'Wajah',
      keterangan: 'Tepat Waktu',
    });
  }
  if (students.length > 2) {
    // Siswa 3 Izin Sakit
    list.push({
      id: 'abs-3',
      siswa_id: students[2].id,
      tanggal: today,
      waktu_masuk: '-',
      status: 'Sakit',
      metode: 'Surat Izin',
      keterangan: 'Demam & istirahat dokter',
    });
  }

  return list;
}

export class AppStore {
  private static instance: AppStore;
  private listeners: Set<() => void> = new Set();

  private constructor() {
    this.ensureInitialized();
  }

  public static getInstance(): AppStore {
    if (!AppStore.instance) {
      AppStore.instance = new AppStore();
    }
    return AppStore.instance;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  private ensureInitialized() {
    if (typeof window === 'undefined') return;

    if (!localStorage.getItem(STORAGE_KEYS.PROFIL)) {
      localStorage.setItem(STORAGE_KEYS.PROFIL, JSON.stringify(INITIAL_PROFIL));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SISWA)) {
      localStorage.setItem(STORAGE_KEYS.SISWA, JSON.stringify(INITIAL_SISWA));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ABSENSI)) {
      const abs = createInitialTodayAbsensi(INITIAL_SISWA);
      localStorage.setItem(STORAGE_KEYS.ABSENSI, JSON.stringify(abs));
    }
    if (!localStorage.getItem(STORAGE_KEYS.NILAI)) {
      localStorage.setItem(STORAGE_KEYS.NILAI, JSON.stringify(INITIAL_NILAI));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SOAL)) {
      localStorage.setItem(STORAGE_KEYS.SOAL, JSON.stringify(INITIAL_SOAL));
    }
    if (!localStorage.getItem(STORAGE_KEYS.TRANSAKSI)) {
      localStorage.setItem(STORAGE_KEYS.TRANSAKSI, JSON.stringify(INITIAL_TRANSAKSI));
    }
    if (!localStorage.getItem(STORAGE_KEYS.IZIN)) {
      localStorage.setItem(STORAGE_KEYS.IZIN, JSON.stringify(INITIAL_IZIN));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ACCOUNTS)) {
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(INITIAL_ACCOUNTS));
    }
  }

  // Authentication & Users
  public getCurrentUser(): AuthUser | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  public setCurrentUser(user: AuthUser | null) {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
    this.notify();
  }

  public login(
    username: string,
    password: string,
    accountType: AccountType
  ): { success: boolean; user?: AuthUser; message: string } {
    const u = username.trim();
    const p = password.trim();

    const accountsData = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    const accounts: UserAccountCredentials[] = accountsData ? JSON.parse(accountsData) : INITIAL_ACCOUNTS;

    const matched = accounts.find(
      (a) => a.username.toLowerCase() === u.toLowerCase() && a.accountType === accountType
    );

    if (matched) {
      if (matched.passwordHash === p) {
        const authUser: AuthUser = {
          id: 'usr-' + matched.username,
          username: matched.username,
          nama: matched.nama,
          accountType: matched.accountType,
          avatar: matched.avatar,
          studentId: matched.studentId,
          nip: matched.nip,
          kelas_id: matched.kelas_id,
        };
        this.setCurrentUser(authUser);
        return { success: true, user: authUser, message: `Login berhasil! Selamat datang, ${matched.nama}.` };
      } else {
        return { success: false, message: 'Kata sandi / PIN salah.' };
      }
    }

    // Dynamic login for Siswa: if student exists in student database
    if (accountType === 'siswa') {
      const allSiswa = this.getSiswa();
      const foundStudent = allSiswa.find((s) => s.nisn === u || s.nis === u);
      if (foundStudent) {
        // default password is '123456'
        if (p === '123456' || (foundStudent.tanggal_lahir && p === foundStudent.tanggal_lahir.replace(/-/g, ''))) {
          const authUser: AuthUser = {
            id: 'usr-sis-' + foundStudent.id,
            username: foundStudent.nisn,
            nama: foundStudent.nama,
            accountType: 'siswa',
            avatar: foundStudent.foto_url,
            studentId: foundStudent.id,
            kelas_id: foundStudent.kelas_id,
          };
          this.setCurrentUser(authUser);
          return { success: true, user: authUser, message: `Login siswa berhasil! Selamat datang, ${foundStudent.nama}.` };
        } else {
          return { success: false, message: 'PIN siswa salah. (Gunakan default: 123456)' };
        }
      }
    }

    return {
      success: false,
      message: `Akun ${accountType.toUpperCase()} dengan ID/Username "${u}" tidak ditemukan.`,
    };
  }

  public logout() {
    this.setCurrentUser(null);
  }


  // Profil
  public getProfil(): SekolahProfil {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROFIL);
      return data ? JSON.parse(data) : INITIAL_PROFIL;
    } catch {
      return INITIAL_PROFIL;
    }
  }

  public saveProfil(profil: SekolahProfil) {
    localStorage.setItem(STORAGE_KEYS.PROFIL, JSON.stringify(profil));
    this.notify();
  }

  // Siswa
  public getSiswa(): Siswa[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SISWA);
      return data ? JSON.parse(data) : INITIAL_SISWA;
    } catch {
      return INITIAL_SISWA;
    }
  }

  public saveSiswa(siswaList: Siswa[]) {
    localStorage.setItem(STORAGE_KEYS.SISWA, JSON.stringify(siswaList));
    this.notify();
  }

  public addOrUpdateSiswa(siswa: Siswa) {
    const list = this.getSiswa();
    const idx = list.findIndex((s) => s.id === siswa.id || s.nisn === siswa.nisn);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...siswa };
    } else {
      list.push(siswa);
    }
    this.saveSiswa(list);
  }

  public deleteSiswa(id: string) {
    const list = this.getSiswa().filter((s) => s.id !== id);
    this.saveSiswa(list);
  }

  // Absensi
  public getAbsensi(tanggal?: string): Absensi[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ABSENSI);
      const list: Absensi[] = data ? JSON.parse(data) : [];
      if (tanggal) {
        return list.filter((a) => a.tanggal === tanggal);
      }
      return list;
    } catch {
      return [];
    }
  }

  public recordAbsensi(
    siswaId: string,
    status: StatusAbsensi = 'Hadir',
    metode: 'Wajah' | 'Manual' | 'Surat Izin' = 'Wajah',
    keterangan?: string,
    fotoBukti?: string
  ): { success: boolean; absensi?: Absensi; message: string } {
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString('id-ID', { hour12: false });
    const list = this.getAbsensi();

    // Check if already attended today
    const existingIndex = list.findIndex((a) => a.siswa_id === siswaId && a.tanggal === today);
    if (existingIndex >= 0) {
      const prev = list[existingIndex];
      return {
        success: false,
        absensi: prev,
        message: `Siswa ini sudah absen hari ini pada pukul ${prev.waktu_masuk} (${prev.status}).`,
      };
    }

    const profil = this.getProfil();
    let finalStatus: StatusAbsensi = status;
    if (status === 'Hadir' && nowTime > profil.jam_masuk) {
      finalStatus = 'Terlambat';
    }

    const newAbsen: Absensi = {
      id: 'abs-' + Date.now(),
      siswa_id: siswaId,
      tanggal: today,
      waktu_masuk: nowTime,
      status: finalStatus,
      keterangan: keterangan || (finalStatus === 'Terlambat' ? `Terlambat (masuk ${nowTime})` : 'Tepat Waktu'),
      metode,
      foto_bukti: fotoBukti,
    };

    list.unshift(newAbsen);
    localStorage.setItem(STORAGE_KEYS.ABSENSI, JSON.stringify(list));
    this.notify();

    return {
      success: true,
      absensi: newAbsen,
      message: `Presensi berhasil dicatat! Status: ${finalStatus}`,
    };
  }

  public updateAbsensiStatus(id: string, newStatus: StatusAbsensi, keterangan?: string) {
    const list = this.getAbsensi();
    const idx = list.findIndex((a) => a.id === id);
    if (idx >= 0) {
      list[idx].status = newStatus;
      if (keterangan) list[idx].keterangan = keterangan;
      localStorage.setItem(STORAGE_KEYS.ABSENSI, JSON.stringify(list));
      this.notify();
    }
  }

  // Nilai
  public getNilai(siswaId?: string): NilaiSiswa[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NILAI);
      const list: NilaiSiswa[] = data ? JSON.parse(data) : INITIAL_NILAI;
      if (siswaId) {
        return list.filter((n) => n.siswa_id === siswaId);
      }
      return list;
    } catch {
      return INITIAL_NILAI;
    }
  }

  public saveNilai(nilai: NilaiSiswa) {
    const list = this.getNilai();
    const idx = list.findIndex((n) => n.id === nilai.id);
    if (idx >= 0) {
      list[idx] = nilai;
    } else {
      list.push(nilai);
    }
    localStorage.setItem(STORAGE_KEYS.NILAI, JSON.stringify(list));
    this.notify();
  }

  // Bank Soal
  public getSoal(): SoalUjian[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SOAL);
      return data ? JSON.parse(data) : INITIAL_SOAL;
    } catch {
      return INITIAL_SOAL;
    }
  }

  public saveSoal(soalList: SoalUjian[]) {
    localStorage.setItem(STORAGE_KEYS.SOAL, JSON.stringify(soalList));
    this.notify();
  }

  public addSoal(soal: SoalUjian) {
    const list = this.getSoal();
    list.unshift(soal);
    this.saveSoal(list);
  }

  // Transaksi Keuangan (SPP & Tabungan)
  public getTransaksi(siswaId?: string): TransaksiKeuangan[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRANSAKSI);
      const list: TransaksiKeuangan[] = data ? JSON.parse(data) : INITIAL_TRANSAKSI;
      if (siswaId) {
        return list.filter((t) => t.siswa_id === siswaId);
      }
      return list;
    } catch {
      return INITIAL_TRANSAKSI;
    }
  }

  public addTransaksi(trx: TransaksiKeuangan) {
    const list = this.getTransaksi();
    list.unshift(trx);
    localStorage.setItem(STORAGE_KEYS.TRANSAKSI, JSON.stringify(list));

    // Update siswa saldo tabungan if jenis Tabungan
    if (trx.jenis === 'Tabungan') {
      const siswaList = this.getSiswa();
      const sIdx = siswaList.findIndex((s) => s.id === trx.siswa_id);
      if (sIdx >= 0) {
        if (trx.tipe === 'Masuk') {
          siswaList[sIdx].saldo_tabungan += trx.nominal;
        } else {
          siswaList[sIdx].saldo_tabungan = Math.max(0, siswaList[sIdx].saldo_tabungan - trx.nominal);
        }
        this.saveSiswa(siswaList);
      }
    }

    this.notify();
  }

  // Surat Izin Orang Tua
  public getIzin(): SuratIzin[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.IZIN);
      return data ? JSON.parse(data) : INITIAL_IZIN;
    } catch {
      return INITIAL_IZIN;
    }
  }

  public submitSuratIzin(izin: SuratIzin) {
    const list = this.getIzin();
    list.unshift(izin);
    localStorage.setItem(STORAGE_KEYS.IZIN, JSON.stringify(list));

    // Automatically set or update student attendance for that date to Sakit or Izin
    const today = new Date().toISOString().split('T')[0];
    if (izin.tanggal_mulai <= today && izin.tanggal_selesai >= today) {
      const absensiList = this.getAbsensi();
      const existIdx = absensiList.findIndex((a) => a.siswa_id === izin.siswa_id && a.tanggal === today);
      if (existIdx >= 0) {
        absensiList[existIdx].status = izin.jenis_izin;
        absensiList[existIdx].keterangan = izin.alasan;
        absensiList[existIdx].metode = 'Surat Izin';
        absensiList[existIdx].foto_bukti = izin.foto_surat_url;
      } else {
        absensiList.unshift({
          id: 'abs-' + Date.now(),
          siswa_id: izin.siswa_id,
          tanggal: today,
          waktu_masuk: '-',
          status: izin.jenis_izin,
          keterangan: izin.alasan,
          metode: 'Surat Izin',
          foto_bukti: izin.foto_surat_url,
        });
      }
      localStorage.setItem(STORAGE_KEYS.ABSENSI, JSON.stringify(absensiList));
    }

    this.notify();
  }

  // Supabase Configuration
  public getSupabaseConfig(): SupabaseConfig {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SUPABASE_CONFIG);
      return data ? JSON.parse(data) : { url: '', anonKey: '', isConnected: false };
    } catch {
      return { url: '', anonKey: '', isConnected: false };
    }
  }

  public saveSupabaseConfig(config: SupabaseConfig) {
    localStorage.setItem(STORAGE_KEYS.SUPABASE_CONFIG, JSON.stringify(config));
    this.notify();
  }

  public async testSupabaseConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
    if (!url || !anonKey) {
      return { success: false, message: 'URL dan Anon Key Supabase tidak boleh kosong.' };
    }
    try {
      const client = createClient(url, anonKey);
      // Query sample table or ping
      const { error } = await client.from('sekolah_profil').select('id').limit(1);
      if (error && error.code !== 'PGRST116') {
        return { success: false, message: `Koneksi gagal: ${error.message}` };
      }
      return { success: true, message: 'Koneksi ke Supabase PostgreSQL berhasil!' };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error koneksi Supabase';
      return { success: false, message: `Koneksi gagal: ${msg}` };
    }
  }

  // Reset to default sample
  public resetToDefault() {
    localStorage.clear();
    this.ensureInitialized();
    this.notify();
  }
}

export const store = AppStore.getInstance();
