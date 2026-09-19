import React from 'react';
import {
  RotateCcw,
  Moon,
  Sun,
  HardDrive,
  Download,
  Film,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onReset: () => void;
  hasVideo: boolean;
  onOpenExport: () => void;
  isAnalyzing: boolean;
  onRunAiAnalysis?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  onToggleDarkMode,
  onReset,
  hasVideo,
  onOpenExport,
  isAnalyzing,
  onRunAiAnalysis,
}) => {
  return (
    <header
      id="app-header"
      className={`border-b sticky top-0 z-40 transition-colors duration-200 ${
        darkMode
          ? 'bg-[#12141a]/95 border-[#232734] text-slate-100 backdrop-blur-md'
          : 'bg-white/95 border-slate-200 text-slate-900 backdrop-blur-md'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
        {/* Logo & Brand */}
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold tracking-tight text-slate-100 flex items-center gap-2">
                <span className={darkMode ? 'text-white' : 'text-slate-900'}>
                  Video Checker & DaVinci Resolve Report
                </span>
              </h1>
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                  darkMode
                    ? 'bg-sky-950/60 border-sky-800/80 text-sky-300'
                    : 'bg-sky-50 border-sky-200 text-sky-700'
                }`}
              >
                DaVinci 18/19 Ready
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <HardDrive className="w-3 h-3 text-emerald-400" />
                <span>20GB+ Zero-Crash Stream</span>
              </span>
              <span>•</span>
              <span>TikTok / YouTube / Facebook / Rumble</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* AI Re-Analyze Button if video loaded */}
          {hasVideo && onRunAiAnalysis && (
            <button
              id="btn-run-ai-analysis"
              onClick={onRunAiAnalysis}
              disabled={isAnalyzing}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
                darkMode
                  ? 'bg-gradient-to-r from-indigo-950 to-purple-950/80 border-indigo-700/60 hover:border-indigo-500 text-indigo-200 shadow-sm'
                  : 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100 text-indigo-800'
              } ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Run AI Frame & Hook Analysis with Gemini"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{isAnalyzing ? 'Analyzing...' : 'Deep AI Audit'}</span>
            </button>
          )}

          {/* Export Report & Markers Button */}
          {hasVideo && (
            <button
              id="btn-export-report"
              onClick={onOpenExport}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export DaVinci Markers</span>
            </button>
          )}

          {/* Reset Button */}
          <button
            id="btn-reset-app"
            onClick={onReset}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
              darkMode
                ? 'bg-[#1a1d26] border-[#2b3040] hover:bg-[#232734] text-slate-300 hover:text-white'
                : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
            }`}
            title="Reset video and clear all analysis"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
            <span>Reset</span>
          </button>

          {/* Dark Mode Toggle */}
          <button
            id="btn-toggle-theme"
            onClick={onToggleDarkMode}
            className={`p-1.5 rounded-md border transition-colors ${
              darkMode
                ? 'bg-[#1a1d26] border-[#2b3040] text-amber-300 hover:bg-[#232734]'
                : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
            }`}
            title={darkMode ? 'Switch to Studio Light' : 'Switch to NLE Dark Studio'}
            aria-label="Toggle Dark Mode"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>
        </div>
      </div>
    </header>
  );
};
