import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertTriangle, Activity, Database, Zap, Printer } from 'lucide-react';
import TriageReportPreview from './TriageReportPreview';
import { useAuth } from '../../context/AuthContext';

const SymptomMapping = {
  'Chest Pain': 'chestPain',
  'Palpitations': 'palpitations',
  'Shortness of Breath': 'shortnessOfBreath',
  'Arm Pain': 'armPain',
  'Headache': 'headache',
  'Dizziness': 'dizziness',
  'Confusion': 'confusion',
  'Vision Changes': 'visionChanges',
  'Slurred Speech': 'slurredSpeech',
  'Nausea': 'nausea',
  'Vomiting': 'vomiting',
  'Abdominal Pain': 'abdominalPain',
  'Diarrhea': 'diarrhea',
  'Wheezing': 'wheezing',
  'Coughing Blood': 'coughingBlood',
  'Difficulty Breathing': 'difficultyBreathing',
  'Fever': 'fever',
  'Sweating': 'sweating',
  'Weakness': 'weakness',
  'Syncope (fainting)': 'syncope'
};

const PRIORITY_CONFIG = {
  HIGH: {
    color: '#dc2626',          // red
    borderColor: '#ef4444',
    bgCard: '#1a0505',
    icon: '🚨',
    label: 'HIGH PRIORITY',
    subtitle: 'Urgent Attention Needed — Immediate Action Required',
    badgeBg: '#7f1d1d',
    badgeText: '#fca5a5'
  },
  MEDIUM: {
    color: '#d97706',          // amber/yellow
    borderColor: '#f59e0b',
    bgCard: '#1c1200',
    icon: '⚠️',
    label: 'MEDIUM PRIORITY',
    subtitle: 'Monitor Closely — Evaluate Within 30 Minutes',
    badgeBg: '#78350f',
    badgeText: '#fcd34d'
  },
  LOW: {
    color: '#16a34a',          // green
    borderColor: '#22c55e',
    bgCard: '#051a0a',
    icon: '✅',
    label: 'LOW PRIORITY',
    subtitle: 'Routine Care — Standard Assessment',
    badgeBg: '#14532d',
    badgeText: '#86efac'
  }
}

