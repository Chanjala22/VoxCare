/**
 * VoxCare Clinical Parser — src/utils/clinicalParser.js
 *
 * Deterministic, zero-API-key local NLP engine for Indian OPD clinical notes.
 * Supports multilingual code-mixed transcripts (en-IN + Hindi, Kannada,
 * Malayalam, Tamil, Telugu) and performs medication extraction, allergy
 * conflict detection, and dose safety checks.
 *
 * All logic is pure JavaScript: regex patterns + lookup tables. No network,
 * no cloud, no keys required at runtime.
 */

// ═══════════════════════════════════════════════════════════════════════════
// 1. MULTILINGUAL NORMALIZATION MAPS
//    Each entry: { pattern, replacement, lang }
//    Applied in order — lang is recorded for language detection badges.
// ═══════════════════════════════════════════════════════════════════════════

export const MULTILINGUAL_RULES = [
  // ── Hindi ────────────────────────────────────────────────────────────
  { pattern: /\bbukhar\b/gi,                         replacement: 'fever',                             lang: 'hi' },
  { pattern: /\bkhansi\b/gi,                         replacement: 'cough',                             lang: 'hi' },
  { pattern: /\bsar[\s-]?dard\b/gi,                  replacement: 'headache',                          lang: 'hi' },
  { pattern: /\bpet[\s-]?dard\b/gi,                  replacement: 'abdominal pain',                    lang: 'hi' },
  { pattern: /\bukhan\b/gi,                          replacement: 'vomiting',                          lang: 'hi' },
  { pattern: /\bthakaan\b/gi,                        replacement: 'fatigue',                           lang: 'hi' },
  { pattern: /\bnaak[\s-]?bhand\b/gi,               replacement: 'nasal congestion',                  lang: 'hi' },
  { pattern: /\bgale[\s-]?mein[\s-]?kharash\b/gi,   replacement: 'sore throat',                       lang: 'hi' },
  { pattern: /\bbadan[\s-]?dard\b/gi,               replacement: 'body ache',                         lang: 'hi' },
  { pattern: /\bchakkar\b/gi,                       replacement: 'dizziness',                         lang: 'hi' },
  { pattern: /\bsubah[\s-]*shaam\b/gi,               replacement: 'twice daily (Morning & Night)',      lang: 'hi' },
  { pattern: /\bkhane[\s-]*ke[\s-]*baad\b/gi,        replacement: 'after food',                        lang: 'hi' },
  { pattern: /\bkhane[\s-]*se[\s-]*pehle\b/gi,       replacement: 'before food',                       lang: 'hi' },
  { pattern: /\bdin[\s-]*mein[\s-]*teen[\s-]*baar\b/gi, replacement: 'thrice daily',                  lang: 'hi' },
  { pattern: /\bdin[\s-]*mein[\s-]*ek[\s-]*baar\b/gi,  replacement: 'once daily',                     lang: 'hi' },
  { pattern: /\brat[\s-]*ko\b/gi,                   replacement: 'at night',                          lang: 'hi' },
  { pattern: /\bdin[\s-]*mein[\s-]*do[\s-]*baar\b/gi, replacement: 'twice daily',                     lang: 'hi' },
  { pattern: /\bkhaaye\b/gi,                        replacement: 'take',                              lang: 'hi' },
  { pattern: /\bleyi\b|\blena\b/gi,                 replacement: 'take',                              lang: 'hi' },

  // ── Kannada ──────────────────────────────────────────────────────────
  { pattern: /\bbelagge[\s-]*mattu[\s-]*ratri\b/gi,  replacement: 'twice daily (Morning & Night)',      lang: 'kn' },
  { pattern: /\bootada[\s-]*nantara\b/gi,            replacement: 'after food',                        lang: 'kn' },
  { pattern: /\bootada[\s-]*munche\b/gi,             replacement: 'before food',                       lang: 'kn' },
  { pattern: /\bjvara\b/gi,                          replacement: 'fever',                             lang: 'kn' },
  { pattern: /\bkemmu\b/gi,                          replacement: 'cough',                             lang: 'kn' },
  { pattern: /\bmudde\b/gi,                          replacement: 'pill',                              lang: 'kn' },
  { pattern: /\btale[\s-]*novu\b/gi,                replacement: 'headache',                          lang: 'kn' },
  { pattern: /\bvamana\b/gi,                        replacement: 'vomiting',                          lang: 'kn' },
  { pattern: /\bmattu\b/gi,                         replacement: 'and',                               lang: 'kn' },

  // ── Malayalam ────────────────────────────────────────────────────────
  { pattern: /\bravile[\s-]*rathri\b/gi,             replacement: 'Twice daily (Morning & Night)',      lang: 'ml' },
  { pattern: /\bbhakshanathinu[\s-]*shesham\b/gi,    replacement: 'after food',                        lang: 'ml' },
  { pattern: /\bbhakshanathinu[\s-]*munpu\b/gi,      replacement: 'before food',                       lang: 'ml' },
  { pattern: /\bjwaram\b/gi,                         replacement: 'fever',                             lang: 'ml' },
  { pattern: /\bchumma\b/gi,                         replacement: 'cough',                             lang: 'ml' },
  { pattern: /\btalavedana\b/gi,                     replacement: 'headache',                          lang: 'ml' },
  { pattern: /\bgulika\b/gi,                         replacement: 'tablet',                            lang: 'ml' },

  // ── Tamil ────────────────────────────────────────────────────────────
  { pattern: /\bkaalai[\s-]*maalai\b/gi,             replacement: 'Twice daily (Morning & Night)',      lang: 'ta' },
  { pattern: /\bsaapittathukku[\s-]*apparam\b/gi,   replacement: 'after food',                        lang: 'ta' },
  { pattern: /\bsaapittathukku[\s-]*munnadi\b/gi,   replacement: 'before food',                       lang: 'ta' },
  { pattern: /\bkaaychal\b/gi,                       replacement: 'fever',                             lang: 'ta' },
  { pattern: /\biramal\b/gi,                         replacement: 'cough',                             lang: 'ta' },
  { pattern: /\btalaivaali\b/gi,                     replacement: 'headache',                          lang: 'ta' },
  { pattern: /\bmarundhu\b/gi,                       replacement: 'medicine',                          lang: 'ta' },
  { pattern: /\bmaattirai\b/gi,                      replacement: 'tablet',                            lang: 'ta' },
  { pattern: /\biravu\b/gi,                          replacement: 'at night',                          lang: 'ta' },

  // ── Telugu ───────────────────────────────────────────────────────────
  { pattern: /\buddhanda[\s-]*rathri\b/gi,           replacement: 'Twice daily (Morning & Night)',     lang: 'te' },
  { pattern: /\bbhojanam[\s-]*taruvatha\b/gi,        replacement: 'after food',                        lang: 'te' },
  { pattern: /\bbhojanam[\s-]*mundhu\b/gi,           replacement: 'before food',                       lang: 'te' },
  { pattern: /\bjwaram\b(?!.*\bml\b)/gi,             replacement: 'fever',                             lang: 'te' },
  { pattern: /\bdaggu\b/gi,                          replacement: 'cough',                             lang: 'te' },
  { pattern: /\btalanostha\b/gi,                     replacement: 'headache',                          lang: 'te' },
  { pattern: /\bmathra\b/gi,                         replacement: 'tablet',                            lang: 'te' },
  { pattern: /\brathri[\s-]*lo\b/gi,                 replacement: 'at night',                          lang: 'te' },

  // ── Single-word fallbacks (must run AFTER multi-word phrases) ────────
  { pattern: /\bravile\b/gi,                         replacement: 'in the morning',                   lang: 'ml' },
  { pattern: /\brathri\b/gi,                         replacement: 'at night',                          lang: 'ml' },
  { pattern: /\bbekusiru\b|\bratri\b/gi,             replacement: 'at night',                          lang: 'kn' },
];

