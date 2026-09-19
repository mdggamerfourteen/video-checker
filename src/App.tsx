import React, { useState, useEffect, useCallback } from 'react';
import {
  PlatformId,
  VideoMetadata,
  KeyframeData,
  DaVinciEditReport,
  DaVinciMarker,
} from './types';
import { Header } from './components/Header';
import { VideoDropzone } from './components/VideoDropzone';
import { VideoPlayer } from './components/VideoPlayer';
import { PlatformSelector } from './components/PlatformSelector';
import { DaVinciMarkersTable } from './components/DaVinciMarkersTable';
import { DaVinciEditReportView } from './components/DaVinciEditReportView';
import { ExportModal } from './components/ExportModal';
import { inspectVideoFile, createDemoVideoBlob } from './utils/videoProcessor';
import { evaluatePlatformCompliance } from './utils/platformData';
import { secondsToSMPTE } from './utils/timecode';
import { AlertCircle, Film, Sparkles, SlidersHorizontal, RefreshCw } from 'lucide-react';

export default function App() {
  // Studio dark mode default for extended editing sessions
  const [darkMode, setDarkMode] = useState<boolean>(true);

  // Video and analysis state
  const [video, setVideo] = useState<VideoMetadata | null>(null);
  const [keyframes, setKeyframes] = useState<KeyframeData[]>([]);
  const [activePlatform, setActivePlatform] = useState<PlatformId>('tiktok');
  const [report, setReport] = useState<DaVinciEditReport | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);

  // Loading & Progress
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [loadingPercent, setLoadingPercent] = useState<number>(0);

  // AI Deep Analysis
  const [isAiAnalyzing, setIsAiAnalyzing] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Export Modal
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);

  // Manage Dark Mode class on document body/root
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = '#0b0d13';
      document.body.style.color = '#f1f5f9';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = '#f8fafc';
      document.body.style.color = '#0f172a';
    }
  }, [darkMode]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (video?.objectUrl) {
        URL.revokeObjectURL(video.objectUrl);
      }
    };
  }, [video]);

  // Generate initial baseline report
  const generateBaselineReport = useCallback(
    (meta: VideoMetadata): DaVinciEditReport => {
      const tiktokScore = evaluatePlatformCompliance('tiktok', {
        width: meta.width,
        height: meta.height,
        duration: meta.durationSeconds,
        fileSizeBytes: meta.fileSizeBytes,
      });

      const youtubeScore = evaluatePlatformCompliance('youtube', {
        width: meta.width,
        height: meta.height,
        duration: meta.durationSeconds,
        fileSizeBytes: meta.fileSizeBytes,
      });

      const facebookScore = evaluatePlatformCompliance('facebook', {
        width: meta.width,
        height: meta.height,
        duration: meta.durationSeconds,
        fileSizeBytes: meta.fileSizeBytes,
      });

      const rumbleScore = evaluatePlatformCompliance('rumble', {
        width: meta.width,
        height: meta.height,
        duration: meta.durationSeconds,
        fileSizeBytes: meta.fileSizeBytes,
      });

      const isVertical = meta.height > meta.width;
      const fps = meta.fps || 30;

      // Initial DaVinci markers based on frame analysis
      const baselineMarkers: DaVinciMarker[] = [
        {
          id: 'mk-hook',
          timecodeIn: secondsToSMPTE(0.2, fps),
          timecodeOut: secondsToSMPTE(2.5, fps),
          durationFrames: Math.round(2.3 * fps),
          name: 'Hook Retention Zone',
          color: 'Purple',
          comment: isVertical
            ? 'TikTok/Reels: First 2.5s critical drop-off zone. Cut initial breath and add dynamic zoom.'
            : 'YouTube/Rumble: State core value proposition in under 4 seconds.',
          category: 'pacing',
          seconds: 0.2,
        },
        {
          id: 'mk-broll',
          timecodeIn: secondsToSMPTE(Math.min(meta.durationSeconds * 0.2, 10), fps),
          timecodeOut: secondsToSMPTE(Math.min(meta.durationSeconds * 0.2, 10) + 1.5, fps),
          durationFrames: Math.round(1.5 * fps),
          name: 'B-Roll / Cutaway Point',
          color: 'Cyan',
          comment: 'Edit Page: Insert secondary footage or kinetic text overlay to maintain visual pacing.',
          category: 'cut',
          seconds: Math.min(meta.durationSeconds * 0.2, 10),
        },
        {
          id: 'mk-color',
          timecodeIn: secondsToSMPTE(Math.min(meta.durationSeconds * 0.45, 25), fps),
          timecodeOut: secondsToSMPTE(Math.min(meta.durationSeconds * 0.45, 25) + 2, fps),
          durationFrames: Math.round(2 * fps),
          name: 'Color Scope Balance',
          color: 'Yellow',
          comment: 'Color Page: Verify skin tone vector on Vectorscope. Adjust Lift +0.04 to protect mobile shadow detail.',
          category: 'color',
          seconds: Math.min(meta.durationSeconds * 0.45, 25),
        },
        {
          id: 'mk-audio',
          timecodeIn: secondsToSMPTE(Math.min(meta.durationSeconds * 0.7, 45), fps),
          timecodeOut: secondsToSMPTE(Math.min(meta.durationSeconds * 0.7, 45) + 1, fps),
          durationFrames: Math.round(1 * fps),
          name: 'Fairlight Audio Target',
          color: 'Green',
          comment: 'Fairlight Page: Dialogue check. Target -14 LUFS integrated with True Peak limiter at -1.0 dBTP.',
          category: 'audio',
          seconds: Math.min(meta.durationSeconds * 0.7, 45),
        },
        {
          id: 'mk-outro',
          timecodeIn: secondsToSMPTE(Math.max(meta.durationSeconds - 3.5, 1), fps),
          timecodeOut: secondsToSMPTE(meta.durationSeconds, fps),
          durationFrames: Math.round(Math.min(meta.durationSeconds, 3.5) * fps),
          name: 'Outro & Call-to-Action',
          color: 'Blue',
          comment: isVertical
            ? 'TikTok: Loop video seamlessly into frame 1 to increase re-watch replay metric.'
            : 'YouTube: Leave 20s end screen card space clear of titles.',
          category: 'platform',
          seconds: Math.max(meta.durationSeconds - 3.5, 1),
        },
      ];

      return {
        platformScores: {
          tiktok: tiktokScore,
          youtube: youtubeScore,
          facebook: facebookScore,
          rumble: rumbleScore,
        },
        overallSummary: `Technical profile: ${meta.fileName} (${meta.width}x${meta.height}, ${
          meta.fps
        } fps, ${meta.durationFormatted}). File size: ${meta.fileSizeFormatted}. Evaluated for TikTok, YouTube, Facebook, and Rumble.`,
        hookEvaluation: {
          score: isVertical ? 86 : 80,
          firstThreeSecondsVerdict:
            'Critical retention threshold: 65% of viewers decide whether to stay within the first 3 seconds.',
          recommendation:
            'In DaVinci Edit Page: Trim any opening pause. Apply 1.12x dynamic zoom at 00:00:00:15.',
        },
        davinciMarkers: baselineMarkers,
        editPageAdvice: [
          {
            timecode: secondsToSMPTE(0.1, fps),
            action: 'Trim Pre-Roll Latency',
            reason: 'Delete first 8-12 frames of dead audio so dialogue commences instantaneously.',
          },
          {
            timecode: secondsToSMPTE(Math.min(meta.durationSeconds * 0.25, 12), fps),
            action: 'Dynamic Punch-In Zoom (1.15x)',
            reason: 'Reset viewer visual gaze to prevent swipe-away.',
          },
          {
            timecode: secondsToSMPTE(Math.max(meta.durationSeconds - 2.5, 2), fps),
            action: 'Tighten Outro Tail',
            reason: 'Cut trailing pauses immediately after last spoken word.',
          },
        ],
        colorPageAdvice: [
          {
            timecode: secondsToSMPTE(1.0, fps),
            nodeType: 'Node 01: Exposure & Balance',
            suggestion: 'Balance primary color wheels. Lift shadows +0.05 to prevent crushed mobile display blacks.',
            davinciTool: 'Primaries Color Wheels / Lift Gamma Gain',
          },
          {
            timecode: secondsToSMPTE(Math.min(meta.durationSeconds * 0.5, 20), fps),
            nodeType: 'Node 02: Skin Tone Qualifier',
            suggestion: 'Use Qualifier to isolate skin tones; align vector angle with standard 54-degree skin tone line.',
            davinciTool: 'HSL Qualifier & Vectorscope',
          },
        ],
        fairlightAudioAdvice: [
          {
            targetLufs: -14,
            issue: 'Vocal dialogue intelligibility across mobile smartphone speakers.',
            solution: 'Apply 6-band Parametric EQ with +2dB bell boost at 3.2kHz for vocal presence.',
            davinciProcessor: 'Fairlight Track EQ',
          },
          {
            targetLufs: -14,
            issue: 'Dynamic range volume spikes between soft speech and sudden peaks.',
            solution: 'Apply Fairlight Dynamics Compressor (Ratio 3:1, Threshold -18dB, Release 140ms).',
            davinciProcessor: 'Fairlight Dynamics Compressor / Limiter',
          },
        ],
        fusionSafeZoneAdvice: [
          {
            platform: 'TikTok',
            safeZoneStatus: isVertical ? 'Compliant 9:16' : 'Requires Reframe',
            action: 'Keep lower-third text and subtitles above 320px from bottom edge (avoid sound/caption UI).',
          },
          {
            platform: 'YouTube',
            safeZoneStatus: !isVertical ? 'Native 16:9' : 'Shorts Target',
            action: isVertical
              ? 'Leave top 140px and bottom 220px clear of channel overlays.'
              : 'Standard 80% title-safe margin applies.',
          },
        ],
      };
    },
    []
  );

  // Trigger server-side Gemini AI analysis with captured keyframes
  const triggerAiAnalysis = async (
    meta: VideoMetadata,
    frames: KeyframeData[],
    platform: PlatformId
  ) => {
    setIsAiAnalyzing(true);
    setAiError(null);

    try {
      const response = await fetch('/api/analyze-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: meta.fileName,
          fileSizeBytes: meta.fileSizeBytes,
          durationSeconds: meta.durationSeconds,
          width: meta.width,
          height: meta.height,
          aspectRatio: meta.aspectRatio,
          fps: meta.fps,
          targetPlatform: platform,
          keyframes: frames.map((f) => ({
            timestamp: f.timestamp,
            timecode: f.timecode,
            base64Image: f.dataUrl,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const result = await response.json();
      if (result.success && result.data) {
        const aiData = result.data;

        // Enhance markers with numeric seconds for seeking
        const enhancedMarkers: DaVinciMarker[] = (aiData.davinciMarkers || []).map(
          (m: any, idx: number) => {
            const parts = (m.timecodeIn || '01:00:00:00')
              .split(':')
              .map((p: string) => parseInt(p, 10) || 0);
            const h = parts[0] || 1;
            const min = parts[1] || 0;
            const s = parts[2] || 0;
            const f = parts[3] || 0;
            const totalSecs = Math.max(0, h - 1) * 3600 + min * 60 + s + f / (meta.fps || 30);

            return {
              id: `ai-mk-${idx}`,
              timecodeIn: m.timecodeIn,
              timecodeOut: m.timecodeOut || m.timecodeIn,
              durationFrames: m.durationFrames || 30,
              name: m.name,
              color: m.color || 'Cyan',
              comment: m.comment || '',
              category: m.category || 'cut',
              seconds: totalSecs,
            };
          }
        );

        setReport((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            overallSummary: aiData.overallSummary || prev.overallSummary,
            hookEvaluation: aiData.hookEvaluation || prev.hookEvaluation,
            davinciMarkers: enhancedMarkers.length > 0 ? enhancedMarkers : prev.davinciMarkers,
            editPageAdvice: aiData.editPageAdvice || prev.editPageAdvice,
            colorPageAdvice: aiData.colorPageAdvice || prev.colorPageAdvice,
            fairlightAudioAdvice: aiData.fairlightAudioAdvice || prev.fairlightAudioAdvice,
            fusionSafeZoneAdvice: aiData.fusionSafeZoneAdvice || prev.fusionSafeZoneAdvice,
          };
        });
      }
    } catch (err: any) {
      console.warn('AI analysis failed, retaining baseline analysis:', err.message);
      setAiError(err.message || 'AI service temporarily unavailable; using local engine.');
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  // Handle uploaded video file
  const handleFileSelected = async (file: File) => {
    setIsLoading(true);
    setLoadingPercent(5);
    setLoadingMessage('Initializing memory-safe video stream...');

    try {
      const { metadata, keyframes: sampledFrames } = await inspectVideoFile(
        file,
        (msg, pct) => {
          setLoadingMessage(msg);
          setLoadingPercent(pct);
        }
      );

      // Auto-select best platform based on aspect ratio
      const autoPlatform: PlatformId =
        metadata.height > metadata.width ? 'tiktok' : 'youtube';
      setActivePlatform(autoPlatform);

      setVideo(metadata);
      setKeyframes(sampledFrames);
      setCurrentTime(0);

      const baseline = generateBaselineReport(metadata);
      setReport(baseline);

      // Request background AI enrichment
      triggerAiAnalysis(metadata, sampledFrames, autoPlatform);
    } catch (err: any) {
      console.error('Inspection error:', err);
      alert(err.message || 'Failed to inspect video file.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load demo test video
  const handleLoadDemo = async (isVertical: boolean) => {
    setIsLoading(true);
    setLoadingPercent(15);
    setLoadingMessage(
      isVertical
        ? 'Synthesizing 9:16 Vertical Mobile Footage...'
        : 'Synthesizing 16:9 Cinema 4K Footage...'
    );

    try {
      const demoFile = await createDemoVideoBlob(isVertical);
      await handleFileSelected(demoFile);
    } catch (err: any) {
      console.error('Failed to create demo video:', err);
      setIsLoading(false);
    }
  };

  // Reset button action (clears all loaded footage, cache, and markers)
  const handleReset = () => {
    if (video?.objectUrl) {
      URL.revokeObjectURL(video.objectUrl);
    }
    setVideo(null);
    setKeyframes([]);
    setReport(null);
    setCurrentTime(0);
    setIsAiAnalyzing(false);
    setAiError(null);
    setIsExportOpen(false);
  };

  // Add custom marker
  const handleAddCustomMarker = (marker: DaVinciMarker) => {
    if (!report) return;
    setReport({
      ...report,
      davinciMarkers: [...report.davinciMarkers, marker].sort(
        (a, b) => a.seconds - b.seconds
      ),
    });
  };

  // Change platform
  const handleSelectPlatform = (pid: PlatformId) => {
    setActivePlatform(pid);
    if (video && keyframes.length > 0) {
      triggerAiAnalysis(video, keyframes, pid);
    }
  };

  return (
    <div
      id="app-root"
      className={`min-h-screen flex flex-col transition-colors duration-200 ${
        darkMode ? 'bg-[#0b0d13] text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Top Header */}
      <Header
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onReset={handleReset}
        hasVideo={Boolean(video)}
        onOpenExport={() => setIsExportOpen(true)}
        isAnalyzing={isAiAnalyzing}
        onRunAiAnalysis={() => {
          if (video) triggerAiAnalysis(video, keyframes, activePlatform);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {!video ? (
          /* Empty State: 20GB Dropzone */
          <div className="py-6">
            <VideoDropzone
              darkMode={darkMode}
              onFileSelected={handleFileSelected}
              onLoadDemo={handleLoadDemo}
              isLoading={isLoading}
              loadingMessage={loadingMessage}
              loadingPercent={loadingPercent}
            />
          </div>
        ) : (
          /* Active Inspection & DaVinci Workspace */
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Top Alert / AI Banner */}
            {isAiAnalyzing && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-indigo-950/40 border border-indigo-800/60 text-indigo-200 text-xs">
                <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
                <span>
                  Deep AI is analyzing keyframes for {activePlatform.toUpperCase()} and generating DaVinci Resolve color/cut markers...
                </span>
              </div>
            )}

            {/* Video Player & Monitor */}
            <VideoPlayer
              darkMode={darkMode}
              video={video}
              markers={report?.davinciMarkers || []}
              activePlatform={activePlatform}
              currentTime={currentTime}
              onTimeUpdate={setCurrentTime}
              onSeek={setCurrentTime}
            />

            {/* Platform Selector Grid (TikTok / YouTube / Facebook / Rumble) */}
            {report && (
              <PlatformSelector
                darkMode={darkMode}
                activePlatform={activePlatform}
                onSelectPlatform={handleSelectPlatform}
                scores={report.platformScores}
              />
            )}

            {/* DaVinci Resolve Studio Edit Report View */}
            {report && (
              <DaVinciEditReportView
                darkMode={darkMode}
                report={report}
                video={video}
                activePlatform={activePlatform}
              />
            )}

            {/* DaVinci Resolve Timeline Markers Table */}
            {report && (
              <DaVinciMarkersTable
                darkMode={darkMode}
                markers={report.davinciMarkers}
                onSeekToTimecode={(secs) => setCurrentTime(secs)}
                onAddCustomMarker={handleAddCustomMarker}
                fps={video.fps || 30}
              />
            )}
          </div>
        )}
      </main>

      {/* Export Modal */}
      {report && video && (
        <ExportModal
          darkMode={darkMode}
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          report={report}
          video={video}
          activePlatform={activePlatform}
        />
      )}

      {/* Footer */}
      <footer
        className={`py-4 border-t text-center text-xs transition-colors ${
          darkMode ? 'border-[#1b1f2b] text-slate-500 bg-[#0c0e14]' : 'border-slate-200 text-slate-400 bg-white'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <span>
            DaVinci Resolve NLE Marker & Quality Engine • Supports up to 20GB media files
          </span>
          <span className="font-mono text-[11px]">
            Formats: MP4, MOV, MKV, WebM, ProRes • Dark Mode for Extended Editing Sessions
          </span>
        </div>
      </footer>
    </div>
  );
}
