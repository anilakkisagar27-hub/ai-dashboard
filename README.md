# 🏥 ICU AI Monitoring System — Complete Working Project

> Full-stack AI-powered ICU Patient Monitoring Dashboard
> NO DATABASE REQUIRED — All data stored in JSON files

---

## 🚀 Quick Start (2 Terminals)

### Terminal 1 — Backend
```bash
cd icu-system/backend
npm install
node server.js
```
Runs at: http://localhost:5000

### Terminal 2 — Frontend
```bash
cd icu-system/frontend
npm install
npm run dev
```
Opens at: http://localhost:3000

---

## 🔑 Demo Login Credentials

| Role   | Email              | Password   |
|--------|--------------------|------------|
| Admin  | admin@icu.med      | admin123   |
| Doctor | doctor@icu.med     | doctor123  |
| Nurse  | nurse@icu.med      | nurse123   |

> Demo data is auto-seeded on first backend start.

---

## 📁 Data Storage (backend/data/)

All data is stored as JSON files — NO MongoDB or database needed:

| File           | Contents                          |
|----------------|-----------------------------------|
| users.json     | Registered users (login/register) |
| patients.json  | Patient records + vital history   |
| alerts.json    | Emergency alert log               |
| vitals.json    | Vital signs reference             |

When you **register** → saved to users.json
When you **login** → reads from users.json  
When you **admit patient** → saved to patients.json
When you **update vitals** → written to patients.json

---

## 📋 Pages

| Route           | Page            |
|-----------------|-----------------|
| /               | Login           |
| /register       | Register        |
| /dashboard      | ICU Dashboard   |
| /patients/:id   | Patient Details |
| /analytics      | AI Analytics    |

---

## 🔌 API Endpoints

### Auth
- POST /api/auth/register → Creates user in users.json
- POST /api/auth/login    → Reads from users.json
- GET  /api/auth/me       → Returns current user

### Patients
- GET    /api/patients              → All active patients
- GET    /api/patients/analytics    → ICU stats
- GET    /api/patients/:id          → Single patient
- POST   /api/patients              → Admit (saves to patients.json)
- PUT    /api/patients/:id/vitals   → Update vitals in patients.json
- POST   /api/patients/:id/notes    → Add clinical note
- PUT    /api/patients/:id/discharge→ Discharge patient
- DELETE /api/patients/:id          → Delete record (admin only)

---

## 🤖 Features

- ✅ JWT Authentication (login/register)
- ✅ Role-based access (admin/doctor/nurse)
- ✅ File-based storage (users.json + patients.json)
- ✅ Real-time ECG animation (canvas-based)
- ✅ Live vital updates via Socket.IO (every 3 seconds)
- ✅ AI risk scoring (Low/Medium/High/Critical)
- ✅ Emergency alert system
- ✅ Add/discharge patients
- ✅ Vital history charts (Recharts)
- ✅ Clinical notes per patient
- ✅ Analytics dashboard with charts
- ✅ Cyberpunk glassmorphism UI
- ✅ Responsive (mobile/tablet/desktop)