// ═══════════════════════════════════════════════════════════════════════════
// 2. LANGUAGE FINGERPRINTING
//    Keyword sets for detecting which regional languages appear in a transcript.
// ═══════════════════════════════════════════════════════════════════════════

const LANG_KEYWORDS = {
  hi: ['bukhar', 'khansi', 'sar dard', 'subah', 'shaam', 'khane ke baad', 'khane se pehle', 'rat ko', 'thakaan', 'din mein', 'baar', 'khaaye', 'leyi', 'badan dard', 'chakkar', 'ukhan', 'gale'],
  kn: ['belagge', 'mattu', 'ratri', 'ootada', 'nantara', 'munche', 'jvara', 'kemmu', 'mudde', 'bekusiru', 'tale novu', 'vamana'],
  ml: ['ravile', 'rathri', 'bhakshanathinu', 'shesham', 'munpu', 'jwaram', 'chumma', 'talavedana', 'gulika'],
  ta: ['kaalai', 'maalai', 'saapittathukku', 'apparam', 'munnadi', 'kaaychal', 'iramal', 'talaivaali', 'marundhu', 'maattirai', 'iravu'],
  te: ['uddhanda', 'bhojanam', 'taruvatha', 'mundhu', 'daggu', 'talanostha', 'mathra', 'rathri lo'],
};

// ═══════════════════════════════════════════════════════════════════════════
// 3. DRUG DATABASE
//    Common Indian OPD drugs with safe dose thresholds.
// ═══════════════════════════════════════════════════════════════════════════

export const KNOWN_DRUGS = [
  'paracetamol', 'acetaminophen', 'ibuprofen', 'diclofenac', 'naproxen',
  'aspirin', 'mefenamic acid', 'nimesulide', 'aceclofenac',
  'amoxicillin', 'ampicillin', 'co-amoxiclav', 'augmentin', 'cloxacillin',
  'azithromycin', 'clarithromycin', 'erythromycin', 'doxycycline',
  'ciprofloxacin', 'levofloxacin', 'ofloxacin', 'norfloxacin',
  'metronidazole', 'cefixime', 'cefuroxime', 'ceftriaxone', 'cephalexin',
  'cefadroxil', 'nitrofurantoin', 'cotrimoxazole', 'trimethoprim',
  'cetirizine', 'levocetirizine', 'fexofenadine', 'loratadine',
  'chlorpheniramine', 'promethazine', 'diphenhydramine', 'hydroxyzine',
  'ranitidine', 'famotidine', 'omeprazole', 'pantoprazole', 'rabeprazole',
  'esomeprazole', 'domperidone', 'ondansetron', 'metoclopramide',
  'metformin', 'glibenclamide', 'glipizide', 'glimepiride', 'sitagliptin',
  'amlodipine', 'atenolol', 'metoprolol', 'bisoprolol', 'carvedilol',
  'ramipril', 'enalapril', 'losartan', 'telmisartan', 'olmesartan',
  'hydrochlorothiazide', 'furosemide', 'spironolactone', 'chlorthalidone',
  'atorvastatin', 'rosuvastatin', 'simvastatin',
  'salbutamol', 'montelukast', 'theophylline', 'ipratropium',
  'prednisolone', 'dexamethasone', 'hydrocortisone', 'betamethasone',
  'clotrimazole', 'fluconazole', 'itraconazole', 'acyclovir', 'oseltamivir',
  'levothyroxine', 'carbamazepine', 'phenytoin', 'valproate', 'diazepam',
  'alprazolam', 'amitriptyline', 'sertraline', 'fluoxetine', 'escitalopram',
  'vitamin d', 'folic acid', 'ferrous sulfate', 'zinc', 'multivitamin',
  'calcium', 'iron', 'b complex', 'vitamin c', 'vitamin b12',
  'dextromethorphan', 'ambroxol', 'guaifenesin', 'bromhexine', 'chlorpheniramine',
];

// Dose safety thresholds (single dose in mg)
const DOSE_SAFETY = {
  'paracetamol':    { max: 1000, unit: 'mg', msg: 'Single dose > 1000 mg. Max recommended: 1000 mg per dose (4000 mg/day).' },
  'acetaminophen':  { max: 1000, unit: 'mg', msg: 'Single dose > 1000 mg. Max recommended: 1000 mg per dose.' },
  'ibuprofen':      { max: 800,  unit: 'mg', msg: 'Single dose > 800 mg. Max recommended: 800 mg per dose.' },
  'diclofenac':     { max: 100,  unit: 'mg', msg: 'Single dose > 100 mg. Max recommended: 100 mg per dose.' },
  'naproxen':       { max: 500,  unit: 'mg', msg: 'Single dose > 500 mg. Max recommended: 500 mg per dose.' },
  'aspirin':        { max: 1000, unit: 'mg', msg: 'Single dose > 1000 mg. Max recommended: 1000 mg analgesic dose.' },
  'nimesulide':     { max: 100,  unit: 'mg', msg: 'Single dose > 100 mg. Max recommended: 100 mg per dose.' },
  'metformin':      { max: 1000, unit: 'mg', msg: 'Single dose > 1000 mg. Typical max: 1000 mg per dose.' },
  'cetirizine':     { max: 10,   unit: 'mg', msg: 'Single dose > 10 mg (standard). Max: 20 mg/day for urticaria.' },
  'amoxicillin':    { max: 1000, unit: 'mg', msg: 'Single dose > 1000 mg. Typical max: 1000 mg per dose for severe infections.' },
  'azithromycin':   { max: 500,  unit: 'mg', msg: 'Single dose > 500 mg. Max recommended: 500 mg per dose.' },
  'ciprofloxacin':  { max: 750,  unit: 'mg', msg: 'Single dose > 750 mg. Max recommended: 750 mg per dose.' },
};

