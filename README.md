# VoxCare — Voice-First OPD Clinical Documentation & Rx Assistant

**VoxCare** is a zero-API-key, voice-first clinical documentation and prescription assistant built for Indian outpatient clinics (OPDs) and Primary Health Centers (PHCs), designed to work seamlessly with **Wispr Flow** desktop/mobile dictation and the Web Speech API (`en-IN`).

---

## Key Capabilities

- **Zero Secret Keys Required**: Runs 100% locally in the browser using deterministic clinical regex + lookup NLP (`src/utils/clinicalParser.js`). Displays a live **"Zero-Key Local Clinical NLP Active"** status badge in the top bar.
- **Multilingual Code-Mixed Normalization**: Detects and normalizes Indian English (`en-IN`) mixed with **Hindi**, **Kannada**, **Malayalam**, **Tamil**, and **Telugu** clinical and dosing cues while preserving the raw transcript.
- **3-Panel Single-Page OPD Workspace**:
  1. **Voice Consultation Capture**: Web Speech API dictation (`en-IN`), Wispr Flow-compatible textarea, *Retry Last Segment* undo, editable *Recorded Patient Allergies* tag list, and 3 one-click OPD test presets.
  2. **Structured EMR & Clinical Safety Check**: Language badges, demographics, vitals cards, chief complaints, provisional diagnosis, medication extraction, allergy cross-reference & high-dose safety guardrails requiring explicit *"Verify Dose"* confirmation, `en-IN` spoken confirmation with Mute/Unmute toggle, and a *Voice Edit Command* bar.
  3. **Printable A4 Rx & Regional Patient Summary**: Print-ready A4 prescription sheet (`@media print`, locked until flagged medications are verified) and patient dosage translation into 6 scripts (English, Hindi, Kannada, Malayalam, Tamil, Telugu) with one-click **Copy WhatsApp/SMS**.

---

## One-Command Docker Launch (Port 3000)

```bash
docker-compose up --build
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

To run in detached mode or stop:

```bash
docker-compose up -d --build
docker-compose down
```

---

## Local Development

```bash
npm install
npm run dev
```

Open **[http://localhost:5173](http://localhost:5173)** (recommended: Chrome or Edge for Web Speech API support).

Production build check:

```bash
npm run build
```

---

## Project Structure

```text
voxcare/
├── docker-compose.yml              # Maps port 3000:3000
├── Dockerfile                      # Multi-stage Node 20 -> Nginx Alpine build
├── nginx.conf                      # SPA routing & static asset caching on port 3000
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── index.html
├── README.md
└── src/
    ├── main.jsx
    ├── index.css                   # Tailwind layers + @media print A4 rules
    ├── App.jsx                     # 3-panel workspace state + speech hooks
    ├── components/
    │   ├── Header.jsx              # Top bar, Zero-Key badge, Mute/Unmute toggle
    │   ├── PanelVoiceCapture.jsx   # Panel 1: Dictation, allergies, 3 OPD presets
    │   ├── PanelEMR.jsx            # Panel 2: Structured EMR, safety flags, voice edits
    │   └── PanelPrescription.jsx   # Panel 3: Printable A4 Rx & regional dosage card
    └── utils/
        ├── clinicalParser.js       # Deterministic local clinical NLP & safety engine
        └── presets.js              # 3 OPD test presets
```

