import * as XLSX from 'xlsx';
import { Siswa, Absensi } from '../types';

/**
 * Import Siswa dari berkas Excel (.xlsx / .xls)
 */
export async function importSiswaFromExcel(file: File): Promise<{
  success: boolean;
  importedCount: number;
  data: Partial<Siswa>[];
  errors: string[];
}> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        const workbook = XLSX.read(buffer, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        const importedData: Partial<Siswa>[] = [];
        const errors: string[] = [];

        rows.forEach((row, index) => {
          const rowNum = index + 2;
          const nisn = String(row['NISN'] || row['nisn'] || '').trim();
          const nis = String(row['NIS'] || row['nis'] || '').trim();
          const nama = String(row['Nama'] || row['NAMA'] || row['nama_siswa'] || '').trim();
          const kelas = String(row['Kelas'] || row['KELAS'] || row['kelas_id'] || 'Kelas 1A').trim();
          const jk = String(row['Jenis Kelamin'] || row['JK'] || 'L').toUpperCase().startsWith('P') ? 'P' : 'L';
          const noWa = String(row['No WA Ortu'] || row['NO_WA'] || row['no_wa_ortu'] || '081234567890').trim();
          const alamat = String(row['Alamat'] || row['ALAMAT'] || '').trim();
          const namaOrtu = String(row['Nama Ortu'] || row['Orang Tua'] || '').trim();

          if (!nisn && !nama) {
            return; // skip empty line
          }

          if (!nisn) {
            errors.push(`Baris ${rowNum}: NISN kosong`);
            return;
          }
          if (!nama) {
            errors.push(`Baris ${rowNum}: Nama Siswa kosong`);
            return;
          }

          importedData.push({
            id: 'sis-' + Date.now() + '-' + index,
            nisn,
            nis: nis || nisn.slice(-4),
            nama,
            kelas_id: kelas,
            jenis_kelamin: jk,
            no_wa_ortu: noWa,
            alamat,
            nama_ortu: namaOrtu,
            face_registered: false,
            saldo_tabungan: 0,
          });
        });

        resolve({
          success: importedData.length > 0,
          importedCount: importedData.length,
          data: importedData,
          errors,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Format file Excel tidak valid';
        resolve({
          success: false,
          importedCount: 0,
          data: [],
          errors: [msg],
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        importedCount: 0,
        data: [],
        errors: ['Gagal membaca berkas Excel'],
      });
    };

    reader.readAsBinaryString(file);
  });
}

/**
 * Unduh Template Excel Kosong untuk Impor Data Siswa
 */
export function downloadTemplateSiswaExcel() {
  const headers = [
    {
      NISN: '0123456788',
      NIS: '232408',
      Nama: 'Raden Arya Sena',
      Kelas: 'Kelas 4A',
      'Jenis Kelamin': 'L',
      'No WA Ortu': '081234567890',
      'Nama Ortu': 'Bpk. Suryo',
      Alamat: 'Sukra Wetan RT 01/02',
    },
    {
      NISN: '0123456789',
      NIS: '232409',
      Nama: 'Dewi Sekar Arum',
      Kelas: 'Kelas 4A',
      'Jenis Kelamin': 'P',
      'No WA Ortu': '082155667788',
      'Nama Ortu': 'Ibu Lestari',
      Alamat: 'Sukra Wetan RT 03/01',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(headers);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template Siswa');
  XLSX.writeFile(wb, 'Template_Impor_Siswa_SDN3_SukraWetan.xlsx');
}

/**
 * Export Daftar Seluruh Siswa ke Excel
 */
export function exportSiswaToExcel(siswaList: Siswa[]) {
  const exportData = siswaList.map((s, idx) => ({
    No: idx + 1,
    NISN: s.nisn,
    NIS: s.nis,
    'Nama Lengkap': s.nama,
    Kelas: s.kelas_id,
    'L/P': s.jenis_kelamin,
    'Status Wajah': s.face_registered ? 'Terdaftar' : 'Belum Terdaftar',
    'Saldo Tabungan': s.saldo_tabungan,
    'No WA Ortu': s.no_wa_ortu,
    'Orang Tua/Wali': s.nama_ortu || '-',
    Alamat: s.alamat || '-',
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data Siswa');
  XLSX.writeFile(wb, `Data_Siswa_SDN3_SukraWetan_${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * Export Rekapitulasi Absensi ke Excel
 */
export function exportAbsensiToExcel(
  absensiList: Absensi[],
  siswaList: Siswa[],
  filterKelas?: string
) {
  const filteredStudents = filterKelas
    ? siswaList.filter((s) => s.kelas_id === filterKelas)
    : siswaList;

  const studentMap = new Map(siswaList.map((s) => [s.id, s]));

  const rows = absensiList
    .filter((a) => {
      const student = studentMap.get(a.siswa_id);
      if (!student) return false;
      return !filterKelas || student.kelas_id === filterKelas;
    })
    .map((a, idx) => {
      const student = studentMap.get(a.siswa_id);
      return {
        No: idx + 1,
        Tanggal: a.tanggal,
        'Waktu Masuk': a.waktu_masuk,
        NISN: student?.nisn || '-',
        'Nama Siswa': student?.nama || 'Siswa',
        Kelas: student?.kelas_id || '-',
        'Status Kehadiran': a.status,
        Metode: a.metode,
        Keterangan: a.keterangan || '-',
      };
    });

  // Calculate summary counts per student
  const summaryMap: Record<string, { Hadir: number; Terlambat: number; Sakit: number; Izin: number; Alpa: number }> = {};
  filteredStudents.forEach((s) => {
    summaryMap[s.id] = { Hadir: 0, Terlambat: 0, Sakit: 0, Izin: 0, Alpa: 0 };
  });

  absensiList.forEach((a) => {
    if (summaryMap[a.siswa_id] && summaryMap[a.siswa_id][a.status] !== undefined) {
      summaryMap[a.siswa_id][a.status]++;
    }
  });

  const summaryRows = filteredStudents.map((s, idx) => ({
    No: idx + 1,
    NISN: s.nisn,
    'Nama Siswa': s.nama,
    Kelas: s.kelas_id,
    'Hadir (H)': summaryMap[s.id].Hadir,
    'Terlambat (T)': summaryMap[s.id].Terlambat,
    'Sakit (S)': summaryMap[s.id].Sakit,
    'Izin (I)': summaryMap[s.id].Izin,
    'Alpa (A)': summaryMap[s.id].Alpa,
    'Total Hadir Efektif': summaryMap[s.id].Hadir + summaryMap[s.id].Terlambat,
  }));

  const wb = XLSX.utils.book_new();

  const wsJurnal = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, wsJurnal, 'Jurnal Absensi');

  const wsRekap = XLSX.utils.json_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsRekap, 'Rekapitulasi Siswa');

  const fileName = `Rekap_Absensi_${filterKelas ? filterKelas.replace(/\s+/g, '_') : 'Semua'}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
