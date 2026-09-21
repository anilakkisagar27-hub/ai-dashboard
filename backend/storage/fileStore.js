const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const FILES = {
  users:    path.join(DATA_DIR, 'users.json'),
  patients: path.join(DATA_DIR, 'patients.json'),
  vitals:   path.join(DATA_DIR, 'vitals.json'),
  alerts:   path.join(DATA_DIR, 'alerts.json'),
};

// Initialize empty files if they don't exist
const DEFAULTS = {
  users:    { users: [], _meta: { total: 0, lastModified: new Date().toISOString() } },
  patients: { patients: [], _meta: { total: 0, lastModified: new Date().toISOString() } },
  vitals:   { vitals: {}, _meta: { lastModified: new Date().toISOString() } },
  alerts:   { alerts: [], _meta: { total: 0, lastModified: new Date().toISOString() } },
};

Object.entries(FILES).forEach(([key, filePath]) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(DEFAULTS[key], null, 2));
  }
});

// ─── Read ────────────────────────────────────────────────────────────────────
const readFile = (key) => {
  try {
    const raw = fs.readFileSync(FILES[key], 'utf8');
    return JSON.parse(raw);
  } catch {
    return DEFAULTS[key];
  }
};

// ─── Write ───────────────────────────────────────────────────────────────────
const writeFile = (key, data) => {
  data._meta = { ...data._meta, lastModified: new Date().toISOString() };
  fs.writeFileSync(FILES[key], JSON.stringify(data, null, 2));
};

// ═══════════════════════════ USER STORAGE ════════════════════════════════════

const userStore = {
  getAll: () => readFile('users').users,

  findByEmail: (email) => {
    const { users } = readFile('users');
    return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  findById: (id) => {
    const { users } = readFile('users');
    return users.find(u => u.id === id) || null;
  },

  create: (userData) => {
    const db = readFile('users');
    const newUser = {
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.users.push(newUser);
    db._meta.total = db.users.length;
    writeFile('users', db);
    console.log(`[FILE-DB] New user saved → ${userData.email} (${userData.role})`);
    return newUser;
  },

  updateLastLogin: (id) => {
    const db = readFile('users');
    const idx = db.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      db.users[idx].lastLogin = new Date().toISOString();
      db.users[idx].updatedAt = new Date().toISOString();
      writeFile('users', db);
    }
  },

  updateById: (id, updates) => {
    const db = readFile('users');
    const idx = db.users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    db.users[idx] = { ...db.users[idx], ...updates, updatedAt: new Date().toISOString() };
    writeFile('users', db);
    return db.users[idx];
  },
};

// ═══════════════════════════ PATIENT STORAGE ══════════════════════════════════

const patientStore = {
  getAll: () => readFile('patients').patients.filter(p => p.status !== 'Discharged'),

  getAllIncludingDischarged: () => readFile('patients').patients,

  findById: (id) => {
    const { patients } = readFile('patients');
    return patients.find(p => p.id === id) || null;
  },

  findByBed: (bedNumber) => {
    const { patients } = readFile('patients');
    return patients.find(p => p.bedNumber === bedNumber && p.status !== 'Discharged') || null;
  },

  create: (patientData) => {
    const db = readFile('patients');
    const newPatient = {
      ...patientData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.patients.push(newPatient);
    db._meta.total = db.patients.length;
    writeFile('patients', db);
    console.log(`[FILE-DB] New patient saved → ${patientData.name} (Bed ${patientData.bedNumber})`);
    return newPatient;
  },

  updateById: (id, updates) => {
    const db = readFile('patients');
    const idx = db.patients.findIndex(p => p.id === id);
    if (idx === -1) return null;
    db.patients[idx] = { ...db.patients[idx], ...updates, updatedAt: new Date().toISOString() };
    writeFile('patients', db);
    return db.patients[idx];
  },

  updateVitals: (id, vitals) => {
    const db = readFile('patients');
    const idx = db.patients.findIndex(p => p.id === id);
    if (idx === -1) return null;

    const vitalEntry = { ...vitals, timestamp: new Date().toISOString() };
    db.patients[idx].currentVitals = { ...vitals, lastUpdated: new Date().toISOString() };

    // Keep last 50 vital history records
    if (!db.patients[idx].vitalHistory) db.patients[idx].vitalHistory = [];
    db.patients[idx].vitalHistory.push(vitalEntry);
    if (db.patients[idx].vitalHistory.length > 50) {
      db.patients[idx].vitalHistory = db.patients[idx].vitalHistory.slice(-50);
    }

    db.patients[idx].updatedAt = new Date().toISOString();
    writeFile('patients', db);
    return db.patients[idx];
  },

  addNote: (id, note) => {
    const db = readFile('patients');
    const idx = db.patients.findIndex(p => p.id === id);
    if (idx === -1) return null;
    if (!db.patients[idx].notes) db.patients[idx].notes = [];
    db.patients[idx].notes.push({ ...note, timestamp: new Date().toISOString() });
    db.patients[idx].updatedAt = new Date().toISOString();
    writeFile('patients', db);
    return db.patients[idx];
  },

  discharge: (id) => {
    const db = readFile('patients');
    const idx = db.patients.findIndex(p => p.id === id);
    if (idx === -1) return null;
    db.patients[idx].status = 'Discharged';
    db.patients[idx].dischargeDate = new Date().toISOString();
    db.patients[idx].updatedAt = new Date().toISOString();
    writeFile('patients', db);
    console.log(`[FILE-DB] Patient discharged → ${db.patients[idx].name}`);
    return db.patients[idx];
  },

  delete: (id) => {
    const db = readFile('patients');
    const idx = db.patients.findIndex(p => p.id === id);
    if (idx === -1) return false;
    db.patients.splice(idx, 1);
    db._meta.total = db.patients.length;
    writeFile('patients', db);
    return true;
  },
};

// ═══════════════════════════ ALERT STORAGE ════════════════════════════════════

const alertStore = {
  getAll: () => readFile('alerts').alerts,

  getRecent: (limit = 20) => {
    const { alerts } = readFile('alerts');
    return alerts.slice(-limit).reverse();
  },

  add: (alert) => {
    const db = readFile('alerts');
    const newAlert = { ...alert, id: `alt_${Date.now()}`, timestamp: new Date().toISOString() };
    db.alerts.push(newAlert);
    // Keep last 100 alerts
    if (db.alerts.length > 100) db.alerts = db.alerts.slice(-100);
    db._meta.total = db.alerts.length;
    writeFile('alerts', db);
    return newAlert;
  },
};

module.exports = { userStore, patientStore, alertStore, readFile, writeFile };
