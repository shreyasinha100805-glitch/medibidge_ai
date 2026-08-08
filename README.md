# 💊 MediBridge AI — Intelligent Medication Adherence Platform

> **Hackathon Prize-Winning Edition** — Real-time dose engine, caretaker risk shield, and context-aware AI health assistant.

MediBridge AI is an end-to-end healthcare platform designed to solve the $300B global problem of medication non-adherence. By combining minute-precision automated dose tracking, multi-patient caretaker oversight, and a Gemini-powered AI Assistant that analyzes live MongoDB logs with built-in medical safety guardrails, MediBridge AI helps patients stay consistent with critical treatments.

---

## ✨ Key Features

1. **Intelligent Schedule & Dose Engine (`/api/medications`)**
   - Automated daily dose schedule generation.
   - 1-click status updates (`TAKEN` / `MISSED` / `PENDING`).
   - Background cron job running every minute to detect past scheduled times and automatically trigger missed-dose alerts.

2. **30-Day Adherence Analytics (`/api/medications/adherence`)**
   - Real-time percentage metrics across Today, 7-Day Week, and 30-Day Month.
   - Medicine-wise breakdown pinpointing low-adherence prescriptions (e.g. Gintac at 42.9%).
   - Daily 7-day trend history.

3. **Context-Aware AI Assistant (`/api/ai/assistant`)**
   - Connects live patient MongoDB data (active medicines, adherence %, lowest adherence prescription) directly to Google Gemini AI.
   - Smart medical heuristic fallback engine guaranteeing 100% demo availability.
   - Enforces strict safety rules: **Never alters dosages**, **Never diagnoses**, and includes an explicit **medical disclaimer**.

4. **Caretaker Command Center (`/api/caretakers`)**
   - Patient-Caretaker connection workflow via email requests.
   - Multi-patient dashboard with real-time risk indicators (`HIGH_RISK` vs `STABLE`).
   - Detailed patient report inspection modal for family & medical caregivers.

5. **Real-Time Notification System (`/api/notifications`)**
   - Instant miss alerts and taken confirmations.
   - Unread badge counters and mark-as-read controls.

6. **Modern High-Impact React Frontend (`/frontend`)**
   - Built with Vite + React + Custom Glassmorphism Theme.
   - Multilingual support for **English**, **Spanish**, **Hindi**, **French**, and **Sinhala**.
   - One-click Judge Demo Login buttons (`Amal - Patient`, `Nimani - Caretaker`).

---

## 🛠️ Tech Stack

- **Backend**: Node.js (ESM), Express.js, MongoDB + Mongoose, JWT Auth, `node-cron`, `express-rate-limit`, `helmet`, `cors`.
- **AI Integration**: Google Gemini API + Context Engineering Engine.
- **Frontend**: React 19, Vite, Custom Glassmorphic CSS Design System, Multilingual i18n Dictionary.

---

## 🚀 Quick Start Guide

### 1. Seed Demo Database
```bash
cd backend
npm run seed
```
This populates MongoDB with demo credentials:
- **Patient**: `amal@demo.com` / `Demo@123`
- **Caretaker**: `nimani@demo.com` / `Demo@123`
- 3 Active Medications (Gintac, Paracetamol, Vitamin D)
- 7 Days of realistic dose history logs

### 2. Start Backend Server
```bash
cd backend
npm start
```
Runs on `http://localhost:5000`.

### 3. Start Frontend App
```bash
cd frontend
npm run dev
```
Runs on `http://localhost:5173`.

---

## 📡 API Endpoint Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register Patient or Caretaker account |
| `POST` | `/api/auth/login` | Login and obtain JWT token |
| `GET` | `/api/medications/today` | Fetch today's schedule and summary counters |
| `POST` | `/api/medications/:id/taken` | Mark medication dose as taken |
| `POST` | `/api/medications/:id/missed` | Mark medication dose as missed |
| `GET` | `/api/medications/adherence` | Get today, week, month, and medicine-wise adherence % |
| `POST` | `/api/ai/assistant` | Ask AI Assistant context-aware adherence questions |
| `GET` | `/api/caretakers/patients` | List connected patients with risk statuses (Caretaker) |
| `GET` | `/api/caretakers/patients/:id/dashboard` | Get deep patient report for Caretaker |
| `GET` | `/api/notifications` | Fetch notification history and unread count |
