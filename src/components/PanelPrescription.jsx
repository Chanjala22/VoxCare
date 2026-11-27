import React, { useState } from 'react';
import {
  Printer,
  Lock,
  Copy,
  Check,
  Languages,
  FileCheck2,
  MessageSquareShare,
} from 'lucide-react';
import {
  translateDosingInstruction,
  generateWhatsAppMessage,
} from '../utils/clinicalParser.js';

const SUMMARY_LANGUAGES = [
  'English',
  'Hindi',
  'Kannada',
  'Malayalam',
  'Tamil',
  'Telugu',
];

export default function PanelPrescription({
  emr,
  rxLang,
  onRxLangChange,
}) {
  const [copied, setCopied] = useState(false);

  const todayFormatted = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const handlePrint = () => {
    if (!emr || !emr.printEnabled) return;
    window.print();
  };

  const handleCopyWhatsApp = async () => {
    if (!emr) return;
    const msg = generateWhatsAppMessage(emr, rxLang);
    try {
      await navigator.clipboard.writeText(msg);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for non-secure contexts
      const textarea = document.createElement('textarea');
      textarea.value = msg;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <section className="panel-card h-full print-layout-reset">
      {/* Panel Header (hidden when printing) */}
      <div className="no-print panel-header justify-between">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-clinical-600 text-white text-xs font-bold flex items-center justify-center">
            3
          </span>
          <h2 className="text-sm font-semibold text-slate-800">
            Printable A4 Rx &amp; Patient Summary
          </h2>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          disabled={!emr || !emr.printEnabled}
          className="btn-primary py-1.5 px-3 text-xs"
          title={
            emr && !emr.printEnabled
              ? 'Verify all flagged allergies and high-dose alerts in Panel 2 to unlock printing'
              : 'Print A4 Outpatient Prescription'
          }
        >
          {emr && !emr.printEnabled ? (
            <>
              <Lock className="w-3.5 h-3.5" />
              <span>Verify Flags to Print</span>
            </>
          ) : (
            <>
              <Printer className="w-3.5 h-3.5" />
              <span>Print A4 Rx</span>
            </>
          )}
        </button>
      </div>

      {/* Empty State */}
      {!emr ? (
        <div className="no-print p-8 flex-1 flex flex-col items-center justify-center text-center text-slate-400">
          <FileCheck2 className="w-12 h-12 mb-3 text-slate-300" />
          <p className="text-sm font-semibold text-slate-600">A4 Prescription Preview</p>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            Structured Rx sheet and regional WhatsApp/SMS patient dosing summary will appear here.
          </p>
        </div>
      ) : (
        <div className="p-4 sm:p-5 flex-1 flex flex-col gap-4 overflow-y-auto print-layout-reset">
          {/* Lock Notice when safety flags unverified */}
          {!emr.printEnabled && (
            <div className="no-print alert-red">
              <Lock className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="text-xs text-red-800">
                <strong>Printing Locked:</strong> One or more medications have unverified allergy or
                dose alerts. Click <strong>Verify Dose</strong> in Panel 2 to enable A4 printing.
              </p>
            </div>
          )}

          {/* Printable A4 Clinical Sheet */}
          <div className="print-prescription rounded-xl border border-slate-300 bg-white p-4 sm:p-5 shadow-inner text-slate-900">
            {/* Clinic Header */}
            <div className="flex items-start justify-between border-b-2 border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold tracking-tight text-slate-900 uppercase">
                  VoxCare Outpatient Clinic (OPD)
                </h3>
                <p className="text-[11px] text-slate-600">
                  General Practice &amp; Primary Health Care • Reg. No. MCI-IN-2026-OPD
                </p>
              </div>
              <div className="text-right text-[11px] text-slate-700">
                <p className="font-semibold">Date: {todayFormatted}</p>
                <p>Visit Type: OPD</p>
              </div>
            </div>

            {/* Patient + Vitals Summary Row */}
            <div className="grid grid-cols-2 gap-2 py-2.5 border-b border-slate-200 text-xs">
              <div>
                <span className="text-slate-500">Patient: </span>
                <strong className="text-slate-900">
                  {emr.patient?.name ? `${emr.patient.name} (` : ''}
                  {emr.patient?.age || emr.patient?.gender
                    ? `${emr.patient.age || '—'}${emr.patient.gender || ''}`
                    : 'OPD Patient'}
                  {emr.patient?.name ? ')' : ''}
                </strong>
                {emr.allAllergies?.length > 0 && (
                  <p className="text-[11px] text-red-700 font-semibold mt-0.5">
                    Allergies: {emr.allAllergies.join(', ')}
                  </p>
                )}
              </div>

              <div className="text-right text-[11px] text-slate-700 space-y-0.5">
                <p>
                  <strong>BP:</strong>{' '}
                  {emr.vitals?.bp ? `${emr.vitals.bp.sys}/${emr.vitals.bp.dia} mmHg` : '—'}{' '}
                  | <strong>Temp:</strong>{' '}
                  {emr.vitals?.temp ? `${emr.vitals.temp.value}°${emr.vitals.temp.unit}` : '—'}
                </p>
                <p>
                  <strong>Pulse:</strong>{' '}
                  {emr.vitals?.pulse ? `${emr.vitals.pulse} bpm` : '—'}
                  {emr.vitals?.spo2 ? ` | SpO2: ${emr.vitals.spo2}%` : ''}
                </p>
              </div>
            </div>

            {/* Complaints & Diagnosis */}
            <div className="py-2.5 border-b border-slate-200 text-xs space-y-1">
              {emr.chiefComplaints?.length > 0 && (
                <p>
                  <strong className="text-slate-700">Complaints:</strong>{' '}
                  {emr.chiefComplaints.join(', ')}
                </p>
              )}
              <p>
                <strong className="text-slate-700">Diagnosis:</strong>{' '}
                <span className="font-semibold text-slate-900">
                  {emr.diagnosis || 'Clinical evaluation'}
                </span>
              </p>
            </div>

            {/* Structured Rx Table */}
            <div className="py-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-base font-serif font-bold text-slate-900">℞</span>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                  Prescribed Medications
                </span>
              </div>

              <table className="rx-table w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700">
                    <th className="p-2 border border-slate-300 text-left">#</th>
                    <th className="p-2 border border-slate-300 text-left">Medicine</th>
                    <th className="p-2 border border-slate-300 text-left">Dose</th>
                    <th className="p-2 border border-slate-300 text-left">Frequency &amp; Timing</th>
                    <th className="p-2 border border-slate-300 text-left">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {emr.medications.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-3 text-center text-slate-400 border border-slate-200">
                        No medications prescribed
                      </td>
                    </tr>
                  ) : (
                    emr.medications.map((med, i) => (
                      <tr key={med.id} className="even:bg-slate-50">
                        <td className="p-2 border border-slate-200">{i + 1}</td>
                        <td className="p-2 border border-slate-200 font-semibold">
                          {med.name}
                          {(med.allergyConflict || med.doseWarning) && med.verified && (
                            <span className="block text-[10px] text-emerald-700 font-normal">
                              ✓ Clinician verified
                            </span>
                          )}
                        </td>
                        <td className="p-2 border border-slate-200">
                          {med.dose != null ? `${med.dose} ${med.doseUnit || ''}` : '—'}
                        </td>
                        <td className="p-2 border border-slate-200">
                          {[med.frequency, med.timing].filter(Boolean).join(' • ') || 'As directed'}
                        </td>
                        <td className="p-2 border border-slate-200">
                          {med.duration || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Follow-up & Sign-off */}
            <div className="pt-3 border-t border-slate-200 flex items-end justify-between text-xs">
              <div>
                <p>
                  <strong className="text-slate-700">Follow-up Advice:</strong>{' '}
                  {emr.followUp || 'Review if symptoms persist or worsen.'}
                </p>
              </div>
              <div className="text-right pt-4">
                <div className="w-32 border-t border-slate-400 pt-1 text-[11px] font-semibold text-slate-700">
                  Attending Physician
                </div>
              </div>
            </div>
          </div>

          {/* Patient Dosage Summary Card (Regional Script + WhatsApp/SMS Copy) */}
          <div className="no-print p-4 rounded-xl bg-gradient-to-br from-clinical-50 to-white border border-clinical-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Languages className="w-4 h-4 text-clinical-700" />
                <span className="text-xs font-bold text-slate-800">
                  Patient Dosage Summary
                </span>
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="rx-lang-select" className="sr-only">
                  Select Patient Language
                </label>
                <select
                  id="rx-lang-select"
                  value={rxLang}
                  onChange={(e) => onRxLangChange(e.target.value)}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg border border-clinical-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-clinical-500 cursor-pointer"
                >
                  {SUMMARY_LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleCopyWhatsApp}
                  disabled={emr.medications.length === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <MessageSquareShare className="w-3.5 h-3.5" />
                      <Copy className="w-3 h-3" />
                      <span>Copy WhatsApp/SMS</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {emr.medications.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                No medications to translate.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {emr.medications.map((med, idx) => (
                  <li
                    key={med.id}
                    className="text-xs text-slate-800 bg-white px-3 py-2 rounded-lg border border-slate-200 leading-relaxed"
                  >
                    <span className="font-semibold text-clinical-800 mr-1">{idx + 1}.</span>
                    {translateDosingInstruction(med, rxLang)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

