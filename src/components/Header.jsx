import React from 'react';
import { Stethoscope, ShieldCheck, Volume2, VolumeX, Mic } from 'lucide-react';

export default function Header({ isMuted, onToggleMute, voiceName, isRecording }) {
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-clinical-600 to-clinical-900 flex items-center justify-center text-white shadow-sm">
            <Stethoscope className="w-5 h-5" />
            {isRecording && (
              <span
                className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-white animate-pulse"
                title="Dictation active"
              />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-slate-900">VoxCare</h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-clinical-50 text-clinical-700 text-[11px] font-semibold border border-clinical-100">
                <Mic className="w-3 h-3" />
                Powered by Wispr Flow
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Voice-First OPD Clinical Documentation &amp; Rx Assistant
            </p>
          </div>
        </div>

        {/* Status & Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Required Zero-Key Status Badge */}
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold"
            title="All clinical parsing, safety checks, and regional translations run locally in your browser with zero external API keys."
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Zero-Key Local Clinical NLP Active</span>
          </div>

          {/* Speech Synthesis Toggle */}
          <button
            type="button"
            onClick={onToggleMute}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
              isMuted
                ? 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                : 'bg-clinical-50 border-clinical-200 text-clinical-800 hover:bg-clinical-100'
            }`}
            title={
              voiceName
                ? `Voice feedback (${voiceName})`
                : 'Default English voice feedback (en-IN voice pack not detected on OS)'
            }
          >
            {isMuted ? (
              <>
                <VolumeX className="w-4 h-4 text-slate-500" />
                <span>Voice Muted</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-clinical-600" />
                <span>Spoken Alerts On</span>
              </>
            )}
          </button>

          {/* OPD Date */}
          <span className="hidden md:inline-block text-xs font-medium text-slate-500 pl-2 border-l border-slate-200">
            OPD Date: {today}
          </span>
        </div>
      </div>
    </header>
  );
}

