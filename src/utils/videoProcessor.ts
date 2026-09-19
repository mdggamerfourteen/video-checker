import { KeyframeData, VideoMetadata } from '../types';
import {
  formatDuration,
  formatFileSize,
  getAspectDetails,
  calculateEstimatedBitrate,
  secondsToSMPTE,
} from './timecode';

/**
 * Inspects a video file (handles files up to 20GB+ via zero-copy object URLs)
 */
export async function inspectVideoFile(
  file: File,
  onProgress?: (msg: string, pct: number) => void
): Promise<{
  metadata: VideoMetadata;
  keyframes: KeyframeData[];
}> {
  onProgress?.('Mounting file stream...', 10);
  const objectUrl = URL.createObjectURL(file);

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = objectUrl;
    video.muted = true;
    video.playsInline = true;

    // Timeout safety
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('Video inspection timed out. Please check file format.'));
    }, 45000);

    const cleanup = () => {
      clearTimeout(timer);
      video.remove();
    };

    video.onloadedmetadata = async () => {
      try {
        onProgress?.('Extracting container metadata...', 30);
        const width = video.videoWidth || 1920;
        const height = video.videoHeight || 1080;
        const duration = video.duration || 60;
        const aspect = getAspectDetails(width, height);

        // Estimate standard fps (24, 25, 30, 60)
        const fps = 30; // standard default timeline fps

        const metadata: VideoMetadata = {
          file,
          fileName: file.name,
          fileSizeBytes: file.size,
          fileSizeFormatted: formatFileSize(file.size),
          durationSeconds: duration,
          durationFormatted: formatDuration(duration),
          width,
          height,
          aspectRatio: aspect.ratioStr,
          aspectRatioNumeric: aspect.numeric,
          fps,
          mimeType: file.type || 'video/mp4',
          objectUrl,
          estimatedBitrateMbps: calculateEstimatedBitrate(file.size, duration),
        };

        onProgress?.('Sampling keyframes for DaVinci analysis...', 50);
        const keyframes = await extractSampleKeyframes(video, duration, onProgress);

        cleanup();
        onProgress?.('Analysis ready', 100);
        resolve({ metadata, keyframes });
      } catch (err) {
        cleanup();
        reject(err);
      }
    };

    video.onerror = () => {
      cleanup();
      reject(
        new Error(
          'Failed to load video. Ensure the file is a valid video format (MP4, MOV, WebM, MKV).'
        )
      );
    };
  });
}

/**
 * Extracts representative keyframes from strategic video timestamps
 */
async function extractSampleKeyframes(
  video: HTMLVideoElement,
  duration: number,
  onProgress?: (msg: string, pct: number) => void
): Promise<KeyframeData[]> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return [];

  // Thumbnail dimensions
  const thumbWidth = 480;
  const aspect = video.videoWidth / (video.videoHeight || 1);
  const thumbHeight = Math.round(thumbWidth / aspect) || 270;
  canvas.width = thumbWidth;
  canvas.height = thumbHeight;

  // Strategic sampling points
  const points = [
    { pct: 0.01, label: 'Intro Hook (0-2s)' },
    { pct: 0.18, label: 'Early Pacing (18%)' },
    { pct: 0.45, label: 'Mid-Point Content (45%)' },
    { pct: 0.75, label: 'Climax / Build-up (75%)' },
    { pct: 0.95, label: 'Outro & CTA (95%)' },
  ];

  const keyframes: KeyframeData[] = [];

  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    const targetTime = Math.min(Math.max(duration * pt.pct, 0.2), Math.max(duration - 0.2, 0.2));

    onProgress?.(
      `Capturing frame ${i + 1}/${points.length} at ${formatDuration(targetTime)}...`,
      50 + Math.round(((i + 1) / points.length) * 45)
    );

    try {
      await seekVideo(video, targetTime);
      ctx.drawImage(video, 0, 0, thumbWidth, thumbHeight);

      // Measure brightness
      let brightness = 128;
      try {
        const imgData = ctx.getImageData(0, 0, thumbWidth, thumbHeight);
        let colorSum = 0;
        const step = 8; // sample every 8th pixel
        const totalSampled = (imgData.data.length / 4) / step;
        for (let x = 0; x < imgData.data.length; x += 4 * step) {
          const r = imgData.data[x];
          const g = imgData.data[x + 1];
          const b = imgData.data[x + 2];
          colorSum += (r * 0.299 + g * 0.587 + b * 0.114);
        }
        brightness = Math.round(colorSum / totalSampled);
      } catch {
        // cross-origin or canvas read fallback
      }

      const dataUrl = canvas.toDataURL('image/jpeg', 0.68);
      keyframes.push({
        id: `kf-${i}`,
        timestamp: targetTime,
        timecode: secondsToSMPTE(targetTime, 30),
        dataUrl,
        brightness,
        label: pt.label,
      });
    } catch {
      // Continue next frame
    }
  }

  return keyframes;
}

