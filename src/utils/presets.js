/**
 * VoxCare OPD Test Presets — src/utils/presets.js
 *
 * Three pre-loaded clinical transcripts for judges to test all code paths
 * without requiring a microphone or external API.
 *
 * Preset 1: Standard Indian-English OPD visit
 * Preset 2: Multilingual code-switched visit (Hindi, Kannada, Malayalam, Tamil, Telugu)
 * Preset 3: Safety & dose-warning test case (allergy conflict + high dose)
 */

export const PRESET_1 = {
  label: '1. Standard English OPD',
  emoji: '🏥',
  description: '29F, Viral Pharyngitis — Paracetamol + Cetirizine',
  transcript: `Patient 29F, presenting with fever and sore throat since 2 days. Running nose and mild headache also present. No significant past medical history. No known drug allergies.

BP 118/76 mmHg, temperature 100.8°F, pulse 88 bpm. Throat examination shows mild erythema, no exudate.

Diagnosis: Viral pharyngitis.

Rx:
1. Paracetamol 500 mg SOS (take when fever > 100°F or pain)
2. Cetirizine 10 mg once at night for 3 days

Advice: Warm salt water gargles, adequate hydration, rest.
Follow up after 3 days if symptoms worsen or not improving.`,
  allergies: [],
};

export const PRESET_2 = {
  label: '2. Multilingual Code-Mixed',
  emoji: '🌐',
  description: 'Hindi + Kannada + Malayalam + Tamil + Telugu cues',
  transcript: `Patient 45M, bukhar hai teen din se. Khansi bhi hai aur badan dard bhi. Gale mein kharash hai.

BP 130/84 mmHg, temp 101.2°F. Pulse 92. SpO2 97%.

Belagge mattu ratri Paracetamol 650 mg khaaye — ootada nantara lena.
Ravile-rathri Cetirizine 10 mg. Bhakshanathinu shesham medicine leyi.
Kaalai-maalai Vitamin C 500 mg maattirai saapittathukku apparam.
Uddhanda-rathri cough syrup Dextromethorphan 10 ml — bhojanam taruvatha.

Assessment: Acute upper respiratory tract infection with cough and fever.

Follow up after 5 days or earlier if fever persists.`,
  allergies: [],
};

export const PRESET_3 = {
  label: '3. Safety & Dose Warning',
  emoji: '⚠️',
  description: 'Amoxicillin / PCN allergy conflict + Paracetamol 1500 mg',
  transcript: `[NOISY CLINIC] Patient 38F, known allergy to Penicillin and Amoxicillin.

BP 122/78 mmHg, temperature 99.6°F, pulse 84 bpm. Throat shows purulent exudate, tonsillar enlargement grade 2.

Diagnosis: Bacterial pharyngitis — suspected streptococcal tonsillitis.

Rx:
1. Amoxicillin 500 mg thrice daily for 5 days
2. Paracetamol 1500 mg stat for severe fever, then 1000 mg thrice daily for 3 days
3. Cetirizine 10 mg once at night for 3 days

Advice: Monitor for rash or breathing difficulty. Avoid cold drinks.
Follow up after 3 days.`,
  allergies: ['Penicillin', 'Amoxicillin'],
};

export const ALL_PRESETS = [PRESET_1, PRESET_2, PRESET_3];

