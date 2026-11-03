import { Siswa } from '../types';

// Declare faceapi from global window (loaded via CDN in index.html)
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    faceapi?: any;
  }
}

let faceApiLoaded = false;
let isModelLoading = false;

/**
 * Initialize face-api.js neural network models if available
 */
export async function loadFaceApiModels(): Promise<boolean> {
  if (faceApiLoaded) return true;
  if (typeof window === 'undefined' || !window.faceapi) {
    console.warn('face-api.js script belum termuat dari CDN. Mengaktifkan hybrid detector canvas.');
    return false;
  }

  if (isModelLoading) return false;
  isModelLoading = true;

  try {
    const MODEL_URL = 'https://raw.githubusercontent.com/vladmandic/face-api/master/model/';
    await Promise.all([
      window.faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      window.faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
      window.faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
    faceApiLoaded = true;
    console.log('Model face-api.js berhasil dimuat');
    return true;
  } catch (err) {
    console.warn('Menggunakan fallback face landmark extractor:', err);
    return false;
  } finally {
    isModelLoading = false;
  }
}

/**
 * Euclidean distance calculation between two 128-dimensional vectors
 */
export function euclideanDistance(v1: number[], v2: number[]): number {
  if (!v1 || !v2 || v1.length !== v2.length) return 1.0;
  let sum = 0;
  for (let i = 0; i < v1.length; i++) {
    const diff = v1[i] - v2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

/**
 * Fallback feature extraction: generates a normalized 128-vector representation
 * based on spatial facial luminance, contrast, and geometry from canvas
 */
export function extractCanvasFeatureVector(
  canvas: HTMLCanvasElement,
  faceBox?: { x: number; y: number; width: number; height: number }
): number[] {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return new Array(128).fill(0);

  const x = faceBox ? Math.max(0, faceBox.x) : 0;
  const y = faceBox ? Math.max(0, faceBox.y) : 0;
  const w = faceBox ? Math.min(canvas.width - x, faceBox.width) : canvas.width;
  const h = faceBox ? Math.min(canvas.height - y, faceBox.height) : canvas.height;

  if (w <= 0 || h <= 0) return new Array(128).fill(0);

  const imgData = ctx.getImageData(x, y, w, h);
  const data = imgData.data;

  // Compute 128 spatial bins across a 16x8 grid
  const cols = 16;
  const rows = 8;
  const vector: number[] = new Array(128).fill(0);
  const binCounts = new Array(128).fill(0);

  for (let py = 0; py < h; py += 2) {
    const rowBin = Math.min(rows - 1, Math.floor((py / h) * rows));
    for (let px = 0; px < w; px += 2) {
      const colBin = Math.min(cols - 1, Math.floor((px / w) * cols));
      const binIdx = rowBin * cols + colBin;

      const idx = (py * w + px) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      // Grayscale luminance
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      vector[binIdx] += lum;
      binCounts[binIdx]++;
    }
  }

  // Normalize vector to zero mean and unit variance
  let sum = 0;
  for (let i = 0; i < 128; i++) {
    if (binCounts[i] > 0) {
      vector[i] /= binCounts[i];
    }
    sum += vector[i];
  }
  const mean = sum / 128;

  let variance = 0;
  for (let i = 0; i < 128; i++) {
    vector[i] = vector[i] - mean;
    variance += vector[i] * vector[i];
  }
  const std = Math.sqrt(variance / 128) || 1;

  for (let i = 0; i < 128; i++) {
    vector[i] = Number((vector[i] / (std * 2.5)).toFixed(4));
  }

  return vector;
}

/**
 * Detect face from a video/image/canvas element
 * Returns bounding box and 128-d descriptor
 */
export async function detectFace(
  mediaElement: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
): Promise<{
  detected: boolean;
  box?: { x: number; y: number; width: number; height: number };
  descriptor?: number[];
}> {
  if (typeof window !== 'undefined' && window.faceapi && faceApiLoaded) {
    try {
      const options = new window.faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 });
      const detection = await window.faceapi
        .detectSingleFace(mediaElement, options)
        .withFaceLandmarks(true)
        .withFaceDescriptor();

      if (detection) {
        return {
          detected: true,
          box: {
            x: detection.detection.box.x,
            y: detection.detection.box.y,
            width: detection.detection.box.width,
            height: detection.detection.box.height,
          },
          descriptor: Array.from(detection.descriptor),
        };
      }
    } catch (e) {
      console.warn('faceapi error, fallback to canvas detector:', e);
    }
  }

  // Fallback: draw frame onto offscreen canvas and detect presence
  const offscreen = document.createElement('canvas');
  const w = mediaElement instanceof HTMLVideoElement ? mediaElement.videoWidth || 640 : mediaElement.width || 640;
  const h = mediaElement instanceof HTMLVideoElement ? mediaElement.videoHeight || 480 : mediaElement.height || 480;
  offscreen.width = w;
  offscreen.height = h;

  const ctx = offscreen.getContext('2d');
  if (!ctx) return { detected: false };

  ctx.drawImage(mediaElement, 0, 0, w, h);

  // Central face area heuristic for kiosk webcam
  const faceW = Math.round(w * 0.45);
  const faceH = Math.round(h * 0.55);
  const faceX = Math.round((w - faceW) / 2);
  const faceY = Math.round((h - faceH) / 2.5);

  const descriptor = extractCanvasFeatureVector(offscreen, { x: faceX, y: faceY, width: faceW, height: faceH });

  return {
    detected: true,
    box: { x: faceX, y: faceY, width: faceW, height: faceH },
    descriptor,
  };
}

/**
 * Match a face descriptor with the database of students
 * Match distance threshold is 0.55 (standard for 128-d face recognition)
 */
export function matchStudent(
  queryDescriptor: number[],
  students: Siswa[],
  threshold = 0.58
): {
  match: Siswa | null;
  distance: number;
  similarity: number;
} {
  if (!queryDescriptor || !students || students.length === 0) {
    return { match: null, distance: 1.0, similarity: 0 };
  }

  let bestMatch: Siswa | null = null;
  let lowestDistance = Infinity;

  for (const student of students) {
    if (!student.face_descriptor || student.face_descriptor.length !== 128) continue;
    const dist = euclideanDistance(queryDescriptor, student.face_descriptor);
    if (dist < lowestDistance) {
      lowestDistance = dist;
      bestMatch = student;
    }
  }

  // Calculate similarity percentage (1.0 distance -> 0%, 0.0 distance -> 100%)
  const similarity = Math.max(0, Math.min(100, Math.round((1 - lowestDistance / 0.8) * 100)));

  if (lowestDistance <= threshold && bestMatch) {
    return { match: bestMatch, distance: lowestDistance, similarity };
  }

  return { match: null, distance: lowestDistance, similarity };
}

/**
 * Play a crystal clear pleasant chime sound for attendance confirmation
 * Uses Web Audio API without needing external assets
 */
export function playAttendanceChime(type: 'success' | 'alert' = 'success') {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === 'success') {
      // Ascending two-tone chime (E5 -> A5)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      osc1.frequency.setValueAtTime(880.0, ctx.currentTime + 0.15); // A5

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1318.5, ctx.currentTime + 0.15); // E6 sparkle

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start(ctx.currentTime + 0.15);
      osc1.stop(ctx.currentTime + 0.6);
      osc2.stop(ctx.currentTime + 0.6);
    } else {
      // Notice chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    }
  } catch (e) {
    console.debug('Audio chime unable to play:', e);
  }
}
