import React, { useRef, useState } from 'react';
import {
  Upload,
  Film,
  HardDrive,
  Sparkles,
  AlertCircle,
  PlaySquare,
  Smartphone,
  Layers,
  Cpu,
} from 'lucide-react';

interface VideoDropzoneProps {
  darkMode: boolean;
  onFileSelected: (file: File) => void;
  onLoadDemo: (isVertical: boolean) => void;
  isLoading: boolean;
  loadingMessage: string;
  loadingPercent: number;
}

export const VideoDropzone: React.FC<VideoDropzoneProps> = ({
  darkMode,
  onFileSelected,
  onLoadDemo,
  isLoading,
  loadingMessage,
  loadingPercent,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/') || /\.(mp4|mov|mkv|webm|avi|m4v)$/i.test(file.name)) {
        onFileSelected(file);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelected(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4">
      {/* 20GB Support Feature Card */}
      <div
        id="file-dropzone-container"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-xl border-2 border-dashed p-8 md:p-12 text-center transition-all ${
          isDragOver
            ? 'border-sky-500 bg-sky-500/10 scale-[1.01]'
            : darkMode
            ? 'border-[#2c3242] bg-[#141720]/80 hover:border-[#3d455b]'
            : 'border-slate-300 bg-slate-50/70 hover:border-slate-400'
        } ${isLoading ? 'pointer-events-none opacity-80' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*,.mp4,.mov,.mkv,.webm,.avi,.m4v"
          onChange={handleFileInputChange}
          className="hidden"
          id="video-file-input"
        />

        {/* Loading Overlay */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-sky-500/20 border-t-sky-500 animate-spin" />
              <div className="absolute inset-2 rounded-full border-2 border-indigo-500/20 border-b-indigo-400 animate-spin" />
              <Film className="absolute inset-0 m-auto w-6 h-6 text-sky-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-100">
                {loadingMessage || 'Analyzing video frames...'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Zero-copy browser streaming • Memory safe for up to 20GB files
              </p>
            </div>
            {/* Progress bar */}
            <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-300"
                style={{ width: `${Math.max(5, loadingPercent)}%` }}
              />
            </div>
            <span className="text-xs font-mono text-sky-400">{loadingPercent}%</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Icon Header */}
            <div className="flex justify-center">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:scale-105 ${
                  darkMode
                    ? 'bg-gradient-to-br from-[#1e2333] to-[#161a26] border border-[#2d344b] text-sky-400 shadow-black/40'
                    : 'bg-white border border-slate-200 text-sky-600 shadow-slate-200'
                }`}
              >
                <Upload className="w-8 h-8" />
              </div>
            </div>

            {/* Headline & 20GB Callout */}
            <div>
              <h2 className={`text-xl md:text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Drop Your Video File Here (Up to 20GB)
              </h2>
              <p className="text-sm text-slate-400 max-w-lg mx-auto mt-2 leading-relaxed">
                Streamed directly from your local disk using zero-copy range playback.
                No file size bottlenecks, zero browser memory crashes, and immediate DaVinci Resolve marker generation.
              </p>
            </div>

            {/* Big Select Button */}
            <div>
              <button
                type="button"
                id="btn-select-file"
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 rounded-lg text-sm font-semibold bg-sky-500 hover:bg-sky-400 text-white shadow-md hover:shadow-sky-500/20 transition-all focus:outline-none focus:ring-2 focus:ring-sky-400 active:scale-98"
              >
                Select Video from Computer
              </button>
              <p className="text-xs text-slate-500 mt-2">
                Supports MP4, MOV (ProRes / H.264 / H.265), MKV, WebM, AVI • Up to 20 GB
              </p>
            </div>

            {/* Feature Pills */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                  darkMode
                    ? 'bg-[#181d28] border-[#293043] text-slate-300'
                    : 'bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                20GB File Capacity
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                  darkMode
                    ? 'bg-[#181d28] border-[#293043] text-slate-300'
                    : 'bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                DaVinci Resolve CSV & EDL
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                  darkMode
                    ? 'bg-[#181d28] border-[#293043] text-slate-300'
                    : 'bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <Cpu className="w-3.5 h-3.5 text-purple-400" />
                TikTok / YouTube / Facebook / Rumble
              </span>
            </div>

            {/* Quick Demo Loaders */}
            <div className={`pt-6 border-t ${darkMode ? 'border-[#232734]' : 'border-slate-200'}`}>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Or Test Immediately with Built-in Generator Clips:
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  id="btn-demo-16x9"
                  onClick={() => onLoadDemo(false)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium border transition-colors ${
                    darkMode
                      ? 'bg-[#1a1e2a] border-[#2c3345] text-slate-200 hover:bg-[#23293a] hover:border-sky-500/50'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <PlaySquare className="w-4 h-4 text-sky-400" />
                  <span>16:9 Landscape Cinema Master (YouTube / Rumble)</span>
                </button>
                <button
                  type="button"
                  id="btn-demo-9x16"
                  onClick={() => onLoadDemo(true)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium border transition-colors ${
                    darkMode
                      ? 'bg-[#1a1e2a] border-[#2c3345] text-slate-200 hover:bg-[#23293a] hover:border-purple-500/50'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-purple-400" />
                  <span>9:16 Vertical Mobile Reel (TikTok / Facebook Reels)</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Technical Spec note */}
      <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500 px-2">
        <span className="flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 text-sky-400" />
          <span>Local processing: your video footage never leaves your browser unless requesting AI deep audit.</span>
        </span>
        <span className="font-mono">SMPTE Timecode: 24/25/30/60 fps</span>
      </div>
    </div>
  );
};
