# ⚖️ MediBridge AI — Hackathon Judge Q&A Guide

Anticipated questions and technical answers for hackathon judging panel:

---

### Q1: How do you ensure AI safety and avoid medical liability?
> **Answer**: 
> "MediBridge AI uses strict system prompt engineering combined with context-scoped input schemas. 
> 1. The system prompt explicitly forbids diagnosing conditions or altering prescribed dosages.
> 2. Every AI output includes an automated medical disclaimer.
> 3. The AI only has access to adherence statistics, scheduled times, and prescription names—it focuses strictly on behavioral routine optimizations (habit stacking, reminder alarms, pill placement)."

---

### Q2: How does the backend handle missed dose detection in real-time?
> **Answer**: 
> "We run a `node-cron` scheduled background task every minute on the server. It scans all active medication schedules, compares current time against scheduled times, and automatically transitions overdue `PENDING` logs to `MISSED`, generating real-time notification records for both patient and connected caretakers."

---

### Q3: What happens if the Google Gemini API key is missing or rate-limited during a live demo?
> **Answer**: 
> "We built a smart medical heuristic fallback engine inside `aiService.js`. If Gemini API is unreachable or unconfigured, the fallback engine parses the patient's MongoDB adherence data and generates accurate, personalized behavioral recommendations. The app never fails during a demo."

---

### Q4: How is data privacy (HIPAA / GDPR) handled?
> **Answer**: 
> "All API endpoints are protected using JWT authentication and strict Role-Based Access Control (`PATIENT` vs `CARETAKER`). Caretakers can only access patient data if an explicit `ACCEPTED` record exists in the `CaretakerConnection` MongoDB collection. Passwords are hashed using bcrypt with salt rounds."

---

### Q5: How do you plan to monetize MediBridge AI commercially?
> **Answer**: 
> 1. **B2C Premium**: Free tier for individual tracking; $4.99/mo for unlimited AI assistant queries and multi-caretaker SMS alerts.
> 2. **B2B Pharmacy & Health System Integration**: Licensing platform to health insurers and pharmacy chains (e.g. CVS, Walgreens) to reduce hospital readmission penalties associated with non-adherence.

---

### Q6: Can the platform work across multiple languages?
> **Answer**: 
> "Yes! MediBridge AI includes built-in multilingual support for **English, Spanish, Hindi, French, and Sinhala**, allowing non-English speaking patients and global caregivers to use the platform seamlessly."
