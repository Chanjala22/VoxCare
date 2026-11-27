import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  RotateCcw,
  Sparkles,
  Plus,
  X,
  AlertCircle,
  FileText,
  Trash2,
} from 'lucide-react';
import { ALL_PRESETS } from '../utils/presets.js';

export default function PanelVoiceCapture({
  transcript,
  onTranscriptChange,
  isRecording,
  interimText,
  speechSupported,
  speechError,
  onToggleRecording,
  onRetryLastSegment,
  canRetrySegment,
  onStructureNotes,
  onClearTranscript,
  onLoadPreset,
  allergies,
  onAddAllergy,
  onRemoveAllergy,
}) {
  const [allergyInput, setAllergyInput] = useState('');

  const handleAddAllergy = (e) => {
    e.preventDefault();
    const cleaned = allergyInput.trim();
    if (!cleaned) return;
    onAddAllergy(cleaned);
    setAllergyInput('');
  };

  return (
    <section className="no-print panel-card h-full">
      {/* Panel Header */}
      <div className="panel-header justify-between">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-clinical-600 text-white text-xs font-bold flex items-center justify-center">
            1
          </span>
          <h2 className="text-sm font-semibold text-slate-800">
            Voice Consultation Capture
          </h2>
        </div>
        <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
          en-IN + 5 Regional
        </span>
      </div>

      {/* Panel Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col gap-4 overflow-y-auto">
        {/* Primary Voice Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onToggleRecording}
            disabled={!speechSupported}
            className={`relative flex-1 min-w-[180px] justify-center ${
              isRecording ? 'btn-danger' : 'btn-primary'
            }`}
          >
            {isRecording ? (
              <>
                <span className="relative flex h-3 w-3 recording-pulse">
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
                </span>
                <MicOff className="w-4 h-4" />
                <span>Stop Dictation</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                <span>Start Voice Capture</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onRetryLastSegment}
            disabled={!canRetrySegment}
            className="btn-secondary"
            title="Undo the last dictated utterance without wiping earlier structured fields"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retry Last Segment</span>
          </button>
        </div>

        {/* Speech API Notice / Error */}
        {!speechSupported && (
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Web Speech API is unavailable in this browser (supported in Chrome/Edge). You can still
              dictate directly via <strong>Wispr Flow</strong> desktop/mobile or test using the OPD
              presets below.
            </span>
          </div>
        )}

        {speechError && (
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{speechError}</span>
          </div>
        )}

        {/* Live Dictation / Wispr Flow Textarea */}
        <div className="flex flex-col gap-1.5 flex-1">
          <div className="flex items-center justify-between">
            <label
              htmlFor="opd-transcript"
              className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-clinical-600" />
              Raw Clinical Transcript (Wispr Flow / Mic Compatible)
            </label>
            {transcript && (
              <button
                type="button"
                onClick={onClearTranscript}
                className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>

          <textarea
            id="opd-transcript"
            value={transcript}
            onChange={(e) => onTranscriptChange(e.target.value)}
            rows={8}
            placeholder="Dictate with mic or Wispr Flow, e.g.: Patient 29F, bukhar aur khansi since 2 days, BP 118/76, temp 100.8F. Diagnosis: Viral pharyngitis. Rx: Paracetamol 500 mg subah-shaam khane ke baad for 3 days..."
            className="input-field font-normal leading-relaxed resize-y min-h-[165px] text-slate-800"
          />

          {interimText && (
            <div className="px-3 py-1.5 rounded-lg bg-clinical-50 border border-clinical-100 text-xs text-clinical-800 italic">
              Listening: &ldquo;{interimText}&rdquo;
            </div>
          )}
        </div>

        {/* Recorded Patient Allergies */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">
              Recorded Patient Allergies
            </span>
            <span className="text-[11px] text-slate-500">
              Auto-checked against Rx
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {allergies.length === 0 ? (
              <span className="text-xs text-slate-400 italic">
                No allergies recorded (NKDA)
              </span>
            ) : (
              allergies.map((item) => (
                <span
                  key={item}
                  className="tag-pill bg-red-100 text-red-800 border border-red-200"
                >
                  <span>{item}</span>
                  <button
                    type="button"
                    onClick={() => onRemoveAllergy(item)}
                    className="hover:text-red-950 ml-0.5 cursor-pointer"
                    aria-label={`Remove ${item} allergy`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))
            )}
          </div>

          <form onSubmit={handleAddAllergy} className="flex gap-2">
            <input
              type="text"
              value={allergyInput}
              onChange={(e) => setAllergyInput(e.target.value)}
              placeholder="Add allergy (e.g. Penicillin, Sulfa, NSAID)"
              className="input-field py-1.5 text-xs"
            />
            <button
              type="submit"
              disabled={!allergyInput.trim()}
              className="btn-secondary py-1.5 px-3 text-xs shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          </form>
        </div>

        {/* 3 One-Click OPD Test Presets */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">
              One-Click OPD Test Presets
            </span>
            <span className="text-[11px] text-slate-400">No mic needed</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {ALL_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => onLoadPreset(preset)}
                className="text-left px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-clinical-50 hover:border-clinical-300 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800 group-hover:text-clinical-800">
                    {preset.emoji} {preset.label}
                  </span>
                  <span className="text-[11px] font-medium text-clinical-600 opacity-80 group-hover:opacity-100">
                    Load &amp; Parse →
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                  {preset.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Structure Clinical Notes CTA */}
        <button
          type="button"
          onClick={onStructureNotes}
          disabled={!transcript.trim()}
          className="btn-primary w-full justify-center py-3 text-sm font-semibold shadow-sm"
        >
          <Sparkles className="w-4 h-4" />
          <span>Structure Clinical Notes</span>
        </button>
      </div>
    </section>
  );
}

