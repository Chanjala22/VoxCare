import React, { useState, useRef, useEffect, useCallback } from 'react';
import Header from './components/Header.jsx';
import PanelVoiceCapture from './components/PanelVoiceCapture.jsx';
import PanelEMR from './components/PanelEMR.jsx';
import PanelPrescription from './components/PanelPrescription.jsx';
import {
  parseTranscript,
  runVoiceEditCommand,
} from './utils/clinicalParser.js';

export default function App() {
  const [transcript, setTranscript] = useState('');
  const [segmentHistory, setSegmentHistory] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [emr, setEmr] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [speechError, setSpeechError] = useState('');
  const [rxLang, setRxLang] = useState('English');
  const [editFeedback, setEditFeedback] = useState('');
  const [voiceName, setVoiceName] = useState('');

  const recognitionRef = useRef(null);
  const isRecordingRef = useRef(false);

  const SpeechRecognition =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;
  const speechSupported = Boolean(SpeechRecognition);

  // Discover Indian English speech synthesis voice when available
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const enIn = voices.find((v) => v.lang.toLowerCase().startsWith('en-in'));
      const enFallback = voices.find((v) => v.lang.toLowerCase().startsWith('en'));
      if (enIn) setVoiceName(enIn.name);
      else if (enFallback) setVoiceName(`${enFallback.name} (fallback)`);
    };

    pickVoice();
    window.speechSynthesis.onvoiceschanged = pickVoice;
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Spoken confirmation helper
  const speak = useCallback(
    (text) => {
      if (isMuted || typeof window === 'undefined' || !window.speechSynthesis || !text) {
        return;
      }
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-IN';
        utterance.rate = 1.02;

        const voices = window.speechSynthesis.getVoices();
        const enIn = voices.find((v) => v.lang.toLowerCase().startsWith('en-in'));
        if (enIn) utterance.voice = enIn;

        window.speechSynthesis.speak(utterance);
      } catch {
        // Ignore TTS playback errors silently
      }
    },
    [isMuted]
  );

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        isRecordingRef.current = false;
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleToggleRecording = () => {
    if (!SpeechRecognition) return;

    if (isRecording) {
      isRecordingRef.current = false;
      setIsRecording(false);
      setInterimText('');
      recognitionRef.current?.stop();
      return;
    }

    setSpeechError('');
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let finalChunk = '';
      let interimChunk = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const resultText = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalChunk += resultText;
        } else {
          interimChunk += resultText;
        }
      }

      setInterimText(interimChunk.trim());

      if (finalChunk.trim()) {
        const cleanSegment = finalChunk.trim();
        setTranscript((prev) => {
          const separator = prev && !prev.endsWith(' ') && !prev.endsWith('\n') ? ' ' : '';
          const appended = `${separator}${cleanSegment}`;
          setSegmentHistory((hist) => [...hist, appended]);
          return `${prev}${appended}`;
        });
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed') {
        setSpeechError('Microphone access was denied. Enable mic permission or use Wispr Flow / presets.');
      } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setSpeechError(`Speech recognition error: ${event.error}`);
      }
      isRecordingRef.current = false;
      setIsRecording(false);
      setInterimText('');
    };

    recognition.onend = () => {
      // Auto-restart if the doctor hasn't clicked Stop Dictation
      if (isRecordingRef.current) {
        try {
          recognition.start();
        } catch {
          isRecordingRef.current = false;
          setIsRecording(false);
        }
      } else {
        setInterimText('');
      }
    };

    recognitionRef.current = recognition;
    isRecordingRef.current = true;
    setIsRecording(true);
    recognition.start();
  };

  // Undo last dictated utterance without wiping earlier structured EMR fields
  const handleRetryLastSegment = () => {
    if (segmentHistory.length === 0) return;
    const lastSeg = segmentHistory[segmentHistory.length - 1];
    setSegmentHistory((hist) => hist.slice(0, -1));
    setTranscript((prev) => {
      if (prev.endsWith(lastSeg)) {
        return prev.slice(0, prev.length - lastSeg.length);
      }
      // Fallback: remove last sentence/line
      return prev.replace(/[\s\n]*[^.\n]+$/, '');
    });
  };

  const announceParsedSummary = useCallback(
    (parsed) => {
      if (!parsed) return;
      const medCount = parsed.medications.length;
      const conflictCount = parsed.allergyConflicts.length;
      const doseWarnCount = parsed.doseWarnings.length;

      if (conflictCount > 0 || doseWarnCount > 0) {
        const parts = [];
        if (conflictCount > 0) {
          parts.push(
            `${conflictCount} allergy conflict${conflictCount > 1 ? 's' : ''} detected`
          );
        }
        if (doseWarnCount > 0) {
          parts.push(
            `${doseWarnCount} high dose warning${doseWarnCount > 1 ? 's' : ''}`
          );
        }
        speak(`Safety alert: ${parts.join(' and ')}. Verification required before printing.`);
      } else {
        speak(
          `Structured ${parsed.chiefComplaints.length} complaints and ${medCount} medication${
            medCount === 1 ? '' : 's'
          }. Ready for review.`
        );
      }
    },
    [speak]
  );

  const handleStructureNotes = (customText, customAllergies) => {
    const sourceText = typeof customText === 'string' ? customText : transcript;
    const sourceAllergies = Array.isArray(customAllergies) ? customAllergies : allergies;
    const parsed = parseTranscript(sourceText, sourceAllergies);
    setEmr(parsed);
    setEditFeedback('');
    announceParsedSummary(parsed);
  };

  const handleLoadPreset = (preset) => {
    setTranscript(preset.transcript);
    setSegmentHistory([]);
    setAllergies(preset.allergies || []);
    handleStructureNotes(preset.transcript, preset.allergies || []);
  };

  const handleAddAllergy = (newAllergy) => {
    const exists = allergies.some(
      (a) => a.toLowerCase() === newAllergy.toLowerCase()
    );
    if (exists) return;
    const updated = [...allergies, newAllergy];
    setAllergies(updated);
    if (emr && transcript.trim()) {
      const reParsed = parseTranscript(transcript, updated);
      setEmr(reParsed);
      announceParsedSummary(reParsed);
    }
  };

  const handleRemoveAllergy = (target) => {
    const updated = allergies.filter((a) => a !== target);
    setAllergies(updated);
    if (emr && transcript.trim()) {
      const reParsed = parseTranscript(transcript, updated);
      setEmr(reParsed);
    }
  };

  const handleVerifyMedication = (medId) => {
    if (!emr) return;
    const updatedMeds = emr.medications.map((m) =>
      m.id === medId ? { ...m, verified: true } : m
    );
    const hasUnverified = updatedMeds.some(
      (m) => (m.allergyConflict || m.doseWarning) && !m.verified
    );
    const verifiedMed = updatedMeds.find((m) => m.id === medId);
    setEmr({
      ...emr,
      medications: updatedMeds,
      printEnabled: !hasUnverified,
    });
    if (verifiedMed) {
      speak(`${verifiedMed.name} verified.`);
    }
  };

  const handleRunEditCommand = (command) => {
    if (!emr) return;
    const { emr: updatedEmr, message } = runVoiceEditCommand(command, emr);
    setEmr(updatedEmr);
    setEditFeedback(message);
    speak(message);
  };

  const handleToggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      if (next && typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      return next;
    });
  };

  const handleClearTranscript = () => {
    setTranscript('');
    setSegmentHistory([]);
    setInterimText('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <Header
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        voiceName={voiceName}
        isRecording={isRecording}
      />

      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 print-layout-reset">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch print-layout-reset">
          <PanelVoiceCapture
            transcript={transcript}
            onTranscriptChange={setTranscript}
            isRecording={isRecording}
            interimText={interimText}
            speechSupported={speechSupported}
            speechError={speechError}
            onToggleRecording={handleToggleRecording}
            onRetryLastSegment={handleRetryLastSegment}
            canRetrySegment={segmentHistory.length > 0}
            onStructureNotes={() => handleStructureNotes()}
            onClearTranscript={handleClearTranscript}
            onLoadPreset={handleLoadPreset}
            allergies={allergies}
            onAddAllergy={handleAddAllergy}
            onRemoveAllergy={handleRemoveAllergy}
          />

          <PanelEMR
            emr={emr}
            onVerifyMedication={handleVerifyMedication}
            onRunEditCommand={handleRunEditCommand}
            editFeedback={editFeedback}
          />

          <PanelPrescription
            emr={emr}
            rxLang={rxLang}
            onRxLangChange={setRxLang}
          />
        </div>
      </main>
    </div>
  );
}