// Allergy family cross-referencing
const ALLERGY_FAMILIES = {
  'penicillin':     ['amoxicillin', 'ampicillin', 'piperacillin', 'penicillin', 'flucloxacillin', 'cloxacillin', 'co-amoxiclav', 'augmentin'],
  'amoxicillin':    ['amoxicillin', 'penicillin', 'ampicillin', 'piperacillin', 'co-amoxiclav', 'augmentin'],
  'ampicillin':     ['ampicillin', 'amoxicillin', 'penicillin', 'co-amoxiclav'],
  'sulfa':          ['sulfamethoxazole', 'cotrimoxazole', 'trimethoprim', 'bactrim', 'septran'],
  'sulfonamide':    ['sulfamethoxazole', 'cotrimoxazole', 'trimethoprim'],
  'nsaid':          ['ibuprofen', 'diclofenac', 'naproxen', 'mefenamic acid', 'nimesulide', 'aceclofenac', 'aspirin'],
  'aspirin':        ['aspirin', 'ibuprofen', 'diclofenac', 'naproxen', 'mefenamic acid', 'nimesulide'],
  'cephalosporin':  ['cefixime', 'cefuroxime', 'ceftriaxone', 'cephalexin', 'cefadroxil'],
  'fluoroquinolone':['ciprofloxacin', 'levofloxacin', 'ofloxacin', 'norfloxacin'],
  'tetracycline':   ['doxycycline', 'tetracycline', 'minocycline'],
  'macrolide':      ['azithromycin', 'clarithromycin', 'erythromycin'],
};

// ═══════════════════════════════════════════════════════════════════════════
// 4. FREQUENCY / TIMING PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const FREQUENCY_PATTERNS = [
  { regex: /\btwice\s+daily\s*\(morning\s*&\s*night\)/i,                                                         label: 'Twice daily (Morning & Night)' },
  { regex: /\bsos\b|\bprn\b|\bas\s+(?:and\s+when\s+)?needed\b|\bwhen\s+required\b|\bon\s+demand\b/i,              label: 'SOS (as needed)' },
  { regex: /\bstat\b|\bimmediately\b|\bsingle\s+dose\b|\bone[\s-]*time\s+dose\b/i,                                label: 'Stat (single dose)' },
  { regex: /\bonce\s+(?:a\s+)?(?:daily|day)\b|\bod\b(?!\w)|\bonce\s+daily\b|\bonce\s+in\s+(?:a\s+)?day\b/i,     label: 'Once daily (OD)' },
  { regex: /\btwice\s+(?:a\s+)?(?:daily|day)\b|\bbd\b(?!\w)|\bbid\b(?!\w)|\btwo\s+times\s+(?:a\s+)?day\b|\bmorning\s+(?:and|&)\s+(?:night|evening)\b/i, label: 'Twice daily (BD)' },
  { regex: /\bthrice\s+(?:a\s+)?(?:daily|day)\b|\btds\b(?!\w)|\btid\b(?!\w)|\bthree\s+times\s+(?:a\s+)?day\b/i,label: 'Thrice daily (TDS)' },
  { regex: /\bfour\s+times\s+(?:a\s+)?(?:day|daily)\b|\bqid\b(?!\w)|\bqds\b(?!\w)/i,                            label: 'Four times daily (QID)' },
  { regex: /\b(?:once\s+)?at\s+night\b|\bhs\b(?!\w)|\bnocte\b|\bon\b(?!\w)(?!\s*\d)(?!\s*exam)/i,              label: 'Once at night (ON/HS)' },
  { regex: /\bmorning\s+only\b|\bonce\s+in\s+(?:the\s+)?morning\b/i,                                            label: 'Morning (once)' },
  { regex: /\bevery\s+(\d+)\s+hours?\b/i,                                                                        label: (m) => `Every ${m[1]} hours` },
  { regex: /\bweekly\b|\bonce\s+a\s+week\b/i,                                                                   label: 'Once weekly' },
];

const TIMING_PATTERNS = [
  { regex: /\bafter\s+(?:food|meals?|eating)\b|\bpc\b(?!\w)|\bpost[\s-]?prandial\b/i,  label: 'After food (PC)' },
  { regex: /\bbefore\s+(?:food|meals?|eating)\b|\bac\b(?!\w)|\bpre[\s-]?prandial\b/i,  label: 'Before food (AC)' },
  { regex: /\bwith\s+(?:food|meals?)\b/i,                                                label: 'With food' },
  { regex: /\bon\s+empty\s+stomach\b/i,                                                  label: 'Empty stomach' },
];

const DURATION_PATTERNS = [
  { regex: /for\s+(\d+)\s+days?/i,   extract: (m) => `${m[1]} day${Number(m[1]) !== 1 ? 's' : ''}` },
  { regex: /for\s+(\d+)\s+weeks?/i,  extract: (m) => `${m[1]} week${Number(m[1]) !== 1 ? 's' : ''}` },
  { regex: /for\s+(\d+)\s+months?/i, extract: (m) => `${m[1]} month${Number(m[1]) !== 1 ? 's' : ''}` },
  { regex: /(\d+)[\s-]+days?\s+course/i, extract: (m) => `${m[1]} days` },
  { regex: /(\d+)[\s-]+day\s+(?:supply|dose)/i, extract: (m) => `${m[1]} days` },
  { regex: /(?:×|x)\s*(\d+)\s*(?:days?|d)/i, extract: (m) => `${m[1]} days` },
];

// ═══════════════════════════════════════════════════════════════════════════
// 5. CHIEF COMPLAINTS DICTIONARY
// ═══════════════════════════════════════════════════════════════════════════

const COMPLAINT_KEYWORDS = [
  'fever', 'cough', 'cold', 'headache', 'sore throat', 'throat pain',
  'body ache', 'body pain', 'myalgia', 'arthralgia', 'joint pain',
  'abdominal pain', 'stomach pain', 'stomach ache', 'nausea', 'vomiting',
  'diarrhea', 'diarrhoea', 'constipation', 'loose stools', 'dysentery',
  'chest pain', 'chest tightness', 'shortness of breath', 'breathlessness', 'sob',
  'fatigue', 'weakness', 'tiredness', 'malaise', 'lethargy',
  'dizziness', 'vertigo', 'giddiness', 'fainting', 'syncope',
  'rash', 'skin rash', 'itching', 'pruritus', 'urticaria', 'hives',
  'ear pain', 'earache', 'otalgia', 'ear discharge',
  'eye redness', 'conjunctivitis', 'eye discharge', 'eye pain',
  'back pain', 'backache', 'lower back pain', 'lumbago',
  'neck pain', 'stiffness', 'ankle swelling', 'pedal edema',
  'urinary symptoms', 'burning micturition', 'frequency', 'dysuria',
  'running nose', 'rhinorrhoea', 'sneezing', 'nasal congestion',
  'loss of appetite', 'anorexia', 'weight loss', 'night sweats',
  'palpitations', 'tachycardia', 'irregular heartbeat',
  'swelling', 'edema', 'bloating', 'gas', 'flatulence', 'indigestion',
  'heartburn', 'acid reflux', 'gerd', 'regurgitation',
  'insomnia', 'sleep disturbance', 'anxiety', 'depression',
  'toothache', 'dental pain', 'jaw pain',
  'muscle cramps', 'spasms', 'numbness', 'tingling', 'burning sensation',
  'painful swallowing', 'dysphagia', 'hoarseness', 'voice change',
  'leg pain', 'knee pain', 'shoulder pain',
];

