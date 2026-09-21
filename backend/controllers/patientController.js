const { v4: uuidv4 } = require('uuid');
const { patientStore, alertStore } = require('../storage/fileStore');
const { computeAI } = require('../config/aiEngine');

// ─── GET ALL ──────────────────────────────────────────────────────────────────
exports.getAllPatients = (req, res) => {
  try {
    const patients = patientStore.getAll();
    return res.json({ success: true, count: patients.length, patients });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET BY ID ────────────────────────────────────────────────────────────────
exports.getPatientById = (req, res) => {
  try {
    const patient = patientStore.findById(req.params.id);
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });
    return res.json({ success: true, patient });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── ADD PATIENT ──────────────────────────────────────────────────────────────
exports.addPatient = (req, res) => {
  try {
    const {
      name, age, gender, bedNumber, diagnosis, attendingDoctor,
      bloodGroup, emergencyContact, currentVitals, allergies, medications, status
    } = req.body;

    // Validation
    if (!name || !age || !gender || !bedNumber || !diagnosis || !attendingDoctor) {
      return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }

    // Check bed availability
    const bedOccupied = patientStore.findByBed(parseInt(bedNumber));
    if (bedOccupied) {
      return res.status(400).json({ success: false, message: `ICU Bed ${bedNumber} is already occupied by ${bedOccupied.name}.` });
    }

    const vitals = currentVitals || { heartRate: 72, oxygenLevel: 98, systolicBP: 120, diastolicBP: 80, temperature: 98.6, respiratoryRate: 16 };
    const aiStatus = computeAI(vitals);

    const patient = patientStore.create({
      id: `pat_${uuidv4()}`,
      name: name.trim(),
      age: parseInt(age),
      gender,
      bedNumber: parseInt(bedNumber),
      bloodGroup: bloodGroup || 'O+',
      diagnosis: diagnosis.trim(),
      attendingDoctor: attendingDoctor.trim(),
      status: status || 'Stable',
      admissionDate: new Date().toISOString(),
      dischargeDate: null,
      currentVitals: { ...vitals, lastUpdated: new Date().toISOString() },
      aiStatus,
      emergencyContact: emergencyContact || {},
      allergies: allergies || [],
      medications: medications || [],
      notes: [],
      vitalHistory: [{ ...vitals, timestamp: new Date().toISOString() }],
    });

    // Save alert if high risk
    if (aiStatus.riskLevel === 'Critical' || aiStatus.riskLevel === 'High') {
      alertStore.add({
        patientId: patient.id,
        patientName: patient.name,
        bedNumber: patient.bedNumber,
        riskLevel: aiStatus.riskLevel,
        message: aiStatus.prediction,
        type: 'admission',
      });
    }

    return res.status(201).json({ success: true, message: 'Patient admitted successfully.', patient });
  } catch (err) {
    console.error('[PATIENT] Add error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── UPDATE PATIENT ───────────────────────────────────────────────────────────
exports.updatePatient = (req, res) => {
  try {
    const patient = patientStore.findById(req.params.id);
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });

    const updated = patientStore.updateById(req.params.id, req.body);
    return res.json({ success: true, message: 'Patient updated.', patient: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── UPDATE VITALS ────────────────────────────────────────────────────────────
exports.updateVitals = (req, res) => {
  try {
    const { heartRate, oxygenLevel, systolicBP, diastolicBP, temperature, respiratoryRate } = req.body;
    const vitals = { heartRate: parseFloat(heartRate), oxygenLevel: parseFloat(oxygenLevel), systolicBP: parseFloat(systolicBP), diastolicBP: parseFloat(diastolicBP), temperature: parseFloat(temperature), respiratoryRate: parseFloat(respiratoryRate || 16) };

    const aiStatus = computeAI(vitals);
    const patient = patientStore.updateVitals(req.params.id, vitals);
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });

    const updated = patientStore.updateById(req.params.id, { aiStatus });

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('vitals_update', { patientId: patient.id, bedNumber: patient.bedNumber, name: patient.name, vitals, aiStatus });
      if (aiStatus.riskLevel === 'Critical' || aiStatus.riskLevel === 'High') {
        const alert = alertStore.add({ patientId: patient.id, patientName: patient.name, bedNumber: patient.bedNumber, riskLevel: aiStatus.riskLevel, message: aiStatus.prediction, type: 'vitals' });
        io.emit('emergency_alert', alert);
      }
    }

    return res.json({ success: true, patient: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── ADD NOTE ─────────────────────────────────────────────────────────────────
exports.addNote = (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, message: 'Note text required.' });
    const patient = patientStore.addNote(req.params.id, { text, author: req.user.name || 'Staff' });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });
    return res.json({ success: true, patient });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── DISCHARGE ────────────────────────────────────────────────────────────────
exports.dischargePatient = (req, res) => {
  try {
    const patient = patientStore.discharge(req.params.id);
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });
    return res.json({ success: true, message: `${patient.name} discharged successfully.`, patient });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── DELETE ───────────────────────────────────────────────────────────────────
exports.deletePatient = (req, res) => {
  try {
    const deleted = patientStore.delete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Patient not found.' });
    return res.json({ success: true, message: 'Patient record deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── ANALYTICS ────────────────────────────────────────────────────────────────
exports.getAnalytics = (req, res) => {
  try {
    const patients = patientStore.getAll();
    const alerts = alertStore.getRecent(10);
    const totalBeds = 4;
    const occupiedBeds = patients.length;

    const avg = (key) => patients.length ? parseFloat((patients.reduce((s, p) => s + (p.currentVitals?.[key] || 0), 0) / patients.length).toFixed(1)) : 0;

    return res.json({
      success: true,
      analytics: {
        totalBeds, occupiedBeds,
        availableBeds: totalBeds - occupiedBeds,
        occupancyRate: Math.round((occupiedBeds / totalBeds) * 100),
        criticalCount: patients.filter(p => p.aiStatus?.riskLevel === 'Critical').length,
        highRiskCount: patients.filter(p => p.aiStatus?.riskLevel === 'High').length,
        avgHeartRate: avg('heartRate'),
        avgOxygen: avg('oxygenLevel'),
        avgTemp: avg('temperature'),
        avgStability: patients.length ? Math.round(patients.reduce((s, p) => s + (p.aiStatus?.stabilityScore || 80), 0) / patients.length) : 0,
        patientsByStatus: {
          Critical: patients.filter(p => p.status === 'Critical').length,
          Serious: patients.filter(p => p.status === 'Serious').length,
          Stable: patients.filter(p => p.status === 'Stable').length,
          Improving: patients.filter(p => p.status === 'Improving').length,
        },
        recentAlerts: alerts,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
