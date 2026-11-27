import React, { useState } from 'react';
import {
  ClipboardList,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Activity,
  Thermometer,
  HeartPulse,
  User,
  Send,
  Volume2,
  Eye,
  EyeOff,
  Radio,
} from 'lucide-react';

const LANG_META = {
  'en-IN': { label: 'Indian English', cls: 'lang-badge-en' },
  hi:      { label: 'Hindi',          cls: 'lang-badge-hi' },
  kn:      { label: 'Kannada',        cls: 'lang-badge-kn' },
  ml:      { label: 'Malayalam',      cls: 'lang-badge-ml' },
  ta:      { label: 'Tamil',          cls: 'lang-badge-ta' },
  te:      { label: 'Telugu',         cls: 'lang-badge-te' },
};

const QUICK_EDIT_EXAMPLES = [
  'Change Cetirizine to 5 days',
  'Remove headache',
  'Set diagnosis to Acute Viral Fever',
];

export default function PanelEMR({
  emr,
  onVerifyMedication,
  onRunEditCommand,
  editFeedback,
}) {
  const [commandInput, setCommandInput] = useState('');
  const [showNormalized, setShowNormalized] = useState(false);

  const handleCommandSubmit = (e) => {
    e.preventDefault();
    if (!commandInput.trim() || !emr) return;
    onRunEditCommand(commandInput.trim());
    setCommandInput('');
  };

  return (
    <section className="no-print panel-card h-full">
      {/* Panel Header */}
      <div className="panel-header justify-between">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-clinical-600 text-white text-xs font-bold flex items-center justify-center">
            2
          </span>
          <h2 className="text-sm font-semibold text-slate-800">
            Structured EMR &amp; Clinical Safety Check
          </h2>
        </div>
        {emr && (
          <button
            type="button"
            onClick={() => setShowNormalized((v) => !v)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-clinical-700 hover:text-clinical-900 cursor-pointer"
          >
            {showNormalized ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showNormalized ? 'Hide Normalized' : 'View Normalized'}</span>
          </button>
        )}
      </div>

      {/* Empty State */}
      {!emr ? (
        <div className="p-8 flex-1 flex flex-col items-center justify-center text-center text-slate-400">
          <ClipboardList className="w-12 h-12 mb-3 text-slate-300" />
          <p className="text-sm font-semibold text-slate-600">No Structured Consultation Yet</p>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            Dictate a clinical note or choose an OPD preset in Panel 1, then click{' '}
            <strong>Structure Clinical Notes</strong>.
          </p>
        </div>
      ) : (
        <div className="p-4 sm:p-5 flex-1 flex flex-col gap-4 overflow-y-auto">
          {/* Simulated Noisy Clinic Banner */}
          {emr.noisyClinic && (
            <div className="alert-amber">
              <Radio className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900">
                <p className="font-semibold">Simulated Noisy OPD Environment Detected</p>
                <p className="text-amber-800 mt-0.5">
                  Acoustic noise cues flagged — please double-check extracted drug names and doses
                  before signing Rx.
                </p>
              </div>
            </div>
          )}

          {/* Allergy Conflict Banners (Red High-Contrast) */}
          {emr.allergyConflicts?.map((conflict, idx) => (
            <div key={`${conflict.med}-${idx}`} className="alert-red">
              <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-xs text-red-900">
                <p className="font-bold uppercase tracking-wide text-red-700">
                  Allergy Conflict: {conflict.med}
                </p>
                <p className="mt-0.5">
                  Recorded allergy to <strong>{conflict.allergen}</strong> — {conflict.reason}.
                  Verify or remove before printing.
                </p>
              </div>
            </div>
          ))}

          {/* High Dose Warning Banners (Amber High-Contrast) */}
          {emr.doseWarnings?.map((warn, idx) => (
            <div key={`${warn.med}-${idx}`} className="alert-amber">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-950">
                <p className="font-bold uppercase tracking-wide text-amber-800">
                  High Dose Alert: {warn.med} ({warn.prescribedDose})
                </p>
                <p className="mt-0.5">{warn.message}</p>
              </div>
            </div>
          ))}

          {/* Detected Languages */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-600 mr-1">Detected:</span>
            {emr.languages.map((code) => {
              const meta = LANG_META[code] || { label: code, cls: 'bg-slate-100 text-slate-700' };
              return (
                <span key={code} className={`tag-pill ${meta.cls}`}>
                  {meta.label} ({code})
                </span>
              );
            })}
          </div>

          {/* Optional Normalized Transcript Preview */}
          {showNormalized && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 whitespace-pre-wrap">
              <p className="font-semibold text-slate-800 mb-1">
                Normalized Clinical English Text:
              </p>
              {emr.normalizedTranscript}
            </div>
          )}

          {/* Patient & Vitals */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="vitals-card">
              <User className="w-4 h-4 text-clinical-600 mb-1" />
              <span className="text-[11px] text-slate-500">Patient</span>
              <span className="text-sm font-bold text-slate-800">
                {emr.patient?.age || emr.patient?.gender
                  ? `${emr.patient.age || '—'}${emr.patient.gender || ''}`
                  : 'Unspecified'}
              </span>
              {emr.patient?.name && (
                <span className="text-[10px] text-slate-500 truncate max-w-full">
                  {emr.patient.name}
                </span>
              )}
            </div>

            <div
              className={`vitals-card ${
                emr.vitals?.bp?.sys >= 140 ? 'border-amber-300 bg-amber-50' : ''
              }`}
            >
              <Activity className="w-4 h-4 text-emerald-600 mb-1" />
              <span className="text-[11px] text-slate-500">BP (mmHg)</span>
              <span className="text-sm font-bold text-slate-800">
                {emr.vitals?.bp ? `${emr.vitals.bp.sys}/${emr.vitals.bp.dia}` : '—'}
              </span>
            </div>

            <div
              className={`vitals-card ${
                emr.vitals?.temp?.value >= 100 ? 'border-amber-300 bg-amber-50' : ''
              }`}
            >
              <Thermometer className="w-4 h-4 text-orange-500 mb-1" />
              <span className="text-[11px] text-slate-500">Temp</span>
              <span className="text-sm font-bold text-slate-800">
                {emr.vitals?.temp ? `${emr.vitals.temp.value}°${emr.vitals.temp.unit}` : '—'}
              </span>
            </div>

            <div className="vitals-card">
              <HeartPulse className="w-4 h-4 text-rose-500 mb-1" />
              <span className="text-[11px] text-slate-500">Pulse</span>
              <span className="text-sm font-bold text-slate-800">
                {emr.vitals?.pulse ? `${emr.vitals.pulse} bpm` : '—'}
              </span>
            </div>
          </div>

          {/* Chief Complaints & Diagnosis */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div>
              <span className="text-xs font-semibold text-slate-600 block mb-1.5">
                Chief Complaints
              </span>
              {emr.chiefComplaints?.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {emr.chiefComplaints.map((c) => (
                    <span
                      key={c}
                      className="tag-pill bg-white border border-slate-200 text-slate-700"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-slate-400 italic">None extracted</span>
              )}
            </div>

            <div className="pt-2 border-t border-slate-200">
              <span className="text-xs font-semibold text-slate-600 block">
                Provisional Diagnosis
              </span>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">
                {emr.diagnosis || 'Pending clinician assessment'}
              </p>
            </div>
          </div>

          {/* Extracted Medications */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">
                Extracted Medications ({emr.medications?.length || 0})
              </span>
              {!emr.printEnabled && (
                <span className="text-[11px] font-semibold text-red-600">
                  Verification Required Before Print
                </span>
              )}
            </div>

            {emr.medications?.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No medications detected.</p>
            ) : (
              <div className="space-y-2">
                {emr.medications.map((med) => {
                  const isFlagged = med.allergyConflict || med.doseWarning;
                  const needsVerify = isFlagged && !med.verified;

                  return (
                    <div
                      key={med.id}
                      className={`p-3 rounded-xl border transition-colors ${
                        needsVerify && med.allergyConflict
                          ? 'bg-red-50 border-red-300'
                          : needsVerify && med.doseWarning
                          ? 'bg-amber-50 border-amber-300'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-slate-900">
                              {med.name}
                            </span>
                            {med.dose != null && (
                              <span className="tag-pill bg-clinical-50 text-clinical-800 border border-clinical-100">
                                {med.dose} {med.doseUnit}
                              </span>
                            )}
                            {med.allergyConflict && (
                              <span className="tag-pill bg-red-100 text-red-800">
                                Allergy Flag
                              </span>
                            )}
                            {med.doseWarning && (
                              <span className="tag-pill bg-amber-100 text-amber-800">
                                High Dose
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-slate-600 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                            <span>
                              <strong>Frequency:</strong> {med.frequency || 'As directed'}
                            </span>
                            {med.timing && (
                              <span>
                                <strong>Timing:</strong> {med.timing}
                              </span>
                            )}
                            {med.duration && (
                              <span>
                                <strong>Duration:</strong> {med.duration}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Verification CTA / Status */}
                        {isFlagged && (
                          <div className="shrink-0">
                            {med.verified ? (
                              <span className="btn-success">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Verified
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onVerifyMedication(med.id)}
                                className="btn-warning"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Verify Dose
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Voice Edit Command Bar */}
          <div className="mt-auto pt-3 border-t border-slate-200 space-y-2">
            <label
              htmlFor="voice-edit-bar"
              className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
            >
              <Volume2 className="w-3.5 h-3.5 text-clinical-600" />
              Voice Edit Command Bar
            </label>
            <form onSubmit={handleCommandSubmit} className="flex gap-2">
              <input
                id="voice-edit-bar"
                type="text"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                placeholder='e.g. "Change Cetirizine to 5 days" or "Remove headache"'
                className="input-field text-xs"
              />
              <button
                type="submit"
                disabled={!commandInput.trim()}
                className="btn-primary py-2 px-3 text-xs shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                Apply
              </button>
            </form>

            {/* Quick command chips */}
            <div className="flex flex-wrap gap-1.5">
              {QUICK_EDIT_EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setCommandInput(example)}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                >
                  {example}
                </button>
              ))}
            </div>

            {editFeedback && (
              <p className="text-xs font-medium text-clinical-700 bg-clinical-50 border border-clinical-100 rounded-lg px-2.5 py-1.5">
                {editFeedback}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

