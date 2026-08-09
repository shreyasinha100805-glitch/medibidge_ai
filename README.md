# 💊 MediBridge AI — Intelligent Medication Adherence & Alarm Platform

> **MediBridge AI** — Intelligent Medication Adherence Platform with Real-Time Alarms & Gemini AI.

MediBridge AI is an end-to-end healthcare platform designed to solve the $300B global problem of medication non-adherence. By combining minute-precision automated dose tracking, procedural audio alarm alerts, interactive snooze controls, multi-patient caretaker oversight, visual adherence charts, and a Gemini-powered AI Assistant with built-in medical safety guardrails, MediBridge AI helps patients stay consistent with critical treatments.

---

## Deployment

The frontend and backend are deployed as separate services:

- Frontend: Vercel
- Backend: Render, configured from `backend/render.yaml`

When deploying the frontend separately from the backend, set this Vercel environment variable before building:

```env
VITE_API_URL=https://medibridge-backend.onrender.com/api
```

Vite reads `VITE_API_URL` at build time in `frontend/src/api.js`. If it is missing, the frontend falls back to `/api`; on Vercel that relative path can be handled by the SPA rewrite and return `index.html` instead of reaching Express, causing `405` errors on `POST /api/auth/register`, `POST /api/auth/login`, and other API requests. After changing `VITE_API_URL`, trigger a new Vercel deployment.

On Render, set the backend `CLIENT_URL` environment variable to the deployed Vercel frontend URL:

```env
CLIENT_URL=https://medibidge-ai.vercel.app
```

This keeps CORS aligned so browser requests from the Vercel frontend are allowed by the Express backend.

## ✨ Key Features & Enhancements

### 1. 🔔 Web Audio Alarm Synthesizer & Sound Customizer
- **4 Procedural Sound Profiles** (no external audio files required, 100% reliable across browsers):
  - 🎵 **Gentle Chime**: Soft harmonic E5-G#5-B5-E6 arpeggio (Recommended)
  - 📟 **Digital Pulse**: Modern medical monitor double beep sequence
  - 🔔 **Soft Bell**: Calm dual-tone ambient gong
  - 🚨 **High Priority Alert**: Urgent rapid dual-frequency alarm pattern
- **Sound Controls**: Built-in volume slider (0%–100%) and loop playback while alarms are ringing.
- **One-Click Sound Test**: `🔔 Sound Test` buttons built into the Navbar and Patient Command Center for instant evaluation.

### 2. ⏰ Interactive Alarm Trigger Modal (`AlarmModal.jsx`)
- High-visibility red/cyan glowing glassmorphic modal triggered when dose time is reached or tested.
- Dynamic sound visualizer equalizer bars (`eqBounce` CSS animations).
- Complete medicine details: name, scheduled time badge, dosage (e.g. `500mg`), category badge, and doctor instructions.
- **Interactive Action Buttons**:
  - `✓ Mark Taken Now (+15 Pts)`: Automatically updates schedule in backend/state and stops sound.
  - `⏰ Snooze 5m / 10m`: Postpones alarm timer and notifies patient.
  - `✕ Silence & Dismiss`: Silences active alarm instantly.

### 3. 📊 Visual Adherence Analytics & Interactive Charts
- Interactive **7-Day Daily Trend Bar Chart** (taken vs. missed stacked breakdown with hover tooltips).
- Radial **30-Day Adherence Donut Gauge** and medicine-wise performance bars.

### 4. 🤖 AI Prescription Vision OCR & Assistant Builder (`/api/ai/scan-prescription`)
- Direct image upload inside AI Assistant to scan doctor prescriptions via Gemini 1.5 Flash Vision OCR.
- Generates interactive schedule message cards with **"⚡ Confirm & Add to Daily Schedule"** single-click creation.
- Enforces strict safety rules: **Never alters dosages**, **Never diagnoses**, and includes explicit **medical disclaimers**.

### 5. 🛡️ Caretaker Command Center & Emergency Shield (`/api/caretakers`)
- Patient-Caretaker connection workflow via email requests.
- Multi-patient dashboard with real-time risk indicators (`HIGH_RISK` vs `STABLE`).
- **Unstable Patient Emergency Banner**: Instant 1-click access to nearby hospital emergency services & emergency hotline info.

### 6. 🌐 Multilingual & Premium Glassmorphic UI
- Custom dark-mode glassmorphism design system with responsive layouts.
- Multilingual support for **English**, **Bengali (বাংলা)**, **Hindi (हिन्दी)**, **Spanish**, **French**, and **Sinhala (සිංහල)**.

---


## 🛠️ Tech Stack

- **Backend**: Node.js (ESM), Express.js, MongoDB + Mongoose, JWT Auth, `node-cron`, `express-rate-limit`, `helmet`, `cors`.
- **AI Integration**: Google Gemini 1.5 Flash API + Context Engineering Engine.
- **Audio Engine**: Web Audio API Procedural Synthesizer.
- **Frontend**: React 19, Vite, Custom Glassmorphic CSS Design System, Multilingual i18n Dictionary.

---
## video link : https://drive.google.com/file/d/1uz-vOXZoLlkLusGe2nuUg4pLJiN7mPzT/view?usp=drivesdk

## app link:https://medibidge-ai.vercel.app/
## ppt link: https://drive.google.com/file/d/1bIEIvuDjo0SI01Gh029-GT26H_DaMSl9/view?usp=drivesdk
