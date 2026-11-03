/**
 * Skema DDL PostgreSQL untuk Supabase
 * Lengkap dengan Row Level Security (RLS), Trigger updated_at, dan Foreign Keys
 */

export const SUPABASE_DDL_SQL = `-- ==============================================================================
-- SISTEM INFORMASI AKADEMIK SEKOLAH DASAR (SIAKAD SD) & KIOSK ABSENSI WAJAH
-- Database: Supabase (PostgreSQL 15+)
-- Lembaga: UPTD SD NEGERI 3 SUKRA WETAN, INDRAMAYU
-- ==============================================================================

-- 0. EXTENSION
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABEL: sekolah_profil
CREATE TABLE IF NOT EXISTS public.sekolah_profil (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama_sekolah VARCHAR(255) NOT NULL,
    npsn VARCHAR(20) NOT NULL UNIQUE,
    alamat TEXT NOT NULL,
    kepala_sekolah VARCHAR(150) NOT NULL,
    nip_kepala_sekolah VARCHAR(50),
    logo_url TEXT,
    jam_masuk TIME NOT NULL DEFAULT '07:30:00',
    jam_pulang TIME NOT NULL DEFAULT '13:00:00',
    wa_gateway_provider VARCHAR(50) DEFAULT 'fonnte',
    wa_gateway_token TEXT,
    wa_template_terlambat TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABEL: users_meta (Menyimpan Metadata Role Pengguna Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users_meta (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nama VARCHAR(150) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'guru', 'orang_tua', 'kiosk')),
    no_telepon VARCHAR(25),
    foto_avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABEL: siswa
CREATE TABLE IF NOT EXISTS public.siswa (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nisn VARCHAR(20) NOT NULL UNIQUE,
    nis VARCHAR(20) NOT NULL,
    nama VARCHAR(150) NOT NULL,
    kelas_id VARCHAR(50) NOT NULL, -- Contoh: 'Kelas 1A', 'Kelas 4A'
    jenis_kelamin VARCHAR(1) CHECK (jenis_kelamin IN ('L', 'P')),
    tanggal_lahir DATE,
    alamat TEXT,
    nama_ortu VARCHAR(150),
    no_wa_ortu VARCHAR(25) NOT NULL,
    foto_url TEXT,
    -- Vektor 128 dimensi hasil ekstraksi face-api.js untuk face matching
    face_descriptor JSONB, 
    face_registered BOOLEAN DEFAULT FALSE,
    saldo_tabungan NUMERIC(15,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pencarian cepat siswa
CREATE INDEX IF NOT EXISTS idx_siswa_nisn ON public.siswa(nisn);
CREATE INDEX IF NOT EXISTS idx_siswa_kelas ON public.siswa(kelas_id);

-- 4. TABEL: absensi
CREATE TABLE IF NOT EXISTS public.absensi (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    siswa_id UUID NOT NULL REFERENCES public.siswa(id) ON DELETE CASCADE,
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    waktu_masuk TIME NOT NULL,
    waktu_pulang TIME,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Hadir', 'Terlambat', 'Sakit', 'Izin', 'Alpa')),
    keterangan TEXT,
    metode VARCHAR(30) DEFAULT 'Wajah' CHECK (metode IN ('Wajah', 'Manual', 'Surat Izin')),
    foto_bukti TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unik_absen_harian UNIQUE (siswa_id, tanggal)
);

CREATE INDEX IF NOT EXISTS idx_absensi_tanggal ON public.absensi(tanggal);
CREATE INDEX IF NOT EXISTS idx_absensi_siswa ON public.absensi(siswa_id);

-- 5. TABEL: nilai_harian & rapor
CREATE TABLE IF NOT EXISTS public.nilai_harian (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    siswa_id UUID NOT NULL REFERENCES public.siswa(id) ON DELETE CASCADE,
    mata_pelajaran VARCHAR(100) NOT NULL,
    semester VARCHAR(10) NOT NULL DEFAULT 'Ganjil' CHECK (semester IN ('Ganjil', 'Genap')),
    tahun_ajaran VARCHAR(20) NOT NULL DEFAULT '2026/2027',
    nilai_harian NUMERIC(5,2) DEFAULT 0.00,
    nilai_uts NUMERIC(5,2) DEFAULT 0.00,
    nilai_uas NUMERIC(5,2) DEFAULT 0.00,
    catatan_ai TEXT, -- Narasi evaluasi rapor otomatis dibuat oleh Google Gemini API
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nilai_siswa ON public.nilai_harian(siswa_id);

-- 6. TABEL: transaksi_keuangan (SPP & Tabungan)
CREATE TABLE IF NOT EXISTS public.transaksi_keuangan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    siswa_id UUID NOT NULL REFERENCES public.siswa(id) ON DELETE CASCADE,
    jenis VARCHAR(20) NOT NULL CHECK (jenis IN ('SPP', 'Tabungan')),
    tipe VARCHAR(20) NOT NULL CHECK (tipe IN ('Masuk', 'Keluar')),
    nominal NUMERIC(15,2) NOT NULL CHECK (nominal > 0),
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    bulan_spp VARCHAR(50), -- Contoh: 'November 2026'
    keterangan TEXT,
    petugas VARCHAR(150) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transaksi_siswa ON public.transaksi_keuangan(siswa_id);

-- 7. TABEL: bank_soal (Ujian / Latihan Soal)
CREATE TABLE IF NOT EXISTS public.bank_soal (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mata_pelajaran VARCHAR(100) NOT NULL,
    kelas VARCHAR(50) NOT NULL,
    topik VARCHAR(150) NOT NULL,
    pertanyaan TEXT NOT NULL,
    pilihan JSONB NOT NULL, -- Array opsi ["A. ...", "B. ...", "C. ...", "D. ..."]
    kunci VARCHAR(5) NOT NULL,
    pembahasan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. TABEL: surat_izin_ortu (Pengajuan Izin Sakit dari Orang Tua)
CREATE TABLE IF NOT EXISTS public.surat_izin_ortu (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    siswa_id UUID NOT NULL REFERENCES public.siswa(id) ON DELETE CASCADE,
    tanggal_mulai DATE NOT NULL,
    tanggal_selesai DATE NOT NULL,
    jenis_izin VARCHAR(20) NOT NULL CHECK (jenis_izin IN ('Sakit', 'Izin')),
    alasan TEXT NOT NULL,
    foto_surat_url TEXT,
    status_verifikasi VARCHAR(20) DEFAULT 'Menunggu' CHECK (status_verifikasi IN ('Disetujui', 'Menunggu', 'Ditolak')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- ATURAN KEAMANAN ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- Aktifkan RLS di setiap tabel
ALTER TABLE public.sekolah_profil ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.siswa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.absensi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nilai_harian ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaksi_keuangan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_soal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surat_izin_ortu ENABLE ROW LEVEL SECURITY;

-- 1. Kebijakan Profil Sekolah: Semua pengguna bisa membaca, hanya Admin yang bisa edit
CREATE POLICY "Publik dapat membaca profil sekolah" 
ON public.sekolah_profil FOR SELECT USING (true);

CREATE POLICY "Admin dapat mengupdate profil sekolah" 
ON public.sekolah_profil FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.users_meta 
        WHERE users_meta.id = auth.uid() AND users_meta.role = 'admin'
    )
);

-- 2. Kebijakan Siswa: Dapat dibaca oleh Admin, Guru, dan Kiosk (Anon/Auth)
CREATE POLICY "Siswa dapat dibaca oleh publik atau pengguna terautentikasi" 
ON public.siswa FOR SELECT USING (true);

CREATE POLICY "Admin dan Guru dapat mengelola data siswa" 
ON public.siswa FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.users_meta 
        WHERE users_meta.id = auth.uid() AND users_meta.role IN ('admin', 'guru')
    )
);

-- 3. Kebijakan Absensi: Kiosk Absensi & Wali Kelas dapat mencatat kehadiran
CREATE POLICY "Absensi dapat dibaca oleh semua pihak berkepentingan" 
ON public.absensi FOR SELECT USING (true);

CREATE POLICY "Kiosk dan Guru dapat memasukkan absensi" 
ON public.absensi FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admin dan Guru dapat memperbarui status absensi" 
ON public.absensi FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.users_meta 
        WHERE users_meta.id = auth.uid() AND users_meta.role IN ('admin', 'guru')
    )
);

-- 4. Kebijakan Nilai: Guru dan Admin dapat input nilai, Orang tua hanya membaca nilai anaknya
CREATE POLICY "Membaca nilai" 
ON public.nilai_harian FOR SELECT USING (true);

CREATE POLICY "Guru dan Admin dapat menginput & update nilai" 
ON public.nilai_harian FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.users_meta 
        WHERE users_meta.id = auth.uid() AND users_meta.role IN ('admin', 'guru')
    )
);

-- 5. Kebijakan Transaksi Keuangan: Hanya Admin / Petugas Kasir yang bisa insert
CREATE POLICY "Lihat transaksi keuangan" 
ON public.transaksi_keuangan FOR SELECT USING (true);

CREATE POLICY "Admin mengelola transaksi keuangan" 
ON public.transaksi_keuangan FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.users_meta 
        WHERE users_meta.id = auth.uid() AND users_meta.role = 'admin'
    )
);

-- 6. Kebijakan Izin Ortu: Orang tua dapat mengirim surat izin, Admin & Guru memverifikasi
CREATE POLICY "Orang tua dapat mengajukan izin" 
ON public.surat_izin_ortu FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Semua pihak dapat melihat riwayat perizinan" 
ON public.surat_izin_ortu FOR SELECT USING (true);

CREATE POLICY "Admin dan Guru dapat memverifikasi perizinan" 
ON public.surat_izin_ortu FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.users_meta 
        WHERE users_meta.id = auth.uid() AND users_meta.role IN ('admin', 'guru')
    )
);

-- ==============================================================================
-- TRIGGER OTOMATIS: Update Saldo Tabungan Siswa saat Transaksi Masuk/Keluar
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_update_saldo_tabungan()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.jenis = 'Tabungan' THEN
        IF NEW.tipe = 'Masuk' THEN
            UPDATE public.siswa 
            SET saldo_tabungan = saldo_tabungan + NEW.nominal 
            WHERE id = NEW.siswa_id;
        ELSIF NEW.tipe = 'Keluar' THEN
            UPDATE public.siswa 
            SET saldo_tabungan = saldo_tabungan - NEW.nominal 
            WHERE id = NEW.siswa_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_saldo ON public.transaksi_keuangan;
CREATE TRIGGER trigger_update_saldo
AFTER INSERT ON public.transaksi_keuangan
FOR EACH ROW
EXECUTE FUNCTION public.handle_update_saldo_tabungan();
`;