function seekVideo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve) => {
    const onSeeked = () => {
      video.removeEventListener('seeked', onSeeked);
      // Brief RAF to ensure frame paint
      requestAnimationFrame(() => resolve());
    };
    video.addEventListener('seeked', onSeeked);
    video.currentTime = time;
  });
}

/**
 * Creates a synthetic demo video using HTML Canvas and MediaRecorder
 * for instant testing when the user doesn't have a 20GB file handy.
 */
export async function createDemoVideoBlob(
  isVertical: boolean = false
): Promise<File> {
  const width = isVertical ? 1080 : 1920;
  const height = isVertical ? 1920 : 1080;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const stream = canvas.captureStream(30);

  // Audio tone generator
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const osc = audioCtx.createOscillator();
  const dst = audioCtx.createMediaStreamDestination();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(440, audioCtx.currentTime);
  osc.connect(dst);
  osc.start();

  stream.addTrack(dst.stream.getAudioTracks()[0]);

  let mimeType = 'video/webm;codecs=vp9,opus';
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm';
  }

  const recorder = new MediaRecorder(stream, { mimeType });
  const chunks: Blob[] = [];

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  return new Promise((resolve) => {
    recorder.onstop = () => {
      osc.stop();
      audioCtx.close();
      const blob = new Blob(chunks, { type: mimeType });
      const fileName = isVertical
        ? 'Sample_TikTok_Reels_9x16_Demo.mp4'
        : 'Sample_Cinema_4K_16x9_Demo.mp4';
      const file = new File([blob], fileName, { type: 'video/mp4' });
      resolve(file);
    };

    recorder.start();

    // Render animated frames for 3.5 seconds
    let frame = 0;
    const totalFrames = 105; // 3.5s at 30fps

    const draw = () => {
      frame++;
      const progress = frame / totalFrames;

      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, width, height);
      if (isVertical) {
        grad.addColorStop(0, '#0f172a');
        grad.addColorStop(0.5, '#1e1b4b');
        grad.addColorStop(1, '#311042');
      } else {
        grad.addColorStop(0, '#090a0f');
        grad.addColorStop(0.5, '#111827');
        grad.addColorStop(1, '#0f172a');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Safe zone guide lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 4;
      ctx.strokeRect(width * 0.1, height * 0.1, width * 0.8, height * 0.8);

      // Moving graphic circle
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      const cx = width / 2 + Math.sin(progress * Math.PI * 4) * (width * 0.25);
      const cy = height / 2 + Math.cos(progress * Math.PI * 4) * (height * 0.2);
      ctx.arc(cx, cy, 60, 0, Math.PI * 2);
      ctx.fill();

      // Text information
      ctx.fillStyle = '#f8fafc';
      ctx.font = `bold ${Math.round(width * 0.045)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(
        isVertical ? '9:16 VERTICAL CONTENT TEST' : '16:9 CINEMA MASTER TEST',
        width / 2,
        height * 0.35
      );

      ctx.fillStyle = '#94a3b8';
      ctx.font = `${Math.round(width * 0.025)}px monospace`;
      ctx.fillText(
        `TIMECODE: 01:00:0${Math.floor(progress * 3)}:${String(frame % 30).padStart(2, '0')}`,
        width / 2,
        height * 0.45
      );

      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`RESOLUTION: ${width} x ${height} | 30.00 FPS`, width / 2, height * 0.52);

      // Progress bar
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(width * 0.15, height * 0.65, width * 0.7, 16);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(width * 0.15, height * 0.65, width * 0.7 * progress, 16);

      if (frame < totalFrames) {
        requestAnimationFrame(draw);
      } else {
        recorder.stop();
      }
    };

    draw();
  });
}
