import React from 'react';
import { PlatformId, PlatformAuditResult } from '../types';
import { PLATFORMS } from '../utils/platformData';
import { CheckCircle2, AlertTriangle, XCircle, Sparkles } from 'lucide-react';

interface PlatformSelectorProps {
  darkMode: boolean;
  activePlatform: PlatformId;
  onSelectPlatform: (id: PlatformId) => void;
  scores: Record<PlatformId, PlatformAuditResult>;
}

export const PlatformSelector: React.FC<PlatformSelectorProps> = ({
  darkMode,
  activePlatform,
  onSelectPlatform,
  scores,
}) => {
  const platforms: PlatformId[] = ['tiktok', 'youtube', 'facebook', 'rumble'];

  const getStatusIcon = (status: 'pass' | 'warning' | 'fail') => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'fail':
        return <XCircle className="w-4 h-4 text-rose-400" />;
    }
  };

  const getScoreBadgeClass = (score: number) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/30 bg-emerald-950/40';
    if (score >= 60) return 'text-amber-400 border-amber-500/30 bg-amber-950/40';
    return 'text-rose-400 border-rose-500/30 bg-rose-950/40';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className={`text-sm font-semibold uppercase tracking-wider ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
          Platform Compliance & Target Selection
        </h3>
        <span className="text-xs text-slate-400">
          Click platform to adapt DaVinci Resolve recommendations
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {platforms.map((pid) => {
          const cfg = PLATFORMS[pid];
          const audit = scores[pid] || {
            score: 75,
            status: 'warning',
            aspectRatioStatus: 'acceptable',
            durationStatus: 'optimal',
            feedback: 'Standard compliance',
          };
          const isActive = activePlatform === pid;

          return (
            <button
              key={pid}
              type="button"
              id={`platform-card-${pid}`}
              onClick={() => onSelectPlatform(pid)}
              className={`text-left p-3.5 rounded-xl border transition-all relative overflow-hidden ${
                isActive
                  ? darkMode
                    ? 'bg-[#181d2c] border-sky-500 shadow-md shadow-sky-500/10 ring-1 ring-sky-500'
                    : 'bg-sky-50/80 border-sky-500 shadow-sm ring-1 ring-sky-500'
                  : darkMode
                  ? 'bg-[#131620] border-[#222736] hover:bg-[#1a1e2c] hover:border-[#333a4f]'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              {/* Active Indicator Strip */}
              {isActive && (
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-sky-400 to-indigo-500" />
              )}

              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: cfg.colorScheme.text }}
                  />
                  <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {cfg.name}
                  </span>
                </div>
                <div
                  className={`flex items-center gap-1 font-mono text-xs font-bold px-2 py-0.5 rounded-md border ${getScoreBadgeClass(
                    audit.score
                  )}`}
                >
                  {getStatusIcon(audit.status)}
                  <span>{audit.score}%</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 line-clamp-1 mb-2">
                {cfg.tagline}
              </p>

              <div className="pt-2 border-t border-slate-800/40 text-[11px] space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Target Ratio:</span>
                  <span className="font-mono text-slate-200">{cfg.primaryRatio}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Audio LUFS:</span>
                  <span className="font-mono text-slate-200">{cfg.audioTargetLufs} LUFS</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
