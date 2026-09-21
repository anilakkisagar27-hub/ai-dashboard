import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Activity, BedDouble, Heart, Wind, AlertTriangle, Users, Zap } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, Legend } from 'recharts';
import { patientAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Bg from '../components/Bg';
import '../styles/patient.css';

const TT = {
  contentStyle:{ background:'rgba(2,11,24,.96)',border:'1px solid rgba(0,212,255,.3)',borderRadius:8,fontFamily:'var(--fm)',fontSize:'0.72rem' },
  labelStyle:  { color:'var(--cyan)' },
};

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [patients,  setPatients]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const { vitalsMap, connected }  = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const [a, p] = await Promise.all([patientAPI.analytics(), patientAPI.getAll()]);
        setAnalytics(a.analytics); setPatients(p.patients);
      } catch(e){ console.error(e); }
      finally { setLoading(false); }
    };
    load();
    const iv = setInterval(load, 10000);
    return () => clearInterval(iv);
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner"/><div className="loading-label">LOADING ANALYTICS...</div></div>;

  const statusPie = analytics ? [
    { name:'Critical',  value: analytics.patientsByStatus?.Critical  || 0, color:'#ff3366' },
    { name:'Serious',   value: analytics.patientsByStatus?.Serious   || 0, color:'#ff8800' },
    { name:'Stable',    value: analytics.patientsByStatus?.Stable    || 0, color:'#00ff88' },
    { name:'Improving', value: analytics.patientsByStatus?.Improving || 0, color:'#00d4ff' },
  ].filter(d=>d.value>0) : [];

  const bedData = [1,2,3,4].map(b=>({
    bed:`BED ${b}`,
    occupied: patients.some(p=>p.bedNumber===b) ? 1 : 0,
  }));

  const radarData = patients.map(p=>{
    const lv = vitalsMap[p.id]?.vitals || p.currentVitals;
    return { name: p.name.split(' ')[0], hr: Math.round((lv.heartRate/150)*100), o2: lv.oxygenLevel, stability: p.aiStatus?.stabilityScore??80 };
  });

  const kpis = analytics ? [
    { label:'ICU Occupancy',    value:`${analytics.occupancyRate}%`,   color:'var(--cyan)',   cls:'kpi-cyan',   bg:'rgba(0,212,255,.15)',  icon:<BedDouble size={17}/> },
    { label:'Active Patients',  value:analytics.occupiedBeds,          color:'var(--green)',  cls:'kpi-green',  bg:'rgba(0,255,136,.15)',  icon:<Users size={17}/> },
    { label:'Critical Cases',   value:analytics.criticalCount,         color:'var(--red)',    cls:'kpi-red',    bg:'rgba(255,51,102,.15)', icon:<AlertTriangle size={17}/> },
    { label:'Avg Heart Rate',   value:`${analytics.avgHeartRate}`,     color:'var(--green)',  cls:'kpi-green',  bg:'rgba(0,255,136,.15)',  icon:<Heart size={17}/>,      unit:'bpm' },
    { label:'Avg O₂ Sat.',      value:`${analytics.avgOxygen}`,        color:'var(--cyan)',   cls:'kpi-cyan',   bg:'rgba(0,212,255,.15)',  icon:<Wind size={17}/>,       unit:'%' },
    { label:'AI Stability',     value:`${analytics.avgStability}`,     color:'var(--purple)', cls:'kpi-purple', bg:'rgba(139,92,246,.15)', icon:<Brain size={17}/>,      unit:'/100' },
  ] : [];

  const devices = [
    { name:'Cardiac Monitor Array',    status:'ONLINE',  uptime:'99.9%' },
    { name:'Ventilator Network',        status:'ONLINE',  uptime:'99.7%' },
    { name:'Central Infusion System',   status:'STANDBY', uptime:'98.2%' },
    { name:'Multi-Parameter Monitors', status:'ONLINE',  uptime:'99.8%' },
    { name:'AI Prediction Engine',      status:'ONLINE',  uptime:'100%'  },
    { name:'Emergency Alert System',    status:'ONLINE',  uptime:'100%'  },
  ];

  return (
    <div style={{ position:'relative' }}>
      <Bg/>
      <div className="app-layout" style={{ position:'relative',zIndex:1 }}>
        <Sidebar/>
        <div className="main-area">
          <Navbar/>
          <div className="page-content">
            <div className="analytics-page">

              {/* Hero */}
              <div className="analytics-hero">
                <div>
                  <div className="analytics-big-title">◈ AI ANALYTICS CENTER</div>
                  <div className="analytics-sub">// NEURAL HEALTH INTELLIGENCE · REAL-TIME ICU DATA</div>
                </div>
                <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                  <div style={{ width:8,height:8,borderRadius:'50%',background:connected?'var(--green)':'var(--red)',boxShadow:`0 0 8px ${connected?'var(--green)':'var(--red)'}`,animation:'blink 2s infinite' }}/>
                  <span style={{ fontFamily:'var(--fm)',fontSize:'0.72rem',color:connected?'var(--green)':'var(--red)' }}>
                    {connected?'LIVE FEED ACTIVE':'RECONNECTING...'} · {new Date().toLocaleTimeString()}
                  </span>
                </div>
              </div>

              {/* KPIs */}
              <div className="kpi-grid">
                {kpis.map(k=>(
                  <div key={k.label} className={`kpi-card ${k.cls}`}>
                    <div className="kpi-icon" style={{ background:k.bg,color:k.color }}>{k.icon}</div>
                    <div className="kpi-label">{k.label}</div>
                    <div className="kpi-value" style={{ color:k.color }}>{k.value}<span style={{ fontSize:'0.75rem',opacity:.7 }}>{k.unit}</span></div>
                  </div>
                ))}
              </div>

              {/* Charts row */}
              <div className="charts-row">
                <div className="chart-card">
                  <div className="chart-title"><Activity size={13}/> PATIENT VITALS RADAR</div>
                  {radarData.length>0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="rgba(0,212,255,0.14)"/>
                        <PolarAngleAxis dataKey="name" tick={{ fontFamily:'var(--fm)',fontSize:10,fill:'var(--t3)' }}/>
                        <Radar name="Heart Rate" dataKey="hr"        stroke="#00ff88" fill="#00ff88" fillOpacity={0.1}/>
                        <Radar name="O₂ Level"   dataKey="o2"        stroke="#00d4ff" fill="#00d4ff" fillOpacity={0.1}/>
                        <Radar name="Stability"  dataKey="stability" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1}/>
                        <Legend wrapperStyle={{ fontFamily:'var(--fm)',fontSize:'0.68rem' }}/>
                        <Tooltip {...TT}/>
                      </RadarChart>
                    </ResponsiveContainer>
                  ) : <div style={{ height:250,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--fm)',color:'var(--t3)',fontSize:'0.78rem' }}>No patient data</div>}
                </div>
                <div className="chart-card">
                  <div className="chart-title"><Brain size={13}/> STATUS DISTRIBUTION</div>
                  {statusPie.length>0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={170}>
                        <PieChart>
                          <Pie data={statusPie} cx="50%" cy="50%" innerRadius={46} outerRadius={72} paddingAngle={3} dataKey="value">
                            {statusPie.map((e,i)=><Cell key={i} fill={e.color} style={{ filter:`drop-shadow(0 0 5px ${e.color})` }}/>)}
                          </Pie>
                          <Tooltip {...TT}/>
                        </PieChart>
                      </ResponsiveContainer>
                      <div style={{ display:'flex',flexWrap:'wrap',gap:8,justifyContent:'center' }}>
                        {statusPie.map(d=>(
                          <div key={d.name} style={{ display:'flex',alignItems:'center',gap:5,fontFamily:'var(--fm)',fontSize:'0.68rem',color:'var(--t3)' }}>
                            <div style={{ width:8,height:8,borderRadius:'50%',background:d.color }}/>{d.name}: {d.value}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : <div style={{ height:220,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--fm)',color:'var(--t3)',fontSize:'0.78rem' }}>No patients admitted</div>}
                </div>
              </div>

              {/* Bed Occupancy */}
              <div className="chart-card" style={{ marginBottom:14 }}>
                <div className="chart-title"><BedDouble size={13}/> BED OCCUPANCY</div>
                <ResponsiveContainer width="100%" height={110}>
                  <BarChart data={bedData} barSize={45}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.06)"/>
                    <XAxis dataKey="bed" tick={{ fontFamily:'var(--fm)',fontSize:10,fill:'var(--t3)' }}/>
                    <YAxis hide/>
                    <Tooltip {...TT} formatter={v=>[v===1?'OCCUPIED':'AVAILABLE']}/>
                    <Bar dataKey="occupied" fill="var(--cyan)" radius={4} style={{ filter:'drop-shadow(0 0 4px var(--cyan))' }}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Bottom row */}
              <div className="bottom-row">
                {/* Patient list */}
                <div className="chart-card">
                  <div className="chart-title"><Users size={13}/> ACTIVE PATIENTS</div>
                  {patients.length>0 ? patients.map(p=>{
                    const lv = vitalsMap[p.id]?.vitals||p.currentVitals;
                    const rC = {Critical:'var(--red)',High:'var(--orange)',Medium:'var(--yellow)',Low:'var(--green)'}[p.aiStatus?.riskLevel]||'var(--cyan)';
                    return (
                      <div key={p.id} className="patient-list-row" onClick={()=>navigate(`/patients/${p.id}`)}>
                        <span className="bed-badge">BED {p.bedNumber}</span>
                        <div style={{ flex:1,minWidth:0 }}>
                          <div style={{ fontFamily:'var(--fb)',fontSize:'0.85rem',fontWeight:600,color:'var(--t1)' }}>{p.name}</div>
                          <div style={{ fontFamily:'var(--fm)',fontSize:'0.63rem',color:'var(--t3)' }}>{p.diagnosis}</div>
                        </div>
                        <div style={{ textAlign:'right' }}>
                          <div style={{ fontFamily:'var(--fm)',fontSize:'0.8rem',color:'var(--green)' }}>{lv.heartRate} bpm</div>
                          <div style={{ fontFamily:'var(--fm)',fontSize:'0.62rem',color:rC }}>{p.aiStatus?.riskLevel} Risk</div>
                        </div>
                      </div>
                    );
                  }) : <div style={{ fontFamily:'var(--fm)',fontSize:'0.78rem',color:'var(--t3)',textAlign:'center',padding:20 }}>No active patients</div>}
                </div>

                {/* Device status */}
                <div className="chart-card">
                  <div className="chart-title"><Zap size={13}/> DEVICE STATUS</div>
                  {devices.map(d=>(
                    <div key={d.name} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                      <div>
                        <div style={{ fontFamily:'var(--fm)',fontSize:'0.72rem',color:'var(--t2)' }}>{d.name}</div>
                        <div style={{ fontFamily:'var(--fm)',fontSize:'0.6rem',color:'var(--t3)' }}>Uptime: {d.uptime}</div>
                      </div>
                      <span className={d.status==='ONLINE'?'badge-online':'badge-standby'}>{d.status}</span>
                    </div>
                  ))}
                </div>

                {/* AI Insights */}
                <div className="chart-card">
                  <div className="chart-title"><Brain size={13}/> AI INSIGHTS</div>
                  {analytics && (
                    <>
                      {[
                        { label:'High Risk Patients', value:analytics.highRiskCount, warn:analytics.highRiskCount>0 },
                        { label:'Critical Patients',  value:analytics.criticalCount, warn:analytics.criticalCount>0 },
                        { label:'Avg Stability',      value:`${analytics.avgStability}/100`, warn:analytics.avgStability<60 },
                        { label:'ICU Capacity',       value:`${analytics.occupancyRate}%`,   warn:analytics.occupancyRate>75 },
                        { label:'Available Beds',     value:analytics.availableBeds, warn:analytics.availableBeds===0 },
                      ].map(({label,value,warn})=>(
                        <div key={label} className={`ai-insight-row ${warn?'ai-insight-warn':'ai-insight-ok'}`}>
                          <span style={{ fontFamily:'var(--fm)',fontSize:'0.72rem',color:'var(--t3)' }}>{label}</span>
                          <span style={{ fontFamily:'var(--fm)',fontSize:'0.88rem',fontWeight:700,color:warn?'var(--red)':'var(--cyan)' }}>{value}</span>
                        </div>
                      ))}
                      <div style={{ marginTop:12,background:'rgba(139,92,246,0.08)',border:'1px solid rgba(139,92,246,0.2)',borderRadius:8,padding:12 }}>
                        <div style={{ fontFamily:'var(--fm)',fontSize:'0.62rem',color:'var(--purple)',marginBottom:6,letterSpacing:'0.1em' }}>AI RECOMMENDATION</div>
                        <div style={{ fontFamily:'var(--fm)',fontSize:'0.74rem',color:'var(--t2)',lineHeight:1.55 }}>
                          {analytics.criticalCount>0
                            ? `⚠ ${analytics.criticalCount} patient(s) critical. Immediate physician review required.`
                            : analytics.highRiskCount>0
                            ? `⚡ ${analytics.highRiskCount} high-risk patient(s). Increase monitoring frequency.`
                            : '✓ All patients within acceptable parameters. Standard monitoring active.'}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