const RunTriageModal = ({ isOpen, onClose, patient, onSaveReport }) => {
  const { user } = useAuth();
  
  // FIX 2 - State declarations
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [onsetTime, setOnsetTime] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [vitals, setVitals] = useState({
    systolic: '',
    diastolic: '',
    pulse: '',
    temperature: '',
    spo2: '',
    respiratoryRate: '',
    gcs: 15,
    painScale: 0
  });
  const [symptoms, setSymptoms] = useState({});

  useEffect(() => {
    if (isOpen) {
      setAnalysisResult(null);
      setAnalyzing(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;


  // FIX 1 - handleAnalyze - Call backend for UNIQUE real-time results
  const handleAnalyze = async () => {
    console.log('🔄 Starting NEW analysis - clearing old state...');
    setAnalyzing(true);
    setAnalysisResult(null); // Clear old results

    try {
      const selectedSymptoms = Object.entries(symptoms)
        .filter(([_, checked]) => checked)
        .map(([key]) => key)
        .join(', ');

      const symptomsText = chiefComplaint + (selectedSymptoms ? `. Symptoms: ${selectedSymptoms}` : '');
      const vitalsText = `BP: ${vitals.systolic || 'N/A'}/${vitals.diastolic || 'N/A'}, Pulse: ${vitals.pulse || 'N/A'}, Temp: ${vitals.temperature || 'N/A'}°F, SpO2: ${vitals.spo2 || 'N/A'}%, RR: ${vitals.respiratoryRate || 'N/A'}, GCS: ${vitals.gcs || 15}, Pain: ${vitals.painScale || 0}/10`;

      console.log('📤 Calling backend /analyze-case with NEW data:', { symptomsText: symptomsText.substring(0, 50) });
      
      const response = await fetch('http://localhost:5000/api/triage/analyze-case', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms: symptomsText,
          age: patient?.age,
          gender: patient?.gender,
          history: patient?.chronicConditions || patient?.conditions?.join(', ') || 'None',
          vitals: vitalsText
        })
      });

      const data = await response.json();
      console.log('✅ Got UNIQUE response from backend:', { caseId: data.caseId, confidence: data.confidence, latency: data.latency });

      // Map backend response to frontend format
      setAnalysisResult({
        priority: data.riskLevel || 'LOW',
        severityReason: data.summary || 'Analysis complete',
        immediateActions: Array.isArray(data.immediateAction) ? data.immediateAction : [data.immediateAction],
        probableDiagnosis: data.differentialDiagnosis?.[0] || 'Clinical assessment required',
        vitalsAlert: data.supportingEvidence || 'Based on clinical data',
        allergyWarning: patient?.knownAllergies || patient?.allergies?.join(', ') || 'None',
        confidence: data.confidence,
        latency: data.latency,
        tokenReduction: data.tokenStats?.reduction,
        caseId: data.caseId,
        source: 'backend-ai'
      });

    } catch (error) {
      console.error('❌ Analysis error:', error);
      setAnalysisResult({
        priority: 'HIGH',
        severityReason: 'System error - manual assessment required',
        immediateActions: ['Immediate clinical evaluation', 'Use standard protocols'],
        probableDiagnosis: 'Unable to complete AI analysis',
        vitalsAlert: 'Manual vitals verification needed',
        allergyWarning: patient?.knownAllergies || patient?.allergies?.join(', ') || 'None',
        source: 'error-fallback'
      });
    } finally {
      setAnalyzing(false);
    }
  };

  // FIX 4 - handleSaveReport
  const handleSaveReport = () => {
    if (!analysisResult) {
      alert('Please analyze patient first!')
      return
    }
    const report = {
      id: 'TR_' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      patientId: patient?.uid || patient?.id,
      patientName: patient?.fullName || patient?.name,
      doctorName: user?.name || 'Dr. Current User',
      chiefComplaint, vitals, symptoms,
      priority: analysisResult.priority,
      severityReason: analysisResult.severityReason,
      immediateActions: analysisResult.immediateActions,
      probableDiagnosis: analysisResult.probableDiagnosis,
      source: analysisResult.source,
      savedAt: new Date().toISOString()
    }
    const existing = JSON.parse(localStorage.getItem('ert_triage_reports') || '[]')
    existing.unshift(report)
    localStorage.setItem('ert_triage_reports', JSON.stringify(existing.slice(0, 200)))
    
    alert(`✅ Saved! Priority: ${analysisResult.priority}`)
    
    if (onSaveReport) onSaveReport(report);
    
    setTimeout(() => {
      onClose();
      // Reset form
      setAnalysisResult(null);
      setVitals({ systolic:'', diastolic:'', pulse:'', temperature:'', spo2:'', respiratoryRate:'', gcs:15, painScale:0 });
      setSymptoms({});
      setChiefComplaint('');
      setAdditionalNotes('');
      setOnsetTime('');
    }, 1000)
  }

  const normalizedPriority = 
    ['HIGH','MEDIUM','LOW'].includes(analysisResult?.priority?.toUpperCase())
      ? analysisResult.priority.toUpperCase()
      : 'LOW'

  const config = PRIORITY_CONFIG[normalizedPriority]

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(4px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>

      <div style={{
        width: '100%',
        maxWidth: '1100px',
        maxHeight: '90vh',
        background: '#0d0d1a',
        borderRadius: '16px',
        border: '1px solid #2a2a4a',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>

        {/* ── HEADER ── */}
        <div style={{
          background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
          padding: '20px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Sparkles className="text-white w-6 h-6" />
            <span style={{ color: 'white', fontSize: '22px', fontWeight: '700' }}>
              Live Triage Analysis
            </span>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.15)',
            border: 'none', color: 'white',
            width: '36px', height: '36px',
            borderRadius: '50%', cursor: 'pointer',
            fontSize: '18px', display: 'flex',
            alignItems: 'center', justifyContent: 'center'
          }}><X className="w-5 h-5" /></button>
        </div>

        {/* ── SCROLLABLE BODY ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '320px 1fr',
          gap: '0',
          flex: 1,
          overflow: 'hidden'
        }}>

          {/* ── LEFT PANEL — Patient Context ── */}
          <div style={{
            borderRight: '1px solid #1e1e3a',
            overflowY: 'auto',
            padding: '24px 20px',
            background: '#0a0a14'
          }}>
            <div style={{ color: '#818cf8', fontSize: '11px', fontWeight: '700', 
                          letterSpacing: '2px', marginBottom: '16px' }}>
              PATIENT CONTEXT
            </div>

            <div style={{ background: '#111827', borderRadius: '10px', 
                          padding: '16px', marginBottom: '14px' }}>
              {[
                ['Name', patient?.fullName || patient?.name],
                ['ID', patient?.patientId || patient?.id],
                ['Age', (patient?.age || '--') + ' years'],
                ['Gender', patient?.gender || '--'],
                ['Blood Group', patient?.bloodGroup || '--']
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between',
                                           padding: '6px 0', borderBottom: '1px solid #1e293b' }}>
                  <span style={{ color: '#6b7280', fontSize: '13px' }}>{label}</span>
                  <span style={{ color: 'white', fontSize: '13px', fontWeight: '600' }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Allergies */}
            {(patient?.knownAllergies || (patient?.allergies && patient.allergies.length > 0)) && (
              <div style={{ background: '#1c0a0a', border: '1px solid #7f1d1d',
                            borderRadius: '10px', padding: '14px', marginBottom: '14px' }}>
                <div style={{ color: '#f87171', fontSize: '12px', fontWeight: '700', 
                              marginBottom: '8px' }}>⚠ ALLERGIES</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {(typeof patient.knownAllergies === 'string' ? patient.knownAllergies.split(',') : (patient.allergies || [])).map(a => (
                    <span key={a} style={{ background: '#7f1d1d', color: '#fca5a5',
                                            padding: '3px 10px', borderRadius: '20px', fontSize: '12px' }}>
                      {a.trim ? a.trim() : a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Chronic Conditions */}
            {(patient?.chronicConditions || (patient?.conditions && patient.conditions.length > 0)) && (
              <div style={{ background: '#1c1200', border: '1px solid #78350f',
                            borderRadius: '10px', padding: '14px', marginBottom: '14px' }}>
                <div style={{ color: '#fbbf24', fontSize: '12px', fontWeight: '700',
                              marginBottom: '8px' }}>CHRONIC CONDITIONS</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {(typeof patient.chronicConditions === 'string' ? patient.chronicConditions.split(',') : (patient.conditions || [])).map(c => (
                    <span key={c} style={{ background: '#78350f', color: '#fcd34d',
                                            padding: '3px 10px', borderRadius: '20px', fontSize: '12px' }}>
                      {c.trim ? c.trim() : c}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT PANEL — Visit Input ── */}
          <div style={{ overflowY: 'auto', padding: '24px 28px' }}>
            <div style={{ color: '#818cf8', fontSize: '11px', fontWeight: '700',
                          letterSpacing: '2px', marginBottom: '20px' }}>
              CURRENT VISIT INPUT
            </div>

            {/* Chief Complaint */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: '#e2e8f0', fontSize: '13px', fontWeight: '600',
                              display: 'block', marginBottom: '8px' }}>
                Chief Complaint *
              </label>
              <textarea
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                placeholder="Describe what brought the patient in today..."
                rows={3}
                style={{ width: '100%', background: '#111827', border: '1px solid #2d3748',
                         borderRadius: '8px', padding: '12px', color: 'white',
                         fontSize: '14px', resize: 'vertical', boxSizing: 'border-box',
                         outline: 'none', fontFamily: 'inherit' }}
              />
            </div>

            {/* Vitals Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ color: '#e2e8f0', fontSize: '13px', fontWeight: '600',
                                display: 'block', marginBottom: '8px' }}>Blood Pressure (mmHg)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="number"
                    value={vitals.systolic}
                    onChange={(e) => setVitals(p => ({...p, systolic: e.target.value}))}
                    placeholder="Systolic"
                    style={{ flex: 1, background: '#111827', border: '1px solid #2d3748',
                             borderRadius: '8px', padding: '10px 12px', color: 'white',
                             fontSize: '14px', outline: 'none', width: '100%' }}
                  />
                  <span style={{ color: '#6b7280', fontWeight: '700' }}>/</span>
                  <input type="number"
                    value={vitals.diastolic}
                    onChange={(e) => setVitals(p => ({...p, diastolic: e.target.value}))}
                    placeholder="Diastolic"
                    style={{ flex: 1, background: '#111827', border: '1px solid #2d3748',
                             borderRadius: '8px', padding: '10px 12px', color: 'white',
                             fontSize: '14px', outline: 'none', width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ color: '#e2e8f0', fontSize: '13px', fontWeight: '600',
                                display: 'block', marginBottom: '8px' }}>Pulse Rate (bpm)</label>
                <input type="number"
                  value={vitals.pulse}
                  onChange={(e) => setVitals(p => ({...p, pulse: e.target.value}))}
                  placeholder="e.g., 72"
                  style={{ width: '100%', background: '#111827', border: '1px solid #2d3748',
                           borderRadius: '8px', padding: '10px 12px', color: 'white',
                           fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ color: '#e2e8f0', fontSize: '13px', fontWeight: '600',
                                display: 'block', marginBottom: '8px' }}>Temperature (°F)</label>
                <input type="number" step="0.1"
                  value={vitals.temperature}
                  onChange={(e) => setVitals(p => ({...p, temperature: e.target.value}))}
                  placeholder="e.g., 98.6"
                  style={{ width: '100%', background: '#111827', border: '1px solid #2d3748',
                           borderRadius: '8px', padding: '10px 12px', color: 'white',
                           fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ color: '#e2e8f0', fontSize: '13px', fontWeight: '600',
                                display: 'block', marginBottom: '8px' }}>SpO2 (%)</label>
                <input type="number"
                  value={vitals.spo2}
                  onChange={(e) => setVitals(p => ({...p, spo2: e.target.value}))}
                  placeholder="e.g., 98"
                  min="0" max="100"
                  style={{ width: '100%', background: '#111827', border: '1px solid #2d3748',
                           borderRadius: '8px', padding: '10px 12px', color: 'white',
                           fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ color: '#e2e8f0', fontSize: '13px', fontWeight: '600',
                                display: 'block', marginBottom: '8px' }}>Respiratory Rate (/min)</label>
                <input type="number"
                  value={vitals.respiratoryRate}
                  onChange={(e) => setVitals(p => ({...p, respiratoryRate: e.target.value}))}
                  placeholder="e.g., 16"
                  style={{ width: '100%', background: '#111827', border: '1px solid #2d3748',
                           borderRadius: '8px', padding: '10px 12px', color: 'white',
                           fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ color: '#e2e8f0', fontSize: '13px', fontWeight: '600',
                                display: 'block', marginBottom: '8px' }}>GCS Score (3-15)</label>
                <input type="number"
                  value={vitals.gcs}
                  onChange={(e) => setVitals(p => ({...p, gcs: e.target.value}))}
                  min="3" max="15"
                  style={{ width: '100%', background: '#111827', border: '1px solid #2d3748',
                           borderRadius: '8px', padding: '10px 12px', color: 'white',
                           fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Pain Scale */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ color: '#e2e8f0', fontSize: '13px', fontWeight: '600',
                              display: 'block', marginBottom: '8px' }}>
                Pain Scale (0-10) — Current: {vitals.painScale} 
                {['😊','🙂','😐','😐','😣','😣','😫','😫','😭','😭','😭'][vitals.painScale]}
              </label>
              <input type="range" min="0" max="10"
                value={vitals.painScale || 0}
                onChange={(e) => setVitals(p => ({...p, painScale: Number(e.target.value)}))}
                style={{ width: '100%', accentColor: '#6366f1', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', 
                            color: '#4b5563', fontSize: '11px', marginTop: '4px' }}>
                <span>0 - No pain</span><span>5 - Moderate</span><span>10 - Worst</span>
              </div>
            </div>

            {/* Symptoms */}
            {[
              { label: 'CARDIAC', color: '#ef4444', items: [
                ['chestPain','Chest Pain'],['palpitations','Palpitations'],
                ['shortnessOfBreath','Shortness of Breath'],['armPain','Arm Pain']
              ]},
              { label: 'NEUROLOGICAL', color: '#8b5cf6', items: [
                ['headache','Headache'],['dizziness','Dizziness'],
                ['confusion','Confusion'],['visionChanges','Vision Changes'],['slurredSpeech','Slurred Speech']
              ]},
              { label: 'ABDOMINAL', color: '#f59e0b', items: [
                ['nausea','Nausea'],['vomiting','Vomiting'],
                ['abdominalPain','Abdominal Pain'],['diarrhea','Diarrhea']
              ]},
              { label: 'RESPIRATORY', color: '#06b6d4', items: [
                ['wheezing','Wheezing'],['coughingBlood','Coughing Blood'],['difficultyBreathing','Difficulty Breathing']
              ]},
              { label: 'OTHER', color: '#84cc16', items: [
                ['fever','Fever'],['sweating','Sweating'],['weakness','Weakness'],['syncope','Syncope']
              ]}
            ].map(group => (
              <div key={group.label} style={{ marginBottom: '18px' }}>
                <div style={{ color: group.color, fontSize: '11px', fontWeight: '700',
                              letterSpacing: '2px', marginBottom: '10px' }}>{group.label}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {group.items.map(([key, label]) => (
                    <label key={key} style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      background: symptoms[key] ? '#1e1b4b' : '#111827',
                      border: `1px solid ${symptoms[key] ? '#6366f1' : '#2d3748'}`,
                      borderRadius: '8px', padding: '10px 12px', cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}>
                      <input type="checkbox"
                        checked={!!symptoms[key]}
                        onChange={(e) => setSymptoms(p => ({...p, [key]: e.target.checked}))}
                        style={{ accentColor: '#6366f1', width: '15px', height: '15px' }}
                      />
                      <span style={{ color: symptoms[key] ? '#a5b4fc' : '#9ca3af', fontSize: '13px' }}>
                        {label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            {/* Onset Time + Notes */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ color: '#e2e8f0', fontSize: '13px', fontWeight: '600',
                                display: 'block', marginBottom: '8px' }}>Onset Time</label>
                <select value={onsetTime}
                  onChange={(e) => setOnsetTime(e.target.value)}
                  style={{ width: '100%', background: '#111827', border: '1px solid #2d3748',
                           borderRadius: '8px', padding: '10px 12px', color: 'white',
                           fontSize: '14px', outline: 'none' }}>
                  <option value="">Select onset time...</option>
                  <option>Just now</option>
                  <option>&lt; 1 hour</option>
                  <option>1-6 hours</option>
                  <option>6-24 hours</option>
                  <option>&gt; 24 hours</option>
                </select>
              </div>
              <div>
                <label style={{ color: '#e2e8f0', fontSize: '13px', fontWeight: '600',
                                display: 'block', marginBottom: '8px' }}>Additional Notes</label>
                <textarea value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="Any additional observations..."
                  rows={2}
                  style={{ width: '100%', background: '#111827', border: '1px solid #2d3748',
                           borderRadius: '8px', padding: '10px 12px', color: 'white',
                           fontSize: '14px', resize: 'none', boxSizing: 'border-box',
                           outline: 'none', fontFamily: 'inherit' }}
                />
              </div>
            </div>

            {/* Analysis Result */}
            {analysisResult && (
              <div style={{
                borderRadius: '12px',
                overflow: 'hidden',
                border: `2px solid ${config.borderColor}`,
                marginBottom: '20px'
              }}>
                {/* Color Banner */}
                <div style={{
                  background: config.color,
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px'
                }}>
                  <span style={{ fontSize: '28px' }}>{config.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      color: 'white', 
                      fontSize: '20px', 
                      fontWeight: '900',
                      letterSpacing: '1px'
                    }}>
                      {config.label}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px', marginTop: '2px' }}>
                      {config.subtitle}
                    </div>
                  </div>
                  {/* AI Source Badge */}
                  <span style={{
                    background: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    whiteSpace: 'nowrap'
                  }}>
                    {analysisResult.source === 'groq' ? '⚡ Groq AI' :
                     analysisResult.source === 'ollama' ? '🦙 Ollama' : '📋 Rules'}
                  </span>
                </div>

                {/* Details Section */}
                <div style={{ background: config.bgCard, padding: '18px 20px' }}>
                  
                  {/* Severity Reason */}
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ color: '#9ca3af', fontSize: '11px', fontWeight: '700', 
                                  letterSpacing: '1px', marginBottom: '6px' }}>SEVERITY REASON</div>
                    <div style={{ color: 'white', fontSize: '14px', lineHeight: '1.5' }}>
                      {analysisResult.severityReason}
                    </div>
                  </div>

                  {/* Immediate Actions */}
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ color: '#9ca3af', fontSize: '11px', fontWeight: '700',
                                  letterSpacing: '1px', marginBottom: '8px' }}>⚡ IMMEDIATE ACTIONS</div>
                    {analysisResult.immediateActions?.map((action, i) => (
                      <label key={i} style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        marginBottom: '8px', cursor: 'pointer',
                        padding: '8px 10px',
                        background: 'rgba(255,255,255,0.04)',
                        borderRadius: '6px'
                      }}>
                        <input type="checkbox"
                          style={{ accentColor: config.color, width: '16px', height: '16px', flexShrink: 0 }}
                        />
                        <span style={{ color: '#e2e8f0', fontSize: '13px' }}>{i + 1}. {action}</span>
                      </label>
                    ))}
                  </div>

                  {/* Probable Diagnosis */}
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ color: '#9ca3af', fontSize: '11px', fontWeight: '700',
                                  letterSpacing: '1px', marginBottom: '6px' }}>🔬 PROBABLE DIAGNOSIS</div>
                    <div style={{ color: 'white', fontWeight: '700', fontSize: '15px' }}>
                      {analysisResult.probableDiagnosis}
                    </div>
                    <span style={{
                      display: 'inline-block', marginTop: '6px',
                      background: '#1e1b4b', color: '#818cf8',
                      padding: '3px 12px', borderRadius: '20px', fontSize: '12px'
                    }}>Clinical correlation requested</span>
                  </div>

                  {/* Allergy Warning - only if exists */}
                  {analysisResult.allergyWarning && 
                   analysisResult.allergyWarning !== 'None' && 
                   analysisResult.allergyWarning !== 'none' && (
                    <div style={{
                      background: '#1c0a00', border: '1px solid #f59e0b',
                      borderRadius: '8px', padding: '10px 14px', marginBottom: '10px'
                    }}>
                      <div style={{ color: '#f59e0b', fontSize: '11px', fontWeight: '700', marginBottom: '4px' }}>
                        ⚠️ ALLERGY WARNING
                      </div>
                      <div style={{ color: 'white', fontSize: '13px' }}>{analysisResult.allergyWarning}</div>
                    </div>
                  )}

                  {/* Vitals Alert */}
                  <div style={{
                    background: '#0f172a', border: '1px solid #334155',
                    borderRadius: '8px', padding: '10px 14px', marginBottom: '10px'
                  }}>
                    <div style={{ color: '#6366f1', fontSize: '11px', fontWeight: '700', marginBottom: '4px' }}>
                      📊 VITALS ALERT
                    </div>
                    <div style={{ color: 'white', fontSize: '13px' }}>
                      {analysisResult.vitalsAlert || 'Based on entered clinical data'}
                    </div>
                  </div>

                  {/* Performance Metrics - Show UNIQUE values */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px',
                    marginTop: '12px'
                  }}>
                    <div style={{ background: '#0f172a', borderRadius: '6px', padding: '10px', textAlign: 'center' }}>
                      <div style={{ color: '#6b7280', fontSize: '10px', fontWeight: '700', marginBottom: '4px' }}>CONFIDENCE</div>
                      <div style={{ color: '#22c55e', fontSize: '18px', fontWeight: '900' }}>{analysisResult.confidence || 'N/A'}%</div>
                    </div>
                    <div style={{ background: '#0f172a', borderRadius: '6px', padding: '10px', textAlign: 'center' }}>
                      <div style={{ color: '#6b7280', fontSize: '10px', fontWeight: '700', marginBottom: '4px' }}>LATENCY</div>
                      <div style={{ color: '#3b82f6', fontSize: '18px', fontWeight: '900' }}>{analysisResult.latency || 0}ms</div>
                    </div>
                    <div style={{ background: '#0f172a', borderRadius: '6px', padding: '10px', textAlign: 'center' }}>
                      <div style={{ color: '#6b7280', fontSize: '10px', fontWeight: '700', marginBottom: '4px' }}>TOKEN ↓</div>
                      <div style={{ color: '#a855f7', fontSize: '18px', fontWeight: '900' }}>{analysisResult.tokenReduction || '0.0'}%</div>
                    </div>
                  </div>

                  {/* Case ID for tracking */}
                  {analysisResult.caseId && (
                    <div style={{ marginTop: '10px', textAlign: 'center' }}>
                      <span style={{ color: '#6b7280', fontSize: '11px' }}>Case ID: {analysisResult.caseId}</span>
                    </div>
                  )}

                </div>
              </div>
            )}

          </div>
        </div>

        {/* ── STICKY FOOTER BUTTONS ── */}
        <div style={{
          padding: '16px 28px', borderTop: '1px solid #1e1e3a',
          background: '#0a0a14', display: 'flex', gap: '12px', flexShrink: 0
        }}>
          <button onClick={handleAnalyze} disabled={analyzing}
            style={{
              flex: 1, padding: '14px', fontSize: '16px', fontWeight: '700',
              background: analyzing ? '#3730a3' : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              color: 'white', border: 'none', borderRadius: '10px', cursor: analyzing ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}>
            {analyzing ? '⟳ Analyzing...' : '⚡ Analyze Patient'}
          </button>
          
          <button
            onClick={() => setShowPreview(true)}
            disabled={!analysisResult}
            style={{
              padding: '14px 20px',
              background: analysisResult ? '#4f46e5' : '#1e1e3e',
              color: analysisResult ? 'white' : '#4b5563',
              border: 'none', borderRadius: '10px',
              fontSize: '14px', fontWeight: '600',
              cursor: analysisResult ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <Printer className="w-4 h-4" /> Preview
          </button>

          <button onClick={handleSaveReport} disabled={!analysisResult}
            style={{
              padding: '14px 28px', fontSize: '14px', fontWeight: '600',
              background: analysisResult ? '#059669' : '#1a2a1a',
              color: analysisResult ? 'white' : '#4a6a4a',
              border: 'none', borderRadius: '10px',
              cursor: analysisResult ? 'pointer' : 'not-allowed'
            }}>
            💾 Save Report
          </button>
        </div>

        {/* Report Preview Modal */}
        {analysisResult && (
          <TriageReportPreview 
            isOpen={showPreview}
            onClose={() => setShowPreview(false)}
            patient={patient}
            data={{
              ...analysisResult,
              rawInput: {
                vitals,
                chiefComplaint,
                symptoms: Object.keys(symptoms).filter(s => symptoms[s])
              }
            }}
          />
        )}
      </div>
    </div>
  );
};

export default RunTriageModal;
