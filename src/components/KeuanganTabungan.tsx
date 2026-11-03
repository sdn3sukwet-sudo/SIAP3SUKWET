import { useState, useEffect } from 'react';
import { Siswa, TransaksiKeuangan, JenisTransaksi, TipeTransaksi } from '../types';
import { store } from '../services/store';
import {
  Wallet,
  Calendar,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  Printer,
  CheckCircle2,
  Search,
  Filter,
  DollarSign,
  Receipt,
  User,
  X,
} from 'lucide-react';

export function KeuanganTabungan() {
  const [activeTab, setActiveTab] = useState<'spp' | 'tabungan'>('spp');
  const [students, setStudents] = useState<Siswa[]>(store.getSiswa());
  const [transaksiList, setTransaksiList] = useState<TransaksiKeuangan[]>(store.getTransaksi());

  const [selectedStudentId, setSelectedStudentId] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  // Transaction Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalJenis, setModalJenis] = useState<JenisTransaksi>('SPP');
  const [modalTipe, setModalTipe] = useState<TipeTransaksi>('Masuk');
  const [targetStudentId, setTargetStudentId] = useState<string>(students[0]?.id || '');
  const [nominal, setNominal] = useState<number>(50000);
  const [bulanSpp, setBulanSpp] = useState<string>('November 2026');
  const [keterangan, setKeterangan] = useState<string>('Pembayaran SPP Komite Sekolah');
  const [petugas, setPetugas] = useState<string>('Ibu Hj. Aminah (Bendahara)');

  // Printable Receipt
  const [receiptData, setReceiptData] = useState<TransaksiKeuangan | null>(null);

  useEffect(() => {
    const unsub = store.subscribe(() => {
      setStudents(store.getSiswa());
      setTransaksiList(store.getTransaksi());
    });
    return unsub;
  }, []);

  const handleOpenAdd = (jenis: JenisTransaksi, tipe: TipeTransaksi = 'Masuk') => {
    setModalJenis(jenis);
    setModalTipe(tipe);
    if (jenis === 'SPP') {
      setNominal(50000);
      setKeterangan(`Pembayaran Iuran Komite / SPP ${bulanSpp}`);
    } else {
      setNominal(20000);
      setKeterangan(tipe === 'Masuk' ? 'Setoran Tabungan Siswa' : 'Penarikan Tabungan Siswa');
    }
    setIsModalOpen(true);
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStudentId || nominal <= 0) return;

    const student = students.find((s) => s.id === targetStudentId);
    if (modalJenis === 'Tabungan' && modalTipe === 'Keluar') {
      if ((student?.saldo_tabungan || 0) < nominal) {
        alert('Saldo tabungan siswa tidak mencukupi untuk melakukan penarikan!');
        return;
      }
    }

    const newTrx: TransaksiKeuangan = {
      id: 'trx-' + Date.now(),
      siswa_id: targetStudentId,
      jenis: modalJenis,
      tipe: modalTipe,
      nominal: Number(nominal),
      tanggal: new Date().toISOString().split('T')[0],
      bulan_spp: modalJenis === 'SPP' ? bulanSpp : undefined,
      keterangan: keterangan,
      petugas: petugas,
    };

    store.addTransaksi(newTrx);
    setIsModalOpen(false);
    setReceiptData(newTrx);
  };

  const studentMap = new Map(students.map((s) => [s.id, s]));

  const filteredTransaksi = transaksiList.filter((t) => {
    const matchJenis = t.jenis === (activeTab === 'spp' ? 'SPP' : 'Tabungan');
    const matchStudent = selectedStudentId === 'Semua' || t.siswa_id === selectedStudentId;
    const student = studentMap.get(t.siswa_id);
    const matchSearch =
      !searchQuery ||
      (student &&
        (student.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student.nisn.includes(searchQuery)));
    return matchJenis && matchStudent && matchSearch;
  });

  const totalTabungan = students.reduce((sum, s) => sum + (s.saldo_tabungan || 0), 0);
  const totalSppBulanIni = transaksiList
    .filter((t) => t.jenis === 'SPP' && t.tipe === 'Masuk')
    .reduce((sum, t) => sum + t.nominal, 0);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800">
            Transaksi Keuangan, SPP & Tabungan Siswa
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencatatan iuran komite/SPP, penyetoran & penarikan tabungan, serta cetak kuitansi resmi
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'spp' ? (
            <button
              onClick={() => handleOpenAdd('SPP', 'Masuk')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Bayar SPP Baru</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenAdd('Tabungan', 'Masuk')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
              >
                <ArrowDownRight className="w-4 h-4" />
                <span>Setor Tabungan</span>
              </button>
              <button
                onClick={() => handleOpenAdd('Tabungan', 'Keluar')}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Tarik Tabungan</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs & Stats Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tab Switcher */}
        <div className="bg-white p-2 rounded-2xl border border-slate-200 flex items-center gap-1 md:col-span-1">
          <button
            onClick={() => setActiveTab('spp')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'spp'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Iuran SPP / Komite</span>
          </button>
          <button
            onClick={() => setActiveTab('tabungan')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'tabungan'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Buku Tabungan</span>
          </button>
        </div>

        {/* Stats 1 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">
              Total Seluruh Kas Tabungan
            </span>
            <div className="text-xl font-black text-emerald-600 mt-1">
              Rp {totalTabungan.toLocaleString('id-ID')}
            </div>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        {/* Stats 2 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">
              Total Penerimaan SPP
            </span>
            <div className="text-xl font-black text-blue-600 mt-1">
              Rp {totalSppBulanIni.toLocaleString('id-ID')}
            </div>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-bold text-slate-500">Filter Siswa:</label>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="Semua">Semua Siswa</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nama} ({s.kelas_id})
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari transaksi siswa..."
            className="w-full py-2 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Siswa</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4">Jenis & Keterangan</th>
                <th className="py-3 px-4">Nominal</th>
                <th className="py-3 px-4">Petugas Kasir</th>
                <th className="py-3 px-4 text-right">Kuitansi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransaksi.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Belum ada riwayat transaksi {activeTab === 'spp' ? 'SPP' : 'Tabungan'}.
                  </td>
                </tr>
              ) : (
                filteredTransaksi.map((trx) => {
                  const student = studentMap.get(trx.siswa_id);
                  const isMasuk = trx.tipe === 'Masuk';

                  return (
                    <tr key={trx.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-600">{trx.tanggal}</td>

                      <td className="py-3 px-4 font-bold text-slate-900">
                        {student?.nama || 'Siswa'}
                      </td>

                      <td className="py-3 px-4 text-slate-600">{student?.kelas_id || '-'}</td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              isMasuk ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {trx.tipe}
                          </span>
                          <span>{trx.keterangan}</span>
                        </div>
                        {trx.bulan_spp && (
                          <div className="text-[10px] text-blue-600 font-medium">
                            Periode: {trx.bulan_spp}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 font-black text-slate-900">
                        <span className={isMasuk ? 'text-emerald-600' : 'text-amber-600'}>
                          {isMasuk ? '+' : '-'} Rp {trx.nominal.toLocaleString('id-ID')}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-600 text-[11px]">{trx.petugas}</td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setReceiptData(trx)}
                          title="Cetak Kuitansi"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <h3 className="font-bold text-base">
                Catat Transaksi {modalJenis} ({modalTipe})
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pilih Siswa *
                </label>
                <select
                  required
                  value={targetStudentId}
                  onChange={(e) => setTargetStudentId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 font-bold"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama} ({s.kelas_id}) - Saldo: Rp {s.saldo_tabungan.toLocaleString('id-ID')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nominal Transaksi (Rp) *
                </label>
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  required
                  value={nominal}
                  onChange={(e) => setNominal(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              {modalJenis === 'SPP' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bulan Pembayaran
                  </label>
                  <select
                    value={bulanSpp}
                    onChange={(e) => {
                      setBulanSpp(e.target.value);
                      setKeterangan(`Pembayaran Iuran Komite / SPP ${e.target.value}`);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                  >
                    <option value="Juli 2026">Juli 2026</option>
                    <option value="Agustus 2026">Agustus 2026</option>
                    <option value="September 2026">September 2026</option>
                    <option value="Oktober 2026">Oktober 2026</option>
                    <option value="November 2026">November 2026</option>
                    <option value="Desember 2026">Desember 2026</option>
                    <option value="Januari 2027">Januari 2027</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Keterangan / Uraian
                </label>
                <input
                  type="text"
                  required
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Petugas Kasir / Bendahara
                </label>
                <input
                  type="text"
                  value={petugas}
                  onChange={(e) => setPetugas(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm"
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {receiptData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="text-center border-b border-dashed border-slate-300 pb-3">
              <h4 className="font-black text-sm text-slate-900">
                UPTD SD NEGERI 3 SUKRA WETAN
              </h4>
              <p className="text-[10px] text-slate-500">
                BUKTI PEMBAYARAN & MUTASI KEUANGAN SAH
              </p>
            </div>

            <div className="text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">No. Transaksi:</span>
                <span className="font-mono font-bold text-slate-700">{receiptData.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tanggal:</span>
                <span className="font-semibold text-slate-700">{receiptData.tanggal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Nama Siswa:</span>
                <span className="font-bold text-slate-900">
                  {studentMap.get(receiptData.siswa_id)?.nama}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Kelas:</span>
                <span className="font-semibold text-slate-700">
                  {studentMap.get(receiptData.siswa_id)?.kelas_id}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Jenis:</span>
                <span className="font-bold text-slate-800">
                  {receiptData.jenis} ({receiptData.tipe})
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-2 text-sm font-black">
                <span>Total:</span>
                <span className="text-blue-600">
                  Rp {receiptData.nominal.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 pt-1">
                Keterangan: {receiptData.keterangan}
              </div>
            </div>

            <div className="pt-3 border-t border-dashed border-slate-300 flex justify-between items-center text-[10px] text-slate-400">
              <span>Kasir: {receiptData.petugas}</span>
              <span>Terima Kasih</span>
            </div>

            <button
              onClick={() => setReceiptData(null)}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold"
            >
              Tutup Kuitansi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
