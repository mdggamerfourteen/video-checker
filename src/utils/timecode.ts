/**
 * SMPTE Timecode and formatting utilities for DaVinci Resolve compatibility
 */

export function secondsToSMPTE(
  seconds: number,
  fps: number = 30,
  startHour: number = 1
): string {
  const safeSeconds = Math.max(0, isNaN(seconds) ? 0 : seconds);
  const totalFrames = Math.round(safeSeconds * fps);
  const f = totalFrames % fps;
  const totalSecs = Math.floor(safeSeconds);
  const s = totalSecs % 60;
  const m = Math.floor(totalSecs / 60) % 60;
  const h = startHour + Math.floor(totalSecs / 3600);

  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(
    s
  ).padStart(2, '0')}:${String(f).padStart(2, '0')}`;
}

export function smpteToSeconds(
  smpte: string,
  fps: number = 30,
  startHour: number = 1
): number {
  if (!smpte) return 0;
  const parts = smpte.split(':').map((p) => parseInt(p, 10) || 0);
  if (parts.length !== 4) return 0;
  const [h, m, s, f] = parts;
  const relativeHours = Math.max(0, h - startHour);
  return relativeHours * 3600 + m * 60 + s + f / fps;
}

export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);

  if (mins >= 60) {
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hours}:${String(remMins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (!bytes || isNaN(bytes)) return 'Unknown';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
  return `${value} ${sizes[i]}`;
}

export function calculateEstimatedBitrate(
  bytes: number,
  durationSeconds: number
): string {
  if (!bytes || !durationSeconds || durationSeconds <= 0) return 'N/A';
  // (bytes * 8) / seconds / 1,000,000 = Mbps
  const mbps = (bytes * 8) / durationSeconds / 1_000_000;
  return `${mbps.toFixed(1)} Mbps`;
}

export function getAspectDetails(width: number, height: number): {
  ratioStr: string;
  isVertical: boolean;
  isSquare: boolean;
  isLandscape: boolean;
  numeric: number;
} {
  if (!width || !height) {
    return {
      ratioStr: '16:9',
      isVertical: false,
      isSquare: false,
      isLandscape: true,
      numeric: 1.777,
    };
  }

  const numeric = width / height;
  let ratioStr = `${width}:${height}`;

  if (Math.abs(numeric - 16 / 9) < 0.05) ratioStr = '16:9 (Landscape)';
  else if (Math.abs(numeric - 9 / 16) < 0.05) ratioStr = '9:16 (Vertical)';
  else if (Math.abs(numeric - 1) < 0.05) ratioStr = '1:1 (Square)';
  else if (Math.abs(numeric - 4 / 5) < 0.05) ratioStr = '4:5 (Social Portrait)';
  else if (Math.abs(numeric - 21 / 9) < 0.08) ratioStr = '21:9 (Ultrawide)';
  else if (Math.abs(numeric - 4 / 3) < 0.05) ratioStr = '4:3 (Classic)';

  return {
    ratioStr,
    isVertical: height > width,
    isSquare: Math.abs(width - height) < 10,
    isLandscape: width > height,
    numeric,
  };
}
