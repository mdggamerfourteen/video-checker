import React, { useState } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  FileSpreadsheet,
  FileText,
  Film,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { DaVinciEditReport, VideoMetadata, PlatformId } from '../types';
import {
  generateDaVinciMarkerCSV,
  generateDaVinciEDL,
  generateDetailedMarkdownReport,
  downloadFile,
} from '../utils/davinciExport';

interface ExportModalProps {
  darkMode: boolean;
  isOpen: boolean;
  onClose: () => void;
  report: DaVinciEditReport;
  video: VideoMetadata;
  activePlatform: PlatformId;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  darkMode,
  isOpen,
  onClose,
  report,
  video,
  activePlatform,
}) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);

  if (!isOpen) return null;

  const baseFileName = (video.fileName || 'video_clip')
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_');

  const handleDownloadCSV = () => {
    const csv = generateDaVinciMarkerCSV(report.davinciMarkers);
    downloadFile(csv, `${baseFileName}_davinci_markers.csv`, 'text/csv;charset=utf-8;');
  };

  const handleDownloadEDL = () => {
    const edl = generateDaVinciEDL(report.davinciMarkers, video, video.fps || 30);
    downloadFile(edl, `${baseFileName}_davinci_markers.edl`, 'text/plain;charset=utf-8;');
  };

  const handleDownloadReport = () => {
    const md = generateDetailedMarkdownReport(report, video, activePlatform);
    downloadFile(md, `${baseFileName}_davinci_edit_plan.md`, 'text/markdown;charset=utf-8;');
  };

  const handleCopyCSV = () => {
    const csv = generateDaVinciMarkerCSV(report.davinciMarkers);
    navigator.clipboard.writeText(csv);
    setCopiedType('csv');
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleCopyReport = () => {
    const md = generateDetailedMarkdownReport(report, video, activePlatform);
    navigator.clipboard.writeText(md);
    setCopiedType('report');
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        id="export-modal-dialog"
        className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden transition-all ${
          darkMode ? 'bg-[#141722] border-[#252c3f] text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-[#23283a] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                Export for DaVinci Resolve
              </h3>
              <p className="text-xs text-slate-400">
                Download frame-accurate markers and master edit plans
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Export Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Option 1: DaVinci Markers CSV */}
            <div className="p-4 rounded-xl bg-[#181c28] border border-[#2b3347] space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Timeline Markers CSV</span>
                  </div>
                  <span className="text-[10px] font-mono uppercase bg-sky-950 text-sky-300 px-2 py-0.5 rounded border border-sky-800">
                    .CSV
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Imports directly onto your DaVinci Resolve Timeline with original colors (Purple, Cyan, Yellow, Green, Blue, Red).
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadCSV}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold shadow transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .CSV</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyCSV}
                  className="px-3 py-2 rounded-lg bg-[#202636] hover:bg-[#2a3247] text-slate-300 text-xs font-medium border border-[#323b52] transition-colors"
                  title="Copy CSV to clipboard"
                >
                  {copiedType === 'csv' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Option 2: CMX 3600 EDL */}
            <div className="p-4 rounded-xl bg-[#181c28] border border-[#2b3347] space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                    <Film className="w-4 h-4" />
                    <span>CMX 3600 EDL Markers</span>
                  </div>
                  <span className="text-[10px] font-mono uppercase bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800">
                    .EDL
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Industry standard Edit Decision List format for DaVinci Resolve, Premiere Pro, or Avid Media Composer.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadEDL}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .EDL</span>
                </button>
              </div>
            </div>

            {/* Option 3: Full Detailed Markdown Report */}
            <div className="p-4 rounded-xl bg-[#181c28] border border-[#2b3347] space-y-3 md:col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <FileText className="w-4 h-4" />
                  <span>Master DaVinci Action Plan Report</span>
                </div>
                <span className="text-[10px] font-mono uppercase bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
                  .MD / TXT
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Comprehensive step-by-step document with Lift/Gamma/Gain color grading values, Fairlight compressor/LUFS settings, Edit cut timecodes, and platform compliance audit.
              </p>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDownloadReport}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Complete Report (.MD)</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyReport}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#202636] hover:bg-[#2a3247] text-slate-300 text-xs font-medium border border-[#323b52] transition-colors"
                >
                  {copiedType === 'report' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied Report!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Full Report</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Quick DaVinci Resolve Import Guide */}
          <div className="p-4 rounded-xl bg-[#10131d] border border-[#22283a] space-y-2">
            <h4 className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>How to Import into DaVinci Resolve (18 & 19):</span>
            </h4>
            <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside leading-relaxed pl-1">
              <li>
                Open your project in <strong>DaVinci Resolve</strong> and select your timeline.
              </li>
              <li>
                In the <strong>Media Pool</strong>, right-click on your timeline sequence.
              </li>
              <li>
                Navigate to: <code className="text-emerald-300 bg-black/40 px-1.5 py-0.5 rounded font-mono">Timelines &gt; Import &gt; Timeline Markers from CSV...</code> (or <code className="text-emerald-300 bg-black/40 px-1.5 py-0.5 rounded font-mono">from EDL...</code>).
              </li>
              <li>
                Select the downloaded <span className="text-sky-300 font-mono">.csv</span> or <span className="text-sky-300 font-mono">.edl</span> file.
              </li>
              <li>
                All markers will instantly appear with their exact timecodes, colors, and editing notes!
              </li>
            </ol>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#10131d] border-t border-[#23283a] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#202636] hover:bg-[#2b3347] text-xs font-semibold text-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
