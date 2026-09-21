import React, { useState } from 'react';
import { X, User, Activity, Phone, AlertCircle } from 'lucide-react';
import { patientAPI } from '../services/api';

const BLOOD_GROUPS = ['A+','A-','B+','B-','O+','O-','AB+','AB-'];
const STATUSES = ['Stable','Serious','Critical','Improving'];

export default function AddPatientModal({ onClose, onAdded, occupiedBeds = [] }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [form, setForm]     = useState({
    name:'', age:'', gender:'Male', bedNumber:'', bloodGroup:'O+',
    diagnosis:'', attendingDoctor:'', status:'Stable',
    heartRate:'72', oxygenLevel:'98', systolicBP:'120',
    diastolicBP:'80', temperature:'98.6', respiratoryRate:'16',
    ecName:'', ecPhone:'', ecRelation:'',
    allergies:'', medications:'',
  });

  const set = (k) => (e) => { setForm(p => ({ ...p, [k]: e.target.value })); setError(''); };
  const available = [1,2,3,4].filter(b => !occupiedBeds.includes(b));

  const validateStep1 = () => {
    if (!form.name.trim())        return 'Patient name is required.';
    if (!form.age || form.age<1)  return 'Valid age is required.';
    if (!form.bedNumber)          return 'Please select an ICU bed.';
    if (!form.diagnosis.trim())   return 'Diagnosis is required.';
    if (!form.attendingDoctor.trim()) return 'Attending doctor is required.';
    return null;
  };

  const handleNext = () => {
    if (step === 1) {
      const err = validateStep1();
      if (err) { setError(err); return; }
    }
    setError('');
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    setLoading(true); setError('');
    try {
      const payload = {
        name: form.name.trim(),
        age: parseInt(form.age),
        gender: form.gender,
        bedNumber: parseInt(form.bedNumber),
        bloodGroup: form.bloodGroup,
        diagnosis: form.diagnosis.trim(),
        attendingDoctor: form.attendingDoctor.trim(),
        status: form.status,
        currentVitals: {
          heartRate: parseFloat(form.heartRate),
          oxygenLevel: parseFloat(form.oxygenLevel),
          systolicBP: parseFloat(form.systolicBP),
          diastolicBP: parseFloat(form.diastolicBP),
          temperature: parseFloat(form.temperature),
          respiratoryRate: parseFloat(form.respiratoryRate),
        },
        emergencyContact: { name: form.ecName, phone: form.ecPhone, relation: form.ecRelation },
        allergies: form.allergies ? form.allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
        medications: form.medications ? form.medications.split(',').map(s => ({ name: s.trim(), dosage: '', frequency: '' })).filter(m => m.name) : [],
      };
      const res = await patientAPI.add(payload);
      onAdded(res.patient);
      onClose();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const IL = { background:'rgba(0,212,255,0.05)', border:'1px solid var(--border)', borderRadius:8, color:'var(--t1)', padding:'9px 13px', fontFamily:'var(--fb)', fontSize:'0.9rem', width:'100%', outline:'none' };
  const LL = { fontFamily:'var(--fm)', fontSize:'0.67rem', color:'var(--t3)', textTransform:'uppercase', letterSpacing:'0.1em', display:'block', marginBottom:5 };

  const steps = [
    { icon: <User size={14} />, label: 'Patient Info' },
    { icon: <Activity size={14} />, label: 'Vitals' },
    { icon: <Phone size={14} />, label: 'Emergency' },
  ];

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        {/* Header */}
        <div className="modal-hd">
          <span className="modal-title">◈ ADMIT NEW PATIENT</span>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Step indicators */}
        <div style={{ display:'flex', gap:8, marginBottom:22 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
              <div style={{ width:'100%', height:3, borderRadius:2, background: i+1 <= step ? 'var(--cyan)' : 'rgba(0,212,255,0.15)', transition:'background .3s', boxShadow: i+1 <= step ? '0 0 6px var(--cyan)' : 'none' }} />
              <span style={{ fontFamily:'var(--fm)', fontSize:'0.6rem', color: i+1 <= step ? 'var(--cyan)' : 'var(--t3)', letterSpacing:'0.08em', display:'flex', alignItems:'center', gap:4 }}>
                {s.icon} {s.label}
              </span>
            </div>
          ))}
        </div>

        {error && <div className="msg msg-error"><AlertCircle size={13} /> {error}</div>}

        {/* Step 1 */}
        {step === 1 && (
          <div className="modal-grid">
            <div className="span2">
              <label style={LL}>Full Name *</label>
              <input style={IL} value={form.name} onChange={set('name')} placeholder="Patient full name" />
            </div>
            <div>
              <label style={LL}>Age *</label>
              <input style={IL} type="number" min="0" max="150" value={form.age} onChange={set('age')} placeholder="Age in years" />
            </div>
            <div>
              <label style={LL}>Gender *</label>
              <select style={IL} value={form.gender} onChange={set('gender')}>
                <option>Male</option><option>Female</option><option>Other</option>
              </select>
            </div>
            <div>
              <label style={LL}>ICU Bed * {available.length === 0 && '— ALL FULL'}</label>
              <select style={IL} value={form.bedNumber} onChange={set('bedNumber')}>
                <option value="">-- Select Bed --</option>
                {available.map(b => <option key={b} value={b}>ICU Bed {b}</option>)}
              </select>
            </div>
            <div>
              <label style={LL}>Blood Group</label>
              <select style={IL} value={form.bloodGroup} onChange={set('bloodGroup')}>
                {BLOOD_GROUPS.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div className="span2">
              <label style={LL}>Diagnosis *</label>
              <input style={IL} value={form.diagnosis} onChange={set('diagnosis')} placeholder="Primary diagnosis" />
            </div>
            <div>
              <label style={LL}>Attending Doctor *</label>
              <input style={IL} value={form.attendingDoctor} onChange={set('attendingDoctor')} placeholder="Dr. Name" />
            </div>
            <div>
              <label style={LL}>Initial Status</label>
              <select style={IL} value={form.status} onChange={set('status')}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="span2">
              <label style={LL}>Known Allergies (comma separated)</label>
              <input style={IL} value={form.allergies} onChange={set('allergies')} placeholder="Penicillin, Aspirin..." />
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="modal-grid">
            {[
              ['heartRate','Heart Rate (bpm)','72'],
              ['oxygenLevel','O₂ Saturation (%)','98'],
              ['systolicBP','Systolic BP (mmHg)','120'],
              ['diastolicBP','Diastolic BP (mmHg)','80'],
              ['temperature','Temperature (°F)','98.6'],
              ['respiratoryRate','Respiratory Rate (/min)','16'],
            ].map(([k, l, ph]) => (
              <div key={k}>
                <label style={LL}>{l}</label>
                <input style={IL} type="number" step="0.1" value={form[k]} onChange={set(k)} placeholder={ph} />
              </div>
            ))}
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="modal-grid">
            <div className="span2">
              <label style={LL}>Contact Full Name</label>
              <input style={IL} value={form.ecName} onChange={set('ecName')} placeholder="Emergency contact name" />
            </div>
            <div>
              <label style={LL}>Phone Number</label>
              <input style={IL} value={form.ecPhone} onChange={set('ecPhone')} placeholder="555-0000" />
            </div>
            <div>
              <label style={LL}>Relation to Patient</label>
              <input style={IL} value={form.ecRelation} onChange={set('ecRelation')} placeholder="Spouse, Child, Parent..." />
            </div>
            <div className="span2">
              <label style={LL}>Current Medications (comma separated)</label>
              <input style={IL} value={form.medications} onChange={set('medications')} placeholder="Aspirin, Metformin..." />
            </div>
          </div>
        )}

        {/* Footer Buttons */}
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:22, gap:10 }}>
          {step > 1
            ? <button className="btn btn-ghost" onClick={() => { setError(''); setStep(s => s - 1); }}>← Back</button>
            : <div />}
          {step < 3
            ? <button className="btn btn-primary" onClick={handleNext}>Next →</button>
            : <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                {loading ? 'ADMITTING...' : '✓ ADMIT PATIENT'}
              </button>}
        </div>
      </div>
    </div>
  );
}