// ═══════════════════════════════════════════════════════════════════════════
// 6. REGIONAL DOSING TRANSLATION TABLE
//    Patient-facing dosing instructions in 6 languages.
// ═══════════════════════════════════════════════════════════════════════════

export const DOSING_TRANSLATIONS = {
  English: {
    'twice daily (morning & night)': 'Twice daily — Morning & Night',
    'twice daily (bd)':              'Twice daily (BD)',
    'twice daily':                   'Twice daily',
    'thrice daily (tds)':            'Three times daily (TDS)',
    'thrice daily':                  'Three times daily',
    'once daily (od)':               'Once daily (OD)',
    'once daily':                    'Once daily',
    'once at night (on/hs)':         'Once at night',
    'sos (as needed)':               'When needed (SOS)',
    'stat (single dose)':            'Single dose immediately',
    'four times daily (qid)':        'Four times daily',
    'after food (pc)':               'After food',
    'before food (ac)':              'Before food',
    'with food':                     'With food',
    'empty stomach':                 'On empty stomach',
    'morning (once)':                'Morning (once)',
    'tablet':                        'Tablet',
    'days':                          'days',
  },
  Hindi: {
    'twice daily (morning & night)': 'दिन में दो बार — सुबह और रात',
    'twice daily (bd)':              'दिन में दो बार (बी.डी.)',
    'twice daily':                   'दिन में दो बार',
    'thrice daily (tds)':            'दिन में तीन बार (टी.डी.एस.)',
    'thrice daily':                  'दिन में तीन बार',
    'once daily (od)':               'दिन में एक बार',
    'once daily':                    'दिन में एक बार',
    'once at night (on/hs)':         'रात को एक बार',
    'sos (as needed)':               'ज़रूरत पड़ने पर',
    'stat (single dose)':            'एकल खुराक अभी',
    'four times daily (qid)':        'दिन में चार बार',
    'after food (pc)':               'खाने के बाद',
    'before food (ac)':              'खाने से पहले',
    'with food':                     'खाने के साथ',
    'empty stomach':                 'खाली पेट',
    'morning (once)':                'सुबह (एक बार)',
    'tablet':                        'गोली',
    'days':                          'दिन',
  },
  Kannada: {
    'twice daily (morning & night)': 'ದಿನಕ್ಕೆ ಎರಡು ಬಾರಿ — ಬೆಳಿಗ್ಗೆ ಮತ್ತು ರಾತ್ರಿ',
    'twice daily (bd)':              'ದಿನಕ್ಕೆ ಎರಡು ಬಾರಿ (ಬಿ.ಡಿ.)',
    'twice daily':                   'ದಿನಕ್ಕೆ ಎರಡು ಬಾರಿ',
    'thrice daily (tds)':            'ದಿನಕ್ಕೆ ಮೂರು ಬಾರಿ (ಟಿ.ಡಿ.ಎಸ್.)',
    'thrice daily':                  'ದಿನಕ್ಕೆ ಮೂರು ಬಾರಿ',
    'once daily (od)':               'ದಿನಕ್ಕೆ ಒಮ್ಮೆ',
    'once daily':                    'ದಿನಕ್ಕೆ ಒಮ್ಮೆ',
    'once at night (on/hs)':         'ರಾತ್ರಿ ಒಮ್ಮೆ',
    'sos (as needed)':               'ಅಗತ್ಯವಿದ್ದಾಗ',
    'stat (single dose)':            'ಏಕ ಪ್ರಮಾಣ ಈಗಲೇ',
    'four times daily (qid)':        'ದಿನಕ್ಕೆ ನಾಲ್ಕು ಬಾರಿ',
    'after food (pc)':               'ಊಟದ ನಂತರ',
    'before food (ac)':              'ಊಟದ ಮೊದಲು',
    'with food':                     'ಊಟದ ಜೊತೆ',
    'empty stomach':                 'ಖಾಲಿ ಹೊಟ್ಟೆಯಲ್ಲಿ',
    'morning (once)':                'ಬೆಳಿಗ್ಗೆ (ಒಮ್ಮೆ)',
    'tablet':                        'ಮಾತ್ರೆ',
    'days':                          'ದಿನಗಳು',
  },
  Malayalam: {
    'twice daily (morning & night)': 'ദിവസം രണ്ടുതവണ — രാവിലെ & രാത്രി',
    'twice daily (bd)':              'ദിവസം രണ്ടുതവണ (ബി.ഡി.)',
    'twice daily':                   'ദിവസം രണ്ടുതവണ',
    'thrice daily (tds)':            'ദിവസം മൂന്നുതവണ (ടി.ഡി.എസ്.)',
    'thrice daily':                  'ദിവസം മൂന്നുതവണ',
    'once daily (od)':               'ദിവസം ഒരു തവണ',
    'once daily':                    'ദിവസം ഒരു തവണ',
    'once at night (on/hs)':         'രാത്രി ഒരു തവണ',
    'sos (as needed)':               'ആവശ്യമുള്ളപ്പോൾ',
    'stat (single dose)':            'ഒറ്റ ഡോസ് ഇപ്പോൾ',
    'four times daily (qid)':        'ദിവസം നാലുതവണ',
    'after food (pc)':               'ഭക്ഷണം കഴിച്ച ശേഷം',
    'before food (ac)':              'ഭക്ഷണത്തിന് മുൻപ്',
    'with food':                     'ഭക്ഷണത്തോടൊപ്പം',
    'empty stomach':                 'വെറും വയറ്റിൽ',
    'morning (once)':                'രാവിലെ (ഒരു തവണ)',
    'tablet':                        'ഗുളിക',
    'days':                          'ദിവസം',
  },
  Tamil: {
    'twice daily (morning & night)': 'தினமும் இரண்டு முறை — காலை & இரவு',
    'twice daily (bd)':              'தினமும் இரண்டு முறை (பி.டி.)',
    'twice daily':                   'தினமும் இரண்டு முறை',
    'thrice daily (tds)':            'தினமும் மூன்று முறை (டி.டி.எஸ்.)',
    'thrice daily':                  'தினமும் மூன்று முறை',
    'once daily (od)':               'தினமும் ஒரு முறை',
    'once daily':                    'தினமும் ஒரு முறை',
    'once at night (on/hs)':         'இரவு ஒரு முறை',
    'sos (as needed)':               'தேவைப்படும்போது',
    'stat (single dose)':            'ஒற்றை டோஸ் இப்போது',
    'four times daily (qid)':        'தினமும் நான்கு முறை',
    'after food (pc)':               'சாப்பிட்டதற்கு பிறகு',
    'before food (ac)':              'சாப்பிடுவதற்கு முன்',
    'with food':                     'சாப்பாட்டுடன்',
    'empty stomach':                 'வெறும் வயிற்றில்',
    'morning (once)':                'காலையில் (ஒரு முறை)',
    'tablet':                        'மாத்திரை',
    'days':                          'நாட்கள்',
  },
  Telugu: {
    'twice daily (morning & night)': 'రోజుకు రెండుసార్లు — ఉదయం & రాత్రి',
    'twice daily (bd)':              'రోజుకు రెండుసార్లు (బి.డి.)',
    'twice daily':                   'రోజుకు రెండుసార్లు',
    'thrice daily (tds)':            'రోజుకు మూడుసార్లు (టి.డి.ఎస్.)',
    'thrice daily':                  'రోజుకు మూడుసార్లు',
    'once daily (od)':               'రోజుకు ఒకసారి',
    'once daily':                    'రోజుకు ఒకసారి',
    'once at night (on/hs)':         'రాత్రి ఒకసారి',
    'sos (as needed)':               'అవసరమైనప్పుడు',
    'stat (single dose)':            'ఒకే డోసు ఇప్పుడే',
    'four times daily (qid)':        'రోజుకు నాలుగుసార్లు',
    'after food (pc)':               'భోజనం తర్వాత',
    'before food (ac)':              'భోజనానికి ముందు',
    'with food':                     'భోజనంతో పాటు',
    'empty stomach':                 'ఖాళీ కడుపుతో',
    'morning (once)':                'ఉదయం (ఒకసారి)',
    'tablet':                        'మాత్ర',
    'days':                          'రోజులు',
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// 7. HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/** Normalize frequency label to lower-case key for translation lookup */
function freqKey(label) {
  return label ? label.toLowerCase().replace(/[()]/g, '').trim() : '';
}

/** Translate a frequency + timing + duration string into a target language */
export function translateDosingInstruction(med, targetLang) {
  const table = DOSING_TRANSLATIONS[targetLang] || DOSING_TRANSLATIONS['English'];
  const englishTable = DOSING_TRANSLATIONS['English'];

  const normalizeKey = (s) => s.toLowerCase().replace(/[()]/g, '').replace(/\s+/g, ' ').trim();

  const translateToken = (token) => {
    const key = normalizeKey(token);
    // Build normalized lookup over table
    const entries = Object.entries(table).map(([k, v]) => [normalizeKey(k), v]);
    const exact = entries.find(([k]) => k === key);
    if (exact) return exact[1];
    // Partial match (prefer longest matching key)
    const partial = entries
      .filter(([k]) => key.includes(k) || k.includes(key))
      .sort((a, b) => b[0].length - a[0].length);
    if (partial.length > 0) return partial[0][1];
    // Fallback to English
    const enEntries = Object.entries(englishTable).map(([k, v]) => [normalizeKey(k), v]);
    const enExact = enEntries.find(([k]) => k === key);
    if (enExact) return enExact[1];
    const enPartial = enEntries.find(([k]) => key.includes(k) || k.includes(key));
    if (enPartial) return enPartial[1];
    return token;
  };

  const freqTranslated  = med.frequency ? translateToken(freqKey(med.frequency)) : '';
  const timingTranslated = med.timing   ? translateToken(freqKey(med.timing))    : '';
  const daysLabel        = table['days'] || 'days';
  const tabletLabel      = table['tablet'] || 'Tablet';
  const durationStr      = med.duration ? med.duration.replace(/days?/gi, daysLabel).replace(/weeks?/gi, targetLang === 'English' ? 'weeks' : daysLabel) : '';

  const parts = [freqTranslated, timingTranslated, durationStr ? `× ${durationStr}` : ''].filter(Boolean);
  const doseStr = med.dose != null ? `${med.dose}${med.doseUnit || ''}` : '';
  const header = [med.name, doseStr].filter(Boolean).join(' ');
  return `${header} (${tabletLabel})${parts.length ? ` — ${parts.join(', ')}` : ''}`;
}

/** Generate a WhatsApp/SMS–friendly dosage message */
export function generateWhatsAppMessage(emr, lang) {
  const lines = [`*VoxCare Prescription — ${new Date().toLocaleDateString('en-IN')}*`];
  if (emr.patient?.age || emr.patient?.gender) {
    lines.push(`👤 Patient: ${emr.patient.age || ''}${emr.patient.gender || ''}`);
  }
  if (emr.diagnosis) lines.push(`🩺 Diagnosis: ${emr.diagnosis}`);
  lines.push('');
  lines.push('💊 *Medications:*');
  emr.medications.forEach((med, i) => {
    const instruction = translateDosingInstruction(med, lang);
    lines.push(`${i + 1}. ${instruction}`);
  });
  if (emr.followUp) lines.push(`\n📅 Follow-up: ${emr.followUp}`);
  lines.push('\n_Generated by VoxCare — Voice-first Clinical Assistant_');
  return lines.join('\n');
}

// ═══════════════════════════════════════════════════════════════════════════
// 8. LANGUAGE DETECTION
// ═══════════════════════════════════════════════════════════════════════════

function detectLanguages(text) {
  const lower = text.toLowerCase();
  const detected = new Set(['en-IN']); // Always includes Indian English base
  for (const [lang, keywords] of Object.entries(LANG_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        detected.add(lang);
        break;
      }
    }
  }
  return [...detected];
}

// ═══════════════════════════════════════════════════════════════════════════
// 9. TEXT NORMALIZATION
// ═══════════════════════════════════════════════════════════════════════════

function normalizeTranscript(text) {
  let normalized = text;
  for (const rule of MULTILINGUAL_RULES) {
    normalized = normalized.replace(rule.pattern, rule.replacement);
  }
  return normalized;
}

// ═══════════════════════════════════════════════════════════════════════════
// 10. PATIENT DEMOGRAPHICS EXTRACTION
// ═══════════════════════════════════════════════════════════════════════════

function extractPatient(text) {
  const patient = {};

  // Age/gender combos: "29F", "45 M", "29/F", "29 year old female"
  const ageGenderPatterns = [
    /\b(\d{1,3})\s*\/?\s*(F|M|female|male)\b/i,
    /\b(F|M|female|male)\s*\/?\s*(\d{1,3})\b/i,
    /\b(\d{1,3})[\s-]*(?:year|yr)s?[\s-]*old[\s-]*(female|male|woman|man|lady|gentleman|girl|boy)?\b/i,
  ];

  for (const pattern of ageGenderPatterns) {
    const m = text.match(pattern);
    if (m) {
      const ageStr  = m[1] && /\d/.test(m[1]) ? m[1] : m[2];
      const genStr  = m[1] && /[a-z]/i.test(m[1]) ? m[1] : m[2];
      if (ageStr && Number(ageStr) > 0 && Number(ageStr) < 120) {
        patient.age = Number(ageStr);
      }
      if (genStr) {
        const g = genStr.toLowerCase();
        patient.gender = /f|female|woman|lady|girl/.test(g) ? 'F' : 'M';
      }
      break;
    }
  }

  // Name extraction: "Patient John / Mr. John / Mrs. Priya"
  const nameMatch = text.match(/\b(?:patient|mr\.?|mrs\.?|ms\.?|dr\.?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/);
  if (nameMatch) patient.name = nameMatch[1];

  return patient;
}

// ═══════════════════════════════════════════════════════════════════════════
// 11. VITALS EXTRACTION
// ═══════════════════════════════════════════════════════════════════════════

function extractVitals(text) {
  const vitals = {};

  // Blood Pressure: 118/76, 118/76 mmHg (sanity check systolic/diastolic range)
  const bpMatch = text.match(/\b(\d{2,3})\s*[\/\\]\s*(\d{2,3})\s*(?:mm\s*hg|mmhg)?\b/i);
  if (bpMatch) {
    const sys = Number(bpMatch[1]);
    const dia = Number(bpMatch[2]);
    if (sys >= 60 && sys <= 260 && dia >= 30 && dia <= 160 && sys > dia) {
      vitals.bp = { sys, dia };
    }
  }

  // Temperature: require explicit "temp/temperature" prefix or ° symbol or plausible fever/body temp range
  const tempMatch =
    text.match(/\btemp(?:erature)?\s*[:\s]*(\d{2,3}(?:\.\d+)?)\s*°?\s*(F|C|fahrenheit|celsius)\b/i) ||
    text.match(/\b(\d{2,3}(?:\.\d+)?)\s*°\s*(F|C|fahrenheit|celsius)\b/i) ||
    text.match(/\b(9[4-9](?:\.\d+)?|10[0-8](?:\.\d+)?)\s*(F|fahrenheit)\b/i) ||
    text.match(/\b(3[4-9](?:\.\d+)?|4[0-3](?:\.\d+)?)\s*(C|celsius)\b/i);
  if (tempMatch) {
    vitals.temp = {
      value: parseFloat(tempMatch[1]),
      unit: tempMatch[2].toUpperCase() === 'C' || tempMatch[2].toLowerCase() === 'celsius' ? 'C' : 'F',
    };
  }

  // Pulse / Heart Rate
  const pulseMatch = text.match(/\b(?:pulse|hr|heart\s*rate)\s*[:\s]*(\d{2,3})\b/i);
  if (pulseMatch) vitals.pulse = Number(pulseMatch[1]);

  // SpO2
  const spo2Match = text.match(/\b(?:spo2|oxygen\s*saturation|sat)\s*[:\s]*(\d{2,3})\s*%?\b/i);
  if (spo2Match) vitals.spo2 = Number(spo2Match[1]);

  // Weight
  const wtMatch = text.match(/\b(?:weight|wt)\s*[:\s]*(\d{2,3}(?:\.\d)?)\s*(?:kg|kilograms?)?\b/i);
  if (wtMatch) vitals.weight = `${wtMatch[1]} kg`;

  return vitals;
}

// ═══════════════════════════════════════════════════════════════════════════
// 12. CHIEF COMPLAINTS EXTRACTION
// ═══════════════════════════════════════════════════════════════════════════

function extractComplaints(normalizedText) {
  const lower = normalizedText.toLowerCase();
  const found = [];
  for (const complaint of COMPLAINT_KEYWORDS) {
    if (lower.includes(complaint)) {
      // Capitalize each word
      const title = complaint.replace(/\b\w/g, c => c.toUpperCase());
      found.push(title);
    }
  }
  return [...new Set(found)]; // deduplicate
}

// ═══════════════════════════════════════════════════════════════════════════
// 13. DIAGNOSIS EXTRACTION
// ═══════════════════════════════════════════════════════════════════════════

function extractDiagnosis(text) {
  const diagPatterns = [
    /\bdiagnosis\s*[:—-]\s*(.+?)(?:\.|$)/im,
    /\bimpression\s*[:—-]\s*(.+?)(?:\.|$)/im,
    /\bassessment\s*[:—-]\s*(.+?)(?:\.|$)/im,
    /\bc\/?\s*case\s*of\s+(.+?)(?:\.|$)/im,
    /\bcase\s+of\s+(.+?)(?:\.|$)/im,
    /\bprovisional\s+diagnosis\s*[:—-]\s*(.+?)(?:\.|$)/im,
    /\bworking\s+diagnosis\s*[:—-]\s*(.+?)(?:\.|$)/im,
  ];
  for (const p of diagPatterns) {
    const m = text.match(p);
    if (m && m[1] && m[1].trim().length > 2) {
      return m[1].trim().replace(/\s+/g, ' ');
    }
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// 14. FOLLOW-UP EXTRACTION
// ═══════════════════════════════════════════════════════════════════════════

function extractFollowUp(text) {
  const m = text.match(/\bfollow[\s-]*up\s+(?:after\s+)?(.+?)(?:\.|if|$)/im);
  if (m && m[1]) return m[1].trim();
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// 15. ALLERGY EXTRACTION FROM TRANSCRIPT
// ═══════════════════════════════════════════════════════════════════════════

function extractAllergiesFromText(text) {
  const allergies = [];
  const allergyPatterns = [
    /\bknown\s+allerg(?:y|ic)\s+to\s+([^.]+?)(?:\.|and\s+(?!\w)|\n|$)/gi,
    /\ballergic?\s+to\s+([^.]+?)(?:\.|$)/gi,
    /\ballerg(?:y|ies)\s*[:]\s*([^.]+?)(?:\.|$)/gi,
  ];
  for (const pattern of allergyPatterns) {
    let m;
    while ((m = pattern.exec(text)) !== null) {
      const parts = m[1].split(/,|\sand\s/);
      for (const part of parts) {
        const cleaned = part.trim().replace(/\(.*?\)/g, '').trim();
        if (cleaned.length > 1 && cleaned.length < 50 && !/\b(nkda|no\s+known)\b/i.test(cleaned)) {
          allergies.push(cleaned);
        }
      }
    }
  }
  return [...new Set(allergies)];
}

// ═══════════════════════════════════════════════════════════════════════════
// 16. MEDICATION EXTRACTION
// ═══════════════════════════════════════════════════════════════════════════

function buildDrugRegex() {
  // Sort by length desc so longer names (co-amoxiclav) match before shorter ones (amoxicillin)
  const sorted = [...KNOWN_DRUGS].sort((a, b) => b.length - a.length);
  const escaped = sorted.map(d => d.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'));
  return new RegExp(
    `(?:(?:tab(?:let)?|cap(?:sule)?|inj(?:ection)?|syrup|susp(?:ension)?|oint(?:ment)?|drop|gel|cream|liq(?:uid)?)\\s+)?\\b(${escaped.join('|')})\\b`,
    'gi'
  );
}

function extractDoseUnit(text) {
  const m = text.match(/\b(\d+(?:\.\d+)?)\s*(mg|mcg|µg|ml|g|IU|units?|mmol)\b/i);
  if (m) return { dose: parseFloat(m[1]), doseUnit: m[2].toLowerCase() };
  return { dose: null, doseUnit: null };
}

function extractFrequency(text) {
  for (const p of FREQUENCY_PATTERNS) {
    const m = text.match(p.regex);
    if (m) return typeof p.label === 'function' ? p.label(m) : p.label;
  }
  return null;
}

function extractTiming(text) {
  for (const p of TIMING_PATTERNS) {
    if (p.regex.test(text)) return p.label;
  }
  return null;
}

function extractDuration(text) {
  for (const p of DURATION_PATTERNS) {
    const m = text.match(p.regex);
    if (m) return p.extract(m);
  }
  return null;
}

function extractMedications(normalizedText) {
  const drugRegex = buildDrugRegex();
  const matches = [];
  let match;

  while ((match = drugRegex.exec(normalizedText)) !== null) {
    matches.push({
      drugName: match[1],
      index: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  const medications = [];

  for (let i = 0; i < matches.length; i++) {
    const curr = matches[i];
    const prevEnd = i > 0 ? matches[i - 1].endIndex : 0;
    const nextStart = i + 1 < matches.length ? matches[i + 1].index : normalizedText.length;

    // Look back on the same line (up to previous drug or start of line) for pre-drug cues like "Twice daily (Morning & Night)"
    const lineStart = Math.max(prevEnd, normalizedText.lastIndexOf('\n', curr.index) + 1);
    const lineEndIdx = normalizedText.indexOf('\n', curr.endIndex);
    const lineEnd = lineEndIdx === -1 ? nextStart : Math.min(nextStart, lineEndIdx);

    const beforeWindow = normalizedText.slice(lineStart, curr.index);
    const afterWindow  = normalizedText.slice(curr.index, Math.min(lineEnd, curr.index + 180));
    // Prioritize post-drug text for dose/duration/frequency, falling back to pre-drug text on the same line
    const fullContext = `${afterWindow} ${beforeWindow}`;

    const { dose, doseUnit } = extractDoseUnit(afterWindow.trim() ? afterWindow : fullContext);
    const frequency = extractFrequency(afterWindow) || extractFrequency(beforeWindow);
    const timing    = extractTiming(afterWindow)    || extractTiming(beforeWindow);
    const duration  = extractDuration(afterWindow)  || extractDuration(beforeWindow);

    // Avoid duplicates (same drug mentioned twice)
    const exists = medications.some(m => m.name.toLowerCase() === curr.drugName.toLowerCase());
    if (!exists) {
      medications.push({
        id: `med-${medications.length}`,
        name: curr.drugName.charAt(0).toUpperCase() + curr.drugName.slice(1).toLowerCase(),
        dose,
        doseUnit,
        frequency,
        timing,
        duration,
        verified: false,
        allergyConflict: false,
        doseWarning: false,
      });
    }
  }
  return medications;
}

// ═══════════════════════════════════════════════════════════════════════════
// 17. SAFETY CHECKS
// ═══════════════════════════════════════════════════════════════════════════

function checkAllergyConflicts(medications, allergyList) {
  const conflicts = [];
  for (const med of medications) {
    const medNameLower = med.name.toLowerCase();
    for (const allergy of allergyList) {
      const allergyLower = allergy.toLowerCase().trim();
      // Direct name match
      if (medNameLower === allergyLower || medNameLower.includes(allergyLower) || allergyLower.includes(medNameLower)) {
        const conflict = { med: med.name, allergen: allergy, severity: 'HIGH', reason: 'Direct allergen match' };
        conflicts.push(conflict);
        med.allergyConflict = true;
        break;
      }
      // Cross-reference family lookup
      const familyMeds = ALLERGY_FAMILIES[allergyLower] || [];
      if (familyMeds.includes(medNameLower)) {
        const conflict = { med: med.name, allergen: allergy, severity: 'HIGH', reason: `${med.name} belongs to the ${allergy} drug family` };
        conflicts.push(conflict);
        med.allergyConflict = true;
        break;
      }
      // Check if allergy is a drug in a family containing the medication
      for (const [familyKey, familyMembers] of Object.entries(ALLERGY_FAMILIES)) {
        if (familyMembers.includes(allergyLower) && familyMembers.includes(medNameLower) && allergyLower !== medNameLower) {
          const conflict = { med: med.name, allergen: allergy, severity: 'MEDIUM', reason: `Both ${med.name} and ${allergy} are in the ${familyKey} family` };
          conflicts.push(conflict);
          med.allergyConflict = true;
          break;
        }
      }
    }
  }
  return conflicts;
}

function checkDoseSafety(medications) {
  const warnings = [];
  for (const med of medications) {
    const threshold = DOSE_SAFETY[med.name.toLowerCase()];
    if (threshold && med.dose && med.doseUnit) {
      const normalizedUnit = med.doseUnit.toLowerCase().replace('mcg', 'mg').replace('µg', 'mg');
      if (normalizedUnit === threshold.unit.toLowerCase() && med.dose > threshold.max) {
        const warning = {
          med: med.name,
          prescribedDose: `${med.dose} ${med.doseUnit}`,
          maxDose: `${threshold.max} ${threshold.unit}`,
          message: threshold.msg,
        };
        warnings.push(warning);
        med.doseWarning = true;
      }
    }
  }
  return warnings;
}

function detectNoisyClinic(rawText) {
  return /\[NOISY\s*CLINIC\]/i.test(rawText) || /noisy\s+clinic/i.test(rawText);
}

// ═══════════════════════════════════════════════════════════════════════════
// 18. VOICE EDIT COMMAND PARSER
// ═══════════════════════════════════════════════════════════════════════════

export function runVoiceEditCommand(command, currentEMR) {
  if (!command || !currentEMR) return { emr: currentEMR, message: 'No command or data to edit.' };

  const cmd = command.toLowerCase().trim();
  let emr = JSON.parse(JSON.stringify(currentEMR)); // deep clone
  let message = '';

  // Pattern: "change/update X to Y days" (duration)
  const durationMatch = cmd.match(/(?:change|update|set)\s+(.+?)\s+(?:duration\s+)?to\s+(\d+)\s+days?/i);
  if (durationMatch) {
    const drugName = durationMatch[1].trim();
    const newDuration = `${durationMatch[2]} days`;
    const med = emr.medications.find(m => m.name.toLowerCase().includes(drugName.toLowerCase()));
    if (med) {
      med.duration = newDuration;
      message = `Updated ${med.name} duration to ${newDuration}.`;
    } else {
      message = `Medication "${drugName}" not found.`;
    }
    return { emr, message };
  }

  // Pattern: "change X dose to Y mg"
  const doseMatch = cmd.match(/(?:change|update|set)\s+(.+?)\s+(?:dose\s+)?to\s+(\d+(?:\.\d+)?)\s*(mg|mcg|ml|g)?/i);
  if (doseMatch && !durationMatch) {
    const drugName = doseMatch[1].trim();
    const newDose = parseFloat(doseMatch[2]);
    const newUnit = doseMatch[3] || '';
    const med = emr.medications.find(m => m.name.toLowerCase().includes(drugName.toLowerCase()));
    if (med) {
      med.dose = newDose;
      if (newUnit) med.doseUnit = newUnit;
      med.verified = false;
      med.doseWarning = false;
      emr.doseWarnings = checkDoseSafety(emr.medications);
      emr.printEnabled = !emr.medications.some(m => (m.allergyConflict || m.doseWarning) && !m.verified);
      message = `Updated ${med.name} dose to ${newDose}${med.doseUnit || ''}.`;
    } else {
      message = `Medication "${drugName}" not found.`;
    }
    return { emr, message };
  }

  // Pattern: "remove X" (complaint or medication)
  const removeMatch = cmd.match(/remove\s+(.+)/i);
  if (removeMatch) {
    const target = removeMatch[1].trim();
    // Try medications first
    const medIdx = emr.medications.findIndex(m => m.name.toLowerCase().includes(target.toLowerCase()));
    if (medIdx >= 0) {
      const removed = emr.medications.splice(medIdx, 1)[0];
      emr.allergyConflicts = checkAllergyConflicts(emr.medications, emr.allAllergies || []);
      emr.doseWarnings = checkDoseSafety(emr.medications);
      emr.printEnabled = !emr.medications.some(m => (m.allergyConflict || m.doseWarning) && !m.verified);
      message = `Removed medication ${removed.name}.`;
      return { emr, message };
    }
    // Try complaints
    const complaintIdx = emr.chiefComplaints.findIndex(c => c.toLowerCase().includes(target.toLowerCase()));
    if (complaintIdx >= 0) {
      const removed = emr.chiefComplaints.splice(complaintIdx, 1)[0];
      message = `Removed complaint "${removed}".`;
      return { emr, message };
    }
    message = `"${target}" not found in medications or complaints.`;
    return { emr, message };
  }

  // Pattern: "add X to complaints"
  const addComplaintMatch = cmd.match(/add\s+(.+?)\s+(?:to\s+)?(?:complaints?|symptoms?)/i);
  if (addComplaintMatch) {
    const complaint = addComplaintMatch[1].trim().replace(/\b\w/g, c => c.toUpperCase());
    if (!emr.chiefComplaints.includes(complaint)) {
      emr.chiefComplaints.push(complaint);
      message = `Added "${complaint}" to complaints.`;
    } else {
      message = `"${complaint}" already listed.`;
    }
    return { emr, message };
  }

  // Pattern: "set diagnosis to X"
  const diagMatch = cmd.match(/(?:set|change|update)\s+diagnosis\s+to\s+(.+)/i);
  if (diagMatch) {
    emr.diagnosis = diagMatch[1].trim();
    message = `Diagnosis updated to "${emr.diagnosis}".`;
    return { emr, message };
  }

  // Pattern: "verify X" (mark medication as verified)
  const verifyMatch = cmd.match(/verify\s+(.+)/i);
  if (verifyMatch) {
    const target = verifyMatch[1].trim();
    const med = emr.medications.find(m => m.name.toLowerCase().includes(target.toLowerCase()));
    if (med) {
      med.verified = true;
      emr.printEnabled = !emr.medications.some(m => (m.allergyConflict || m.doseWarning) && !m.verified);
      message = `${med.name} marked as verified.`;
    } else {
      message = `Medication "${target}" not found.`;
    }
    return { emr, message };
  }

  message = 'Command not recognized. Try: "Change Cetirizine to 5 days", "Remove body ache", "Set diagnosis to Viral URTI".';
  return { emr, message };
}

// ═══════════════════════════════════════════════════════════════════════════
// 19. MAIN PARSER ENTRY POINT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * parseTranscript(rawText, allergyList)
 *
 * Parses a raw OPD clinical transcript (may be code-mixed) and returns
 * a fully structured EMR object with safety flags.
 *
 * @param {string} rawText      - Raw transcript from voice or typed input
 * @param {string[]} allergyList - Doctor-recorded patient allergies
 * @returns {Object} EMR object
 */
export function parseTranscript(rawText, allergyList = []) {
  if (!rawText || !rawText.trim()) {
    return null;
  }

  // Step 1: Detect languages in raw text (before normalization)
  const detectedLanguages = detectLanguages(rawText);

  // Step 2: Normalize multilingual terms → English equivalents
  const normalizedText = normalizeTranscript(rawText);

  // Step 3: Extract all clinical fields from normalized text
  const patient          = extractPatient(normalizedText);
  const vitals           = extractVitals(normalizedText);
  const chiefComplaints  = extractComplaints(normalizedText);
  const diagnosis        = extractDiagnosis(normalizedText);
  const followUp         = extractFollowUp(normalizedText);
  const medications      = extractMedications(normalizedText);

  // Step 4: Extract allergies mentioned in transcript, merge with doctor-supplied list
  const transcriptAllergies = extractAllergiesFromText(normalizedText);
  const allAllergies = [...new Set([...allergyList, ...transcriptAllergies])];

  // Step 5: Safety checks
  const allergyConflicts = checkAllergyConflicts(medications, allAllergies);
  const doseWarnings     = checkDoseSafety(medications);
  const noisyClinic      = detectNoisyClinic(rawText);

  // Step 6: Determine overall print-ready status
  const hasUnverifiedWarnings = medications.some(m => (m.allergyConflict || m.doseWarning) && !m.verified);

  return {
    languages:        detectedLanguages,
    patient,
    vitals,
    chiefComplaints,
    diagnosis,
    followUp,
    medications,
    allergyConflicts,
    doseWarnings,
    noisyClinic,
    allAllergies,
    printEnabled:     !hasUnverifiedWarnings,
    rawTranscript:    rawText,
    normalizedTranscript: normalizedText,
    parsedAt:         new Date().toISOString(),
  };
}

