import { useState, useRef, useEffect } from 'react';
import { Siswa } from '../types';
import { detectFace } from '../services/faceMatcher';
import { store } from '../services/store';
import { Camera, Check, X, RefreshCw, Sparkles, AlertCircle } from 'lucide-react';

interface FaceRegisterModalProps {
  siswa: Siswa;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedSiswa: Siswa) => void;
}

export function FaceRegisterModal({ siswa, isOpen, onClose, onSuccess }: FaceRegisterModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [extractedVector, setExtractedVector] = useState<number[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setError(null);
    setCapturedPhoto(null);
    setExtractedVector(null);
    setSuccess(false);

    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      });
      setStream(media);
      if (videoRef.current) {
        videoRef.current.srcObject = media;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Kamera tidak dapat diakses';
      setError(`Gagal mengakses kamera: ${msg}. Pastikan izin kamera telah diberikan.`);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleCapture = async () => {
    if (!videoRef.current) return;
    setIsCapturing(true);
    setError(null);

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Gagal inisialisasi canvas');

      // Mirror horizontally for natural preview
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const photoDataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedPhoto(photoDataUrl);

      // Detect face and extract 128-d descriptor
      const detection = await detectFace(canvas);
      if (detection.detected && detection.descriptor) {
        setExtractedVector(detection.descriptor);
      } else {
        setError('Wajah tidak terdeteksi dengan jelas. Pastikan posisi wajah tegak dan pencahayaan cukup.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memproses gambar';
      setError(msg);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleSave = () => {
    if (!extractedVector || !capturedPhoto) return;

    const updated: Siswa = {
      ...siswa,
      foto_url: capturedPhoto,
      face_descriptor: extractedVector,
      face_registered: true,
    };

    store.addOrUpdateSiswa(updated);
    setSuccess(true);
    setTimeout(() => {
      onSuccess(updated);
      onClose();
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Pendaftaran Biometrik Wajah</h3>
              <p className="text-xs text-blue-100">
                {siswa.nama} ({siswa.kelas_id})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center gap-2 font-medium">
              <Check className="w-4 h-4 shrink-0" />
              <span>Data biometrik 128 vektor wajah berhasil didaftarkan ke sistem!</span>
            </div>
          )}

          {/* Camera / Photo preview */}
          <div className="relative aspect-4/3 bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center border-2 border-dashed border-slate-200">
            {!capturedPhoto ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover -scale-x-100"
                />
                {/* Visual Oval Framing guide */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-64 border-2 border-emerald-400/80 rounded-[50%] shadow-[0_0_20px_rgba(52,211,153,0.3)] animate-pulse" />
                </div>
                <div className="absolute bottom-3 left-0 right-0 text-center pointer-events-none">
                  <span className="px-3 py-1 bg-black/60 text-white text-xs rounded-full backdrop-blur-sm">
                    Posisikan wajah di dalam lingkaran oval
                  </span>
                </div>
              </>
            ) : (
              <div className="relative w-full h-full">
                <img
                  src={capturedPhoto}
                  alt="Captured face"
                  className="w-full h-full object-cover"
                />
                {extractedVector && (
                  <div className="absolute top-3 right-3 bg-emerald-600 text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>128 Vektor Wajah Terdeteksi</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <p className="text-xs text-slate-500 text-center">
            Pencocokan biometrik menggunakan ekstraksi representasi neural 128 dimensi yang aman dan tersimpan secara lokal.
          </p>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-between">
          {!capturedPhoto ? (
            <button
              onClick={handleCapture}
              disabled={isCapturing}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Camera className="w-4 h-4" />
              <span>{isCapturing ? 'Mendeteksi Wajah...' : 'Ambil Foto & Ekstrak Wajah'}</span>
            </button>
          ) : (
            <div className="flex items-center justify-between w-full gap-3">
              <button
                onClick={() => {
                  setCapturedPhoto(null);
                  setExtractedVector(null);
                  setError(null);
                }}
                className="py-2 px-3 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Ulangi Foto</span>
              </button>
              <button
                onClick={handleSave}
                disabled={!extractedVector || success}
                className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Simpan Biometrik Siswa</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
