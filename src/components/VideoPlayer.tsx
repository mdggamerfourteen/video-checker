import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Volume2,
  VolumeX,
  Eye,
  Sliders,
  Tv,
} from 'lucide-react';
import { VideoMetadata, DaVinciMarker, PlatformId } from '../types';
import { secondsToSMPTE, formatDuration } from '../utils/timecode';

interface VideoPlayerProps {
  darkMode: boolean;
  video: VideoMetadata;
  markers: DaVinciMarker[];
  activePlatform: PlatformId;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  onSeek: (time: number) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  darkMode,
  video,
  markers,
  activePlatform,
  currentTime,
  onTimeUpdate,
  onSeek,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [safeZoneMode, setSafeZoneMode] = useState<
    'auto' | 'tiktok' | 'youtube_shorts' | 'facebook' | 'broadcast' | 'none'
  >('auto');
  const [hoveredMarker, setHoveredMarker] = useState<DaVinciMarker | null>(null);

  // Sync external seek
  useEffect(() => {
    if (videoRef.current && Math.abs(videoRef.current.currentTime - currentTime) > 0.3) {
      videoRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    onTimeUpdate(videoRef.current.currentTime);
  };

  const handleScrubberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
    }
    onSeek(val);
  };

  const stepFrame = (forward: boolean) => {
    if (!videoRef.current) return;
    videoRef.current.pause();
    setIsPlaying(false);
    const frameDuration = 1 / (video.fps || 30);
    const newTime = Math.max(
      0,
      Math.min(
        video.durationSeconds,
        videoRef.current.currentTime + (forward ? frameDuration : -frameDuration)
      )
    );
    videoRef.current.currentTime = newTime;
    onSeek(newTime);
  };

