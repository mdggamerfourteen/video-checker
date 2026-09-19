import React, { useState } from 'react';
import { DaVinciMarker, DaVinciMarkerColor } from '../types';
import {
  Tag,
  Play,
  Copy,
  Check,
  Filter,
  Plus,
  Scissors,
  Palette,
  Volume2,
  Sparkles,
} from 'lucide-react';
import { secondsToSMPTE } from '../utils/timecode';

interface DaVinciMarkersTableProps {
  darkMode: boolean;
  markers: DaVinciMarker[];
  onSeekToTimecode: (seconds: number) => void;
  onAddCustomMarker?: (marker: DaVinciMarker) => void;
  fps: number;
}

export const DaVinciMarkersTable: React.FC<DaVinciMarkersTableProps> = ({
  darkMode,
  markers,
  onSeekToTimecode,
  onAddCustomMarker,
  fps = 30,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddingMarker, setIsAddingMarker] = useState(false);
  const [newMarkerName, setNewMarkerName] = useState('');
  const [newMarkerComment, setNewMarkerComment] = useState('');
  const [newMarkerTime, setNewMarkerTime] = useState('01:00:00:00');
  const [newMarkerColor, setNewMarkerColor] = useState<DaVinciMarkerColor>('Cyan');

  const getMarkerColorHex = (color: string) => {
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
      case 'mint':
        return '#6ee7b7';
      default:
        return '#94a3b8';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cut':
        return <Scissors className="w-3.5 h-3.5 text-blue-400" />;
      case 'color':
        return <Palette className="w-3.5 h-3.5 text-yellow-400" />;
      case 'audio':
        return <Volume2 className="w-3.5 h-3.5 text-green-400" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-purple-400" />;
    }
  };

  const filteredMarkers =
    selectedCategory === 'all'
      ? markers
      : markers.filter((m) => m.category === selectedCategory);

  const handleCopyTimecode = (m: DaVinciMarker) => {
    navigator.clipboard.writeText(`${m.timecodeIn} - ${m.name}: ${m.comment}`);
    setCopiedId(m.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleCreateMarker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMarkerName || !onAddCustomMarker) return;

    const parts = newMarkerTime.split(':').map((p) => parseInt(p, 10) || 0);
    const h = parts[0] || 1;
    const m = parts[1] || 0;
    const s = parts[2] || 0;
    const f = parts[3] || 0;
    const totalSecs = Math.max(0, h - 1) * 3600 + m * 60 + s + f / fps;

    const marker: DaVinciMarker = {
      id: `custom-${Date.now()}`,
      name: newMarkerName,
      comment: newMarkerComment || 'Custom editor timeline marker',
      timecodeIn: newMarkerTime,
      timecodeOut: secondsToSMPTE(totalSecs + 1, fps),
      durationFrames: fps,
      color: newMarkerColor,
      category: 'cut',
      seconds: totalSecs,
    };

    onAddCustomMarker(marker);
    setIsAddingMarker(false);
    setNewMarkerName('');
    setNewMarkerComment('');
  };

  return (
    <div
      id="davinci-markers-container"
      className={`rounded-xl border transition-all ${
        darkMode ? 'bg-[#12141c] border-[#222736]' : 'bg-white border-slate-200 shadow-sm'
      }`}
    >
      {/* Header Bar */}
      <div className="p-4 border-b border-[#222736] flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-sky-400" />
            <h3 className={`text-sm font-bold uppercase tracking-wider ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              DaVinci Resolve Timeline Markers ({filteredMarkers.length})
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Native markers with color coding for DaVinci Resolve Edit, Color, and Fairlight pages
          </p>
        </div>

        {/* Filter & Add Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-[#1a1e2a] border border-[#2b3142] rounded-md px-2 py-1 text-xs text-slate-300">
            <Filter className="w-3 h-3 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent focus:outline-none text-slate-200 cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="cut">Cuts & Trims</option>
              <option value="color">Color Grading</option>
              <option value="audio">Fairlight Audio</option>
              <option value="pacing">Pacing & Hooks</option>
              <option value="platform">Platform Safe Zones</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => setIsAddingMarker(!isAddingMarker)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-[#1d2230] hover:bg-[#252b3d] border border-[#2e3547] text-slate-200"
          >
            <Plus className="w-3.5 h-3.5 text-sky-400" />
            <span>Add Marker</span>
          </button>
        </div>
      </div>

      {/* Add Marker Form */}
      {isAddingMarker && (
        <form onSubmit={handleCreateMarker} className="p-4 bg-[#171b26] border-b border-[#242a3a] space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            <input
              type="text"
              placeholder="Marker Name (e.g. Cut Dead Space)"
              value={newMarkerName}
              onChange={(e) => setNewMarkerName(e.target.value)}
              required
              className="px-2.5 py-1.5 rounded bg-[#10121a] border border-[#2c3243] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
            <input
              type="text"
              placeholder="Timecode (01:00:05:00)"
              value={newMarkerTime}
              onChange={(e) => setNewMarkerTime(e.target.value)}
              required
              className="px-2.5 py-1.5 rounded bg-[#10121a] border border-[#2c3243] text-xs font-mono text-white focus:outline-none focus:border-sky-500"
            />
            <select
              value={newMarkerColor}
              onChange={(e) => setNewMarkerColor(e.target.value as DaVinciMarkerColor)}
              className="px-2.5 py-1.5 rounded bg-[#10121a] border border-[#2c3243] text-xs text-white focus:outline-none focus:border-sky-500"
            >
              <option value="Cyan">Cyan (B-Roll / Cut)</option>
              <option value="Purple">Purple (Hook / Pacing)</option>
              <option value="Yellow">Yellow (Color Grade)</option>
              <option value="Green">Green (Fairlight Audio)</option>
              <option value="Blue">Blue (Edit Page Note)</option>
              <option value="Red">Red (Critical Fix)</option>
              <option value="Pink">Pink (Graphic Title)</option>
              <option value="Mint">Mint (End Screen)</option>
            </select>
            <button
              type="submit"
              className="px-3 py-1.5 rounded bg-sky-500 hover:bg-sky-400 text-white font-medium text-xs shadow"
            >
              Save to Timeline
            </button>
          </div>
          <input
            type="text"
            placeholder="Editor instruction or comment (optional)"
            value={newMarkerComment}
            onChange={(e) => setNewMarkerComment(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded bg-[#10121a] border border-[#2c3243] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </form>
      )}

      {/* Markers Table List */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead
            className={`border-b text-[11px] uppercase tracking-wider font-semibold ${
              darkMode ? 'bg-[#151822] border-[#222736] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <tr>
              <th className="py-2.5 px-3">Color</th>
              <th className="py-2.5 px-3 font-mono">Timecode In</th>
              <th className="py-2.5 px-3">Marker Name</th>
              <th className="py-2.5 px-3">Category</th>
              <th className="py-2.5 px-3">DaVinci Resolve Action</th>
              <th className="py-2.5 px-3 text-right">Preview</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e2330]">
            {filteredMarkers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">
                  No markers in this category.
                </td>
              </tr>
            ) : (
              filteredMarkers.map((m) => {
                const colorHex = getMarkerColorHex(m.color);

                return (
                  <tr
                    key={m.id}
                    className={`transition-colors ${
                      darkMode ? 'hover:bg-[#181c28]' : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Color Swatch */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-3 h-3 rounded-full border border-black/40 shadow-sm"
                          style={{ backgroundColor: colorHex }}
                        />
                        <span className="font-semibold text-[11px]" style={{ color: colorHex }}>
                          {m.color}
                        </span>
                      </div>
                    </td>

                    {/* Timecode In */}
                    <td className="py-3 px-3 whitespace-nowrap font-mono font-semibold text-emerald-400">
                      {m.timecodeIn}
                    </td>

                    {/* Marker Name */}
                    <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-200">
                      {m.name}
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#1e2332] text-slate-300 border border-[#2b3347] text-[10px] capitalize">
                        {getCategoryIcon(m.category)}
                        <span>{m.category}</span>
                      </span>
                    </td>

                    {/* Comment */}
                    <td className="py-3 px-3 text-slate-300 min-w-[280px]">
                      {m.comment}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onSeekToTimecode(m.seconds)}
                          className="p-1 rounded bg-[#1e2332] hover:bg-sky-500 hover:text-white text-sky-400 border border-[#2c3347] transition-colors"
                          title="Seek Video to this Marker"
                        >
                          <Play className="w-3 h-3 ml-0.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyTimecode(m)}
                          className="p-1 rounded bg-[#1e2332] hover:bg-slate-700 text-slate-400 hover:text-white border border-[#2c3347] transition-colors"
                          title="Copy timecode to clipboard"
                        >
                          {copiedId === m.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
