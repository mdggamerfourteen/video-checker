export type PlatformId = 'tiktok' | 'youtube' | 'facebook' | 'rumble';

export type DaVinciMarkerColor =
  | 'Blue'
  | 'Cyan'
  | 'Green'
  | 'Yellow'
  | 'Red'
  | 'Pink'
  | 'Purple'
  | 'Fuchsia'
  | 'Mint';

export interface DaVinciMarker {
  id: string;
  timecodeIn: string;
  timecodeOut: string;
  durationFrames: number;
  name: string;
  color: DaVinciMarkerColor;
  comment: string;
  category: 'cut' | 'color' | 'audio' | 'fusion' | 'pacing' | 'platform';
  seconds: number;
}

export interface KeyframeData {
  id: string;
  timestamp: number;
  timecode: string;
  dataUrl: string;
  brightness: number;
  label: string;
}

export interface VideoMetadata {
  file: File | null;
  fileName: string;
  fileSizeBytes: number;
  fileSizeFormatted: string;
  durationSeconds: number;
  durationFormatted: string;
  width: number;
  height: number;
  aspectRatio: string;
  aspectRatioNumeric: number;
  fps: number;
  mimeType: string;
  objectUrl: string;
  estimatedBitrateMbps: string;
}

export interface PlatformAuditResult {
  score: number;
  status: 'pass' | 'warning' | 'fail';
  aspectRatioStatus: 'optimal' | 'acceptable' | 'suboptimal';
  durationStatus: 'optimal' | 'acceptable' | 'too_long' | 'too_short';
  audioLufsTarget: number;
  safeZoneCompliance: string;
  feedback: string;
  actionItems: string[];
}

export interface EditPageAdvice {
  timecode: string;
  action: string;
  reason: string;
}

export interface ColorPageAdvice {
  timecode: string;
  nodeType: string;
  suggestion: string;
  davinciTool: string;
}

export interface FairlightAudioAdvice {
  targetLufs: number;
  issue: string;
  solution: string;
  davinciProcessor: string;
}

export interface FusionSafeZoneAdvice {
  platform: string;
  safeZoneStatus: string;
  action: string;
}

export interface DaVinciEditReport {
  platformScores: Record<PlatformId, PlatformAuditResult>;
  overallSummary: string;
  hookEvaluation: {
    score: number;
    firstThreeSecondsVerdict: string;
    recommendation: string;
  };
  davinciMarkers: DaVinciMarker[];
  editPageAdvice: EditPageAdvice[];
  colorPageAdvice: ColorPageAdvice[];
  fairlightAudioAdvice: FairlightAudioAdvice[];
  fusionSafeZoneAdvice: FusionSafeZoneAdvice[];
}

export interface PlatformConfig {
  id: PlatformId;
  name: string;
  tagline: string;
  primaryRatio: string;
  maxRecommendedDuration: number;
  audioTargetLufs: number;
  recommendedResolution: string;
  colorScheme: {
    bg: string;
    text: string;
    border: string;
    accent: string;
  };
}