  const jumpToMarker = (direction: 'prev' | 'next') => {
    if (!markers.length || !videoRef.current) return;
    const cur = videoRef.current.currentTime;
    const sorted = [...markers].sort((a, b) => a.seconds - b.seconds);

    if (direction === 'next') {
      const next = sorted.find((m) => m.seconds > cur + 0.2);
      if (next) {
        videoRef.current.currentTime = next.seconds;
        onSeek(next.seconds);
      }
    } else {
      const prev = [...sorted].reverse().find((m) => m.seconds < cur - 0.2);
      if (prev) {
        videoRef.current.currentTime = prev.seconds;
        onSeek(prev.seconds);
      }
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Determine active safe zone to display
  const effectiveSafeZone =
    safeZoneMode === 'auto'
      ? activePlatform === 'tiktok'
        ? 'tiktok'
        : activePlatform === 'youtube' && video.height > video.width
        ? 'youtube_shorts'
        : activePlatform === 'facebook' && video.height > video.width
        ? 'facebook'
        : 'broadcast'
      : safeZoneMode;

  const getMarkerBadgeColor = (color: string) => {
    switch (color.toLowerCase()) {
      case 'purple':
        return '#c084fc';
      case 'cyan':
        return '#22d3ee';
      case 'yellow':
        return '#facc15';
      case 'green':
        return '#4ade80';
      case 'red':
        return '#f87171';
      case 'blue':
        return '#60a5fa';
      case 'pink':
        return '#f472b6';
      default:
        return '#94a3b8';
    }
  };

  return (
    <div
      ref={containerRef}
      id="video-player-root"
      className={`rounded-xl border overflow-hidden transition-all shadow-xl ${
        darkMode ? 'bg-[#0f1117] border-[#222736]' : 'bg-slate-900 border-slate-700 text-white'
      }`}
    >
      {/* Top Monitor Bar */}
      <div className="px-4 py-2 bg-[#141722] border-b border-[#222736] flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-200 flex items-center gap-1.5">
            <Tv className="w-3.5 h-3.5 text-sky-400" />
            <span>DaVinci Timeline Monitor</span>
          </span>
          <span className="font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60 font-semibold tracking-wider">
            {secondsToSMPTE(currentTime, video.fps || 30)}
          </span>
          <span className="text-slate-400 font-mono">
            / {secondsToSMPTE(video.durationSeconds, video.fps || 30)}
          </span>
        </div>

        {/* Safe Zone Selector */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Eye className="w-3 h-3 text-amber-400" />
            <span>Safe Zones:</span>
          </span>
          <select
            id="select-safe-zone"
            value={safeZoneMode}
            onChange={(e) => setSafeZoneMode(e.target.value as any)}
            className="bg-[#1b202e] border border-[#2e364a] text-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-sky-500"
          >
            <option value="auto">Auto (Match Platform)</option>
            <option value="tiktok">TikTok 9:16 UI Safe Zone</option>
            <option value="youtube_shorts">YouTube Shorts 9:16 Guide</option>
            <option value="facebook">Facebook Reels Guide</option>
            <option value="broadcast">16:9 Title Safe (80/90%)</option>
            <option value="none">Off (Clean View)</option>
          </select>
        </div>
      </div>

      {/* Screen Canvas Area */}
      <div className="relative aspect-video max-h-[480px] bg-black flex items-center justify-center overflow-hidden select-none">
        <video
          ref={videoRef}
          src={video.objectUrl}
          playsInline
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
          onClick={togglePlay}
          className="max-h-full max-w-full object-contain cursor-pointer"
        />

        {/* Overlay: Safe Zone Guides */}
        {effectiveSafeZone === 'tiktok' && (
          <div className="absolute inset-0 pointer-events-none flex justify-center">
            <div className="relative aspect-[9/16] h-full border border-dashed border-red-400/40">
              {/* Right rail icons simulation */}
              <div className="absolute right-2 bottom-20 flex flex-col gap-3 items-center opacity-70">
                <div className="w-8 h-8 rounded-full bg-slate-800/80 border border-slate-600 flex items-center justify-center text-[9px] text-white">
                  Avt
                </div>
                <div className="w-7 h-7 rounded-full bg-rose-500/80 flex items-center justify-center text-[8px] text-white">
                  ♥
                </div>
                <div className="w-7 h-7 rounded-full bg-slate-800/80 flex items-center justify-center text-[8px] text-white">
                  💬
                </div>
                <div className="w-7 h-7 rounded-full bg-slate-800/80 flex items-center justify-center text-[8px] text-white">
                  🔖
                </div>
                <div className="w-7 h-7 rounded-full bg-slate-800/80 flex items-center justify-center text-[8px] text-white">
                  ↗
                </div>
              </div>
              {/* Bottom Caption Safe Zone */}
              <div className="absolute bottom-0 inset-x-0 h-24 bg-red-500/10 border-t border-dashed border-red-400/60 flex items-center justify-center text-[10px] text-red-300 font-medium">
                TikTok UI & Caption Zone (Avoid Critical Titles)
              </div>
              {/* Top safe zone */}
              <div className="absolute top-0 inset-x-0 h-10 border-b border-dashed border-yellow-400/40 flex items-center justify-center text-[9px] text-yellow-300">
                TikTok Following / For You Header
              </div>
            </div>
          </div>
        )}

        {effectiveSafeZone === 'youtube_shorts' && (
          <div className="absolute inset-0 pointer-events-none flex justify-center">
            <div className="relative aspect-[9/16] h-full border border-dashed border-red-500/40">
              <div className="absolute bottom-0 inset-x-0 h-28 bg-red-500/10 border-t border-dashed border-red-500/60 flex items-center justify-center text-[10px] text-red-300">
                Shorts Channel & Sound Banner Area
              </div>
              <div className="absolute right-2 bottom-32 flex flex-col gap-2 items-center opacity-70">
                <div className="w-6 h-6 rounded-full bg-slate-800/80 flex items-center justify-center text-[8px]">
                  👍
                </div>
                <div className="w-6 h-6 rounded-full bg-slate-800/80 flex items-center justify-center text-[8px]">
                  💬
                </div>
              </div>
            </div>
          </div>
        )}

        {effectiveSafeZone === 'broadcast' && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* 90% Action Safe */}
            <div className="w-[90%] h-[90%] border border-cyan-400/30 relative flex items-center justify-center">
              <span className="absolute top-1 left-1 text-[9px] text-cyan-400/80 font-mono">
                90% Action Safe
              </span>
              {/* 80% Title Safe */}
              <div className="w-[88.8%] h-[88.8%] border border-dashed border-yellow-400/40 relative">
                <span className="absolute top-1 left-1 text-[9px] text-yellow-400/80 font-mono">
                  80% Title Safe
                </span>
                {/* Center crosshair */}
                <div className="absolute inset-0 m-auto w-4 h-4">
                  <div className="absolute inset-x-0 top-1/2 h-[1px] bg-white/30" />
                  <div className="absolute inset-y-0 left-1/2 w-[1px] bg-white/30" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Big play button on pause */}
        {!isPlaying && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-sky-500/90 hover:bg-sky-400 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 z-20"
            aria-label="Play video"
          >
            <Play className="w-7 h-7 ml-0.5" />
          </button>
        )}
      </div>

      {/* Scrubber & Timeline Bar */}
      <div className="p-3 bg-[#131620] space-y-2">
        {/* Scrubber Track with Marker Pins */}
        <div className="relative group pt-2 pb-1">
          <input
            id="video-scrubber"
            type="range"
            min={0}
            max={video.durationSeconds || 100}
            step={0.01}
            value={currentTime}
            onChange={handleScrubberChange}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500 hover:h-2.5 transition-all"
          />

          {/* Render DaVinci Resolve Marker Pins along Scrubber */}
          {markers.map((m) => {
            const pct = Math.min(
              100,
              Math.max(0, (m.seconds / (video.durationSeconds || 1)) * 100)
            );
            const colorCode = getMarkerBadgeColor(m.color);

            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.currentTime = m.seconds;
                    onSeek(m.seconds);
                  }
                }}
                onMouseEnter={() => setHoveredMarker(m)}
                onMouseLeave={() => setHoveredMarker(null)}
                style={{ left: `${pct}%`, backgroundColor: colorCode }}
                className="absolute top-1 -translate-x-1/2 w-3 h-3 rounded-full border border-black shadow-md cursor-pointer transition-transform hover:scale-150 z-10"
                title={`${m.name} (${m.color}) at ${m.timecodeIn}`}
              />
            );
          })}

          {/* Tooltip for Hovered Marker */}
          {hoveredMarker && (
            <div
              style={{
                left: `${Math.min(
                  85,
                  Math.max(
                    15,
                    (hoveredMarker.seconds / (video.durationSeconds || 1)) * 100
                  )
                )}%`,
              }}
              className="absolute -top-10 -translate-x-1/2 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-[11px] text-slate-100 font-mono whitespace-nowrap shadow-lg pointer-events-none z-30"
            >
              <span className="font-semibold" style={{ color: getMarkerBadgeColor(hoveredMarker.color) }}>
                [{hoveredMarker.color}]
              </span>{' '}
              {hoveredMarker.name} • {hoveredMarker.timecodeIn}
            </div>
          )}
        </div>

        {/* Playback Controls & Frame Stepping */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Left: Transport buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => jumpToMarker('prev')}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
              title="Jump to Previous DaVinci Marker"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={() => stepFrame(false)}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white font-mono text-[11px]"
              title="Step -1 Frame"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={togglePlay}
              className="p-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white shadow-sm"
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
            <button
              onClick={() => stepFrame(true)}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white font-mono text-[11px]"
              title="Step +1 Frame"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => jumpToMarker('next')}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
              title="Jump to Next DaVinci Marker"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Volume */}
            <div className="flex items-center gap-1.5 ml-2">
              <button
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.muted = !isMuted;
                    setIsMuted(!isMuted);
                  }
                }}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-300"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setVolume(v);
                  if (videoRef.current) {
                    videoRef.current.volume = v;
                    videoRef.current.muted = v === 0;
                    setIsMuted(v === 0);
                  }
                }}
                className="w-16 h-1.5 bg-slate-800 rounded appearance-none accent-sky-500"
              />
            </div>
          </div>

          {/* Right: Technical Badges & Fullscreen */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {video.width} x {video.height} ({video.aspectRatio})
            </span>
            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {video.fps} FPS
            </span>
            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-sky-950/80 text-sky-300 border border-sky-800/60">
              {video.fileSizeFormatted}
            </span>
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
              title="Fullscreen Monitor"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
