import { useState, useRef, useEffect, useCallback } from 'react';
import { Siswa, Absensi, SekolahProfil } from '../types';
import { store } from '../services/store';
import { detectFace, matchStudent, playAttendanceChime, loadFaceApiModels } from '../services/faceMatcher';
import { scanAndNotifyUncheckedStudents } from '../services/whatsapp';
import confetti from 'canvas-confetti';
import {
  Camera,
  CheckCircle2,
  Clock,
  Maximize2,
  Minimize2,
  Lock,
  UserCheck,
  AlertTriangle,
  Send,
  Search,
  Sparkles,
  CameraOff,
} from 'lucide-react';

interface KioskModeProps {
  onExitKiosk: () => void;
}

export function KioskMode({ onExitKiosk }: KioskModeProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Time state
  const [currentTime, setCurrentTime] = useState(new Date());

  // Store data
  const [profil, setProfil] = useState<SekolahProfil>(store.getProfil());
  const [students, setStudents] = useState<Siswa[]>(store.getSiswa());
  const [todayAbsensi, setTodayAbsensi] = useState<Absensi[]>(
    store.getAbsensi(new Date().toISOString().split('T')[0])
  );

  // Recognition state
  const [lastDetectedStudent, setLastDetectedStudent] = useState<Siswa | null>(null);
  const [lastAbsensiRecord, setLastAbsensiRecord] = useState<Absensi | null>(null);
  const [matchStatus, setMatchStatus] = useState<string | null>(null);
  const [recentNotification, setRecentNotification] = useState<string | null>(null);

  // Manual fallback search
  const [manualQuery, setManualQuery] = useState('');
  const [showManualModal, setShowManualModal] = useState(false);

  // WA alert sending state
  const [isSendingWa, setIsSendingWa] = useState(false);
  const [waResultMsg, setWaResultMsg] = useState<string | null>(null);

  // Cooldown tracker to prevent rapid duplicate triggers
  const recentAttendRef = useRef<Map<string, number>>(new Map());

  // Refresh data on store updates
  useEffect(() => {
    const unsub = store.subscribe(() => {
      setProfil(store.getProfil());
      setStudents(store.getSiswa());
      setTodayAbsensi(store.getAbsensi(new Date().toISOString().split('T')[0]));
    });
    return unsub;
  }, []);

  // Clock ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Init face-api models and camera
  useEffect(() => {
    loadFaceApiModels();
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
      });
      setStream(media);
      if (videoRef.current) {
        videoRef.current.srcObject = media;
      }
      setCameraActive(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Kamera tidak dapat diakses';
      setCameraError(`Kamera tidak aktif: ${msg}. Anda dapat menggunakan mode presensi manual di bawah.`);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  const handleSuccessfulMatch = useCallback(
    (student: Siswa, similarity: number) => {
      const now = Date.now();
      const lastTime = recentAttendRef.current.get(student.id) || 0;
      if (now - lastTime < 10000) {
        // Cooldown within 10 seconds
        return;
      }
      recentAttendRef.current.set(student.id, now);

      // Record attendance
      const recordResult = store.recordAbsensi(student.id, 'Hadir', 'Wajah');

      setLastDetectedStudent(student);
      setLastAbsensiRecord(recordResult.absensi || null);
      setMatchStatus(
        recordResult.success
          ? `Presensi Berhasil (${similarity}% kecocokan biometrik)`
          : recordResult.message
      );

      if (recordResult.success) {
        playAttendanceChime('success');
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      } else {
        playAttendanceChime('alert');
      }

      // Hide match popup after 5 seconds
      setTimeout(() => {
        setLastDetectedStudent((current) => (current?.id === student.id ? null : current));
      }, 5000);
    },
    []
  );

  // Periodic Face Detection Loop
  useEffect(() => {
    if (!cameraActive) return;

    let isMounted = true;
    const interval = setInterval(async () => {
      if (!videoRef.current || !cameraActive || isScanning) return;
      if (videoRef.current.readyState < 2) return;

      try {
        setIsScanning(true);
        const detection = await detectFace(videoRef.current);

        if (isMounted && detection.detected && detection.descriptor) {
          const matchResult = matchStudent(detection.descriptor, students, 0.58);
          if (matchResult.match) {
            handleSuccessfulMatch(matchResult.match, matchResult.similarity);
          }
        }
      } catch (e) {
        console.debug('Frame scan tick error:', e);
      } finally {
        if (isMounted) setIsScanning(false);
      }
    }, 850);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [cameraActive, students, isScanning, handleSuccessfulMatch]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Manual Attendance Record
  const handleManualAbsen = (siswa: Siswa) => {
    const res = store.recordAbsensi(siswa.id, 'Hadir', 'Manual', 'Presensi Manual Kiosk');
    setRecentNotification(
      res.success
        ? `Presensi ${siswa.nama} berhasil dicatat!`
        : `Info: ${res.message}`
    );
    playAttendanceChime(res.success ? 'success' : 'alert');
    setShowManualModal(false);
    setManualQuery('');
    setTimeout(() => setRecentNotification(null), 4000);
  };

  // Trigger Late WA Alerts
  const handleTriggerWaAlerts = async () => {
    setIsSendingWa(true);
    setWaResultMsg('Memeriksa siswa yang belum absensi dan menghubungkan ke WhatsApp Gateway...');
    try {
      const results = await scanAndNotifyUncheckedStudents();
      setWaResultMsg(
        `Berhasil memproses notifikasi WA untuk ${results.length} siswa yang belum hadir hari ini.`
      );
    } catch {
      setWaResultMsg('Gagal mengirimkan notifikasi WhatsApp.');
    } finally {
      setIsSendingWa(false);
      setTimeout(() => setWaResultMsg(null), 6000);
    }
  };

  // Quick Stats
  const hadirCount = todayAbsensi.filter((a) => a.status === 'Hadir').length;
  const terlambatCount = todayAbsensi.filter((a) => a.status === 'Terlambat').length;
  const sakitIzinCount = todayAbsensi.filter((a) => a.status === 'Sakit' || a.status === 'Izin').length;

  return (
    <div className="relative min-h-screen bg-slate-950 text-white flex flex-col justify-between overflow-hidden select-none">
      {/* Top Header Bar */}
      <header className="relative z-20 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 md:px-8 py-3.5 flex items-center justify-between shadow-lg">
        {/* School Branding */}
        <div className="flex items-center gap-3.5">
          <img
            src={profil.logo_url}
            alt="Logo Sekolah"
            className="w-12 h-12 object-contain drop-shadow-md rounded-lg bg-white/5 p-1"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded-full border border-emerald-500/30">
                Mode Kiosk Aktif
              </span>
              <span className="text-xs text-slate-400">NPSN: {profil.npsn}</span>
            </div>
            <h1 className="text-base md:text-lg font-black tracking-tight text-white leading-tight">
              {profil.nama_sekolah}
            </h1>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Anjungan Presensi Biometrik Wajah Otomatis Siswa
            </p>
          </div>
        </div>

        {/* Live Clock & Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Digital Clock */}
          <div className="hidden lg:flex items-center gap-3 bg-slate-800/80 border border-slate-700/60 px-4 py-2 rounded-2xl shadow-inner">
            <Clock className="w-5 h-5 text-indigo-400 animate-pulse" />
            <div className="text-right">
              <div className="text-xl font-mono font-bold text-white tracking-wider leading-none">
                {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} <span className="text-xs text-indigo-400">WIB</span>
              </div>
              <div className="text-[10px] text-slate-400 capitalize">
                {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            title="Layar Penuh"
            className="p-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>

          {/* Discreet Exit Button */}
          <button
            onClick={onExitKiosk}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-600/90 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow-md transition-all border border-indigo-500/50"
          >
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Keluar Kiosk / Login Admin</span>
          </button>
        </div>
      </header>

      {/* Main Kiosk Content Area */}
      <main className="relative flex-1 flex flex-col lg:flex-row items-center justify-center p-4 md:p-6 gap-6 z-10 max-w-7xl mx-auto w-full">
        {/* Left Side: Live Webcam View with Biometric Overlay */}
        <div className="relative w-full max-w-2xl aspect-4/3 md:aspect-16/10 bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border-2 border-indigo-500/30 flex items-center justify-center">
          {cameraActive ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover -scale-x-100"
              />

              {/* Glowing High-Tech Scanning HUD Overlay */}
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                {/* Center target square / oval */}
                <div className="relative w-64 h-80 md:w-72 md:h-92 border-2 border-dashed border-indigo-400/70 rounded-3xl flex items-center justify-center shadow-[0_0_35px_rgba(99,102,241,0.25)]">
                  {/* Scanning beam animation */}
                  <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#22d3ee] animate-bounce" />

                  {/* Corner markers */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-cyan-400 rounded-tl-lg" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-cyan-400 rounded-tr-lg" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-cyan-400 rounded-bl-lg" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-cyan-400 rounded-br-lg" />
                </div>

                {/* Instruction Banner */}
                <div className="mt-4 px-4 py-1.5 bg-slate-950/80 backdrop-blur-md border border-slate-700/80 text-white rounded-full text-xs font-medium flex items-center gap-2 shadow-lg">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                  <span>Arahkan Wajah Anda Tepat ke Dalam Bingkai</span>
                </div>
              </div>

              {/* Active Scanner Indicator Badge */}
              <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 bg-slate-900/90 backdrop-blur-md rounded-full border border-emerald-500/40 text-emerald-400 text-xs font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span>AI Face Scanner Aktif</span>
              </div>
            </>
          ) : (
            <div className="p-8 text-center max-w-md space-y-4">
              <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                <CameraOff className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">Kamera Belum Terhubung</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {cameraError || 'Mohon izinkan akses kamera pada peramban Anda untuk mengaktifkan pemindai wajah otomatis.'}
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={startCamera}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium flex items-center gap-2 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  <span>Coba Akses Kamera</span>
                </button>
                <button
                  onClick={() => setShowManualModal(true)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium flex items-center gap-2 transition-colors"
                >
                  <Search className="w-4 h-4" />
                  <span>Presensi Manual NISN</span>
                </button>
              </div>
            </div>
          )}

          {/* Student Recognition Success Popup Card */}
          {lastDetectedStudent && (
            <div className="absolute inset-x-4 bottom-4 z-30 bg-gradient-to-r from-emerald-950/95 to-slate-900/95 backdrop-blur-xl border border-emerald-500/50 p-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom duration-300">
              <div className="relative">
                <img
                  src={
                    lastDetectedStudent.foto_url ||
                    'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&h=150&fit=crop'
                  }
                  alt={lastDetectedStudent.nama}
                  className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover border-2 border-emerald-400 shadow-md"
                />
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full shadow">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-emerald-500 text-emerald-950 font-bold text-[10px] uppercase rounded-full">
                    {lastAbsensiRecord?.status || 'HADIR'}
                  </span>
                  <span className="text-xs text-emerald-300 font-mono">
                    Pukul {lastAbsensiRecord?.waktu_masuk || '07:15:00'} WIB
                  </span>
                </div>
                <h3 className="text-base md:text-lg font-bold text-white truncate">
                  {lastDetectedStudent.nama}
                </h3>
                <p className="text-xs text-slate-300">
                  NISN: {lastDetectedStudent.nisn} | {lastDetectedStudent.kelas_id}
                </p>
                <p className="text-[11px] text-emerald-400 font-medium mt-1">
                  {matchStatus}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Live Statistics & Kiosk Controls */}
        <div className="w-full lg:w-96 flex flex-col gap-4">
          {/* Attendance Stats Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Hadir Tepat Waktu</span>
                <span className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
                  <UserCheck className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl md:text-3xl font-black text-white mt-2">
                {hadirCount} <span className="text-xs text-slate-400 font-normal">Siswa</span>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Terlambat</span>
                <span className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg">
                  <Clock className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl md:text-3xl font-black text-amber-400 mt-2">
                {terlambatCount} <span className="text-xs text-slate-400 font-normal">Siswa</span>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Izin / Sakit</span>
                <span className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl md:text-3xl font-black text-blue-400 mt-2">
                {sakitIzinCount} <span className="text-xs text-slate-400 font-normal">Siswa</span>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Total Terdaftar</span>
                <span className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
                  <Sparkles className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl md:text-3xl font-black text-slate-200 mt-2">
                {students.length} <span className="text-xs text-slate-400 font-normal">Siswa</span>
              </div>
            </div>
          </div>

          {/* Quick Action: Presensi Manual (Cari Siswa) */}
          <button
            onClick={() => setShowManualModal(true)}
            className="w-full py-3 px-4 bg-slate-800/90 hover:bg-slate-700/90 text-white rounded-2xl font-semibold text-xs flex items-center justify-between border border-slate-700 transition-colors shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <Search className="w-4 h-4 text-cyan-400" />
              <span>Presensi Manual / Cari Berdasarkan NISN</span>
            </div>
            <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
              Alternatif
            </span>
          </button>

          {/* WhatsApp Overdue Notification Trigger */}
          <div className="bg-gradient-to-br from-indigo-950/60 to-slate-900/80 border border-indigo-500/30 p-4 rounded-2xl space-y-3">
            <div className="flex items-start gap-2.5">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">
                  Kirim Notifikasi WA Keterlambatan
                </h4>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Picu pengiriman WhatsApp otomatis ke nomor orang tua bagi siswa yang belum hadir melewati batas jam {profil.jam_masuk}.
                </p>
              </div>
            </div>

            <button
              onClick={handleTriggerWaAlerts}
              disabled={isSendingWa}
              className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSendingWa ? 'Memproses Pengiriman...' : 'Kirim Alert WA ke Wali Murid'}</span>
            </button>

            {waResultMsg && (
              <p className="text-[11px] text-emerald-300 bg-emerald-950/60 p-2 rounded-lg border border-emerald-800">
                {waResultMsg}
              </p>
            )}
          </div>

          {/* Today's Recent Check-ins List */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex-1 flex flex-col min-h-48 max-h-60 overflow-hidden">
            <h4 className="text-xs font-bold text-slate-300 mb-2 flex items-center justify-between">
              <span>Kehadiran Terkini Hari Ini</span>
              <span className="text-[10px] text-slate-400">{todayAbsensi.length} presensi</span>
            </h4>
            <div className="overflow-y-auto space-y-2 pr-1">
              {todayAbsensi.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">
                  Belum ada presensi tercatat hari ini
                </div>
              ) : (
                todayAbsensi.slice(0, 5).map((absen) => {
                  const student = students.find((s) => s.id === absen.siswa_id);
                  return (
                    <div
                      key={absen.id}
                      className="flex items-center justify-between p-2 bg-slate-800/60 rounded-xl border border-slate-700/50 text-xs"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="w-7 h-7 rounded-lg bg-indigo-600/30 text-indigo-300 font-bold flex items-center justify-center text-[10px] shrink-0">
                          {student?.nama.charAt(0) || 'S'}
                        </div>
                        <div className="truncate">
                          <p className="font-semibold text-slate-200 truncate">
                            {student?.nama || 'Siswa'}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {student?.kelas_id} • {absen.metode}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                            absen.status === 'Hadir'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : absen.status === 'Terlambat'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}
                        >
                          {absen.status}
                        </span>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {absen.waktu_masuk}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Notification Toast */}
      {recentNotification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-emerald-600 text-white text-xs font-semibold rounded-full shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{recentNotification}</span>
        </div>
      )}

      {/* Manual Attendance Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 text-white space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Search className="w-4 h-4 text-cyan-400" />
                <span>Presensi Manual Kiosk</span>
              </h3>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Tutup
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                value={manualQuery}
                onChange={(e) => setManualQuery(e.target.value)}
                placeholder="Ketik NISN atau Nama Siswa..."
                className="w-full py-2.5 pl-9 pr-4 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                autoFocus
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2">
              {students
                .filter(
                  (s) =>
                    s.nama.toLowerCase().includes(manualQuery.toLowerCase()) ||
                    s.nisn.includes(manualQuery)
                )
                .map((student) => {
                  const already = todayAbsensi.some((a) => a.siswa_id === student.id);
                  return (
                    <div
                      key={student.id}
                      className="p-3 bg-slate-800/80 hover:bg-slate-700/80 rounded-xl flex items-center justify-between gap-3 border border-slate-700 transition-colors"
                    >
                      <div>
                        <p className="font-bold text-xs text-white">{student.nama}</p>
                        <p className="text-[10px] text-slate-400">
                          NISN: {student.nisn} • {student.kelas_id}
                        </p>
                      </div>

                      {already ? (
                        <span className="text-[10px] px-2 py-0.5 bg-slate-700 text-slate-300 rounded-full">
                          Sudah Absen
                        </span>
                      ) : (
                        <button
                          onClick={() => handleManualAbsen(student)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors"
                        >
                          Absen Hadir
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Footer info */}
      <footer className="relative z-10 py-2.5 px-4 text-center text-[11px] text-slate-500 bg-slate-900/80 border-t border-slate-800">
        UPTD SD Negeri 3 Sukra Wetan • Sistem Informasi Akademik & Presensi Cerdas Terpadu
      </footer>
    </div>
  );
}
