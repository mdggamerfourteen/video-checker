import React, { useState } from 'react';
import { DaVinciEditReport, PlatformId, VideoMetadata } from '../types';
import {
  Scissors,
  Palette,
  Volume2,
  Layers,
  Sparkles,
  Zap,
  Target,
  FileSpreadsheet,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';

interface DaVinciEditReportViewProps {
  darkMode: boolean;
  report: DaVinciEditReport;
  video: VideoMetadata;
  activePlatform: PlatformId;
}

export const DaVinciEditReportView: React.FC<DaVinciEditReportViewProps> = ({
  darkMode,
  report,
  video,
  activePlatform,
}) => {
  const [activeTab, setActiveTab] = useState<'edit' | 'color' | 'audio' | 'fusion'>(
    'edit'
  );

  const tabs = [
    { id: 'edit', label: 'Edit Page', icon: Scissors, count: report.editPageAdvice?.length || 0 },
    { id: 'color', label: 'Color Page', icon: Palette, count: report.colorPageAdvice?.length || 0 },
    { id: 'audio', label: 'Fairlight Audio', icon: Volume2, count: report.fairlightAudioAdvice?.length || 0 },
    { id: 'fusion', label: 'Fusion & Safe Zones', icon: Layers, count: report.fusionSafeZoneAdvice?.length || 0 },
  ];

  const currentPlatformScore = report.platformScores[activePlatform];

  return (
    <div
      id="davinci-report-view"
      className={`rounded-xl border transition-all ${
        darkMode ? 'bg-[#12141c] border-[#222736]' : 'bg-white border-slate-200 shadow-sm'
      }`}
    >
      {/* Top Banner: Hook Evaluation & Platform Assessment */}
      <div className="p-5 border-b border-[#222736] bg-gradient-to-br from-[#161a26] to-[#12141c]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" />
                Target Strategy: {activePlatform.toUpperCase()}
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
                Score: {currentPlatformScore?.score || 80}/100
              </span>
            </div>
            <p className="text-sm font-medium text-slate-200 leading-relaxed">
              {currentPlatformScore?.feedback || report.overallSummary}
            </p>
          </div>

          {/* Hook 3-Second Scorecard */}
          <div className="bg-[#191e2b] border border-[#2c3346] rounded-xl p-3 text-right flex items-center gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400">
                First 3-Sec Hook
              </div>
              <div className="text-xl font-bold font-mono text-emerald-400">
                {report.hookEvaluation?.score || 85}/100
              </div>
            </div>
            <div className="h-9 w-[1px] bg-slate-700" />
            <div className="text-left text-xs max-w-[210px] text-slate-300">
              <span className="font-semibold text-white block">
                {report.hookEvaluation?.firstThreeSecondsVerdict}
              </span>
              <span className="text-[11px] text-slate-400">
                {report.hookEvaluation?.recommendation}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* DaVinci Page Tabs */}
      <div className="px-4 border-b border-[#222736] flex gap-2 overflow-x-auto bg-[#141722]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-3 px-3.5 border-b-2 font-medium text-xs whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-sky-500 text-sky-400 bg-sky-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-sky-500 text-black font-bold' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="p-5">
        {/* EDIT PAGE TAB */}
        {activeTab === 'edit' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-blue-400" />
                <span>DaVinci Edit Page Cut & Trim Recommendations</span>
              </h4>
              <span className="text-xs text-slate-500">
                Apply on V1/V2 video timeline
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {report.editPageAdvice?.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-lg bg-[#161a26] border border-[#242c3d] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/60 font-semibold">
                      {item.timecode}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      Edit #{idx + 1}
                    </span>
                  </div>
                  <h5 className="text-xs font-bold text-slate-100">{item.action}</h5>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {item.reason}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* COLOR PAGE TAB */}
        {activeTab === 'color' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-yellow-400" />
                <span>DaVinci Color Page Grading Guide</span>
              </h4>
              <span className="text-xs text-slate-500">
                Node tree corrections for mobile & display delivery
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.colorPageAdvice?.map((color, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg bg-[#161a26] border border-[#242c3d] space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-yellow-400 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" />
                      {color.nodeType}
                    </span>
                    <span className="font-mono text-xs text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                      {color.timecode}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {color.suggestion}
                  </p>
                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                    <span>DaVinci Tool:</span>
                    <span className="font-mono text-sky-300 font-medium">
                      {color.davinciTool}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FAIRLIGHT AUDIO TAB */}
        {activeTab === 'audio' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Fairlight Audio Page Loudness & Dynamics</span>
              </h4>
              <span className="text-xs text-slate-500">
                Broadcast & Streaming LUFS Compliance
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.fairlightAudioAdvice?.map((audio, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg bg-[#161a26] border border-[#242c3d] space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                      Target: {audio.targetLufs} LUFS Integrated
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      Audio Pass #{idx + 1}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">
                      Detected Issue:
                    </span>
                    <p className="text-xs text-slate-200 mt-0.5">{audio.issue}</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-emerald-400 block font-medium">
                      Fairlight Solution:
                    </span>
                    <p className="text-xs text-slate-300 mt-0.5">{audio.solution}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-800/60 text-[11px] text-slate-400 flex justify-between">
                    <span>Processor:</span>
                    <span className="font-mono text-emerald-300">
                      {audio.davinciProcessor}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FUSION & SAFE ZONES TAB */}
        {activeTab === 'fusion' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>Fusion Page Graphic & Safe Zone Coordinates</span>
              </h4>
              <span className="text-xs text-slate-500">
                Subtitle clearance & UI obstruction avoidance
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.fusionSafeZoneAdvice?.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg bg-[#161a26] border border-[#242c3d] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-300">
                      {item.platform}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/60">
                      {item.safeZoneStatus}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {item.action}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
