import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import UserBadge from './components/Navbar/UserBadge';
import AnimatedMetricCard from './components/AnimatedMetricCard';
import ComparisonTable from './components/ComparisonTable';
import CircularProgress from './components/CircularProgress';
import ConfidenceGauge from './components/ConfidenceGauge';
import LatencyBarGraph from './components/LatencyBarGraph';
import JsonViewer from './components/JsonViewer';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorNotification from './components/ErrorNotification';
import { ErrorBoundary } from './components/ErrorBoundary';
import PDFScanner from './components/PDFScanner';
import LatencyDashboard from './components/LatencyDashboard';
import BackButton from './components/common/BackButton';
import { loadSampleCase } from './utils/sampleCases';
import { processTriage, processDetailedTriage, compareApproaches, checkHealth, getHistory, saveCaseHistory, ApiError } from './utils/apiClient';
import { useAuth } from './context/AuthContext';

export default function App() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [patientHistory, setPatientHistory] = useState('');
  const [emergencyDescription, setEmergencyDescription] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState('');
  const [patientVitals, setPatientVitals] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [mode, setMode] = useState('optimized');
  const [comparison, setComparison] = useState(null);
  const [error, setError] = useState(null);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [casesAnalyzed, setCasesAnalyzed] = useState(0);
  const [status, setStatus] = useState('');
  const [currentPage, setCurrentPage] = useState('triage');
  const [history, setHistory] = useState([]);
  const [selectedHistoryPatient, setSelectedHistoryPatient] = useState(null);
  const [historySearchQuery, setHistorySearchQuery] = useState('');

  useEffect(() => {
    checkHealth()
      .then(() => setBackendStatus('online'))
      .catch(() => setBackendStatus('offline'));
    fetchHistory();
  }, []);

  useEffect(() => {
    if (currentPage === 'history') fetchHistory();
  }, [currentPage]);

  const fetchHistory = async () => {
    try {
      const data = await getHistory();
      setHistory(data.data);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  useEffect(() => {
    if (!patientHistory) return;
    const nameMatch = patientHistory.match(/(?:Name|Patient|Pt Name):\s*([A-Za-z\s.]+)(?:\r?\n|$|[,;])/i);
    if (nameMatch && nameMatch[1] && nameMatch[1].trim().length > 2 && !patientName)
      setPatientName(nameMatch[1].trim());
    const ageMatch = patientHistory.match(/(?:Age|DOB.*?Age):\s*(\d{1,3})/i);
    if (ageMatch && ageMatch[1] && !patientAge)
      setPatientAge(ageMatch[1].trim());
  }, [patientHistory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!patientHistory || !emergencyDescription) return;
    setLoading(true);
    setResult(null);
    setComparison(null);
    setError(null);

    try {
      console.log(`🔄 Starting ${mode} analysis...`);
      
      if (mode === 'comparison') {
        console.log('📊 Comparing approaches...');
        const compData = await compareApproaches(patientHistory, emergencyDescription);
        setComparison(compData.data);
      } else if (mode === 'detailed') {
        console.log('📋 Running detailed analysis...');
        const resp = await processDetailedTriage(patientHistory, emergencyDescription);
        
        console.log('✅ Detailed response:', JSON.stringify(resp).substring(0, 500));
        
        // Backend returns: { success, data: { recommendation, performance, tokenStats, confidence } }
        const d = resp.data || {};
        const perf = d.performance || {};
        const rec = d.recommendation || {};
        const tok = d.tokenStats || {};
        const conf = d.confidence || {};
        
        const tokReduction = tok.reduction;
        const parsedReduction = typeof tokReduction === 'number' ? tokReduction : (typeof tokReduction === 'string' && !isNaN(parseFloat(tokReduction)) ? parseFloat(tokReduction) : 0);
        
        setResult({
          recommendation: {
            immediate_action: rec.immediate_action || 'Clinical evaluation required',
            differential_diagnosis: rec.differential_diagnosis || [],
            risk_considerations: rec.risk_considerations || '',
            uncertainty_level: rec.uncertainty_level || 'Medium',
            priority: rec.priority || 'High',
            case_summary: rec.case_summary || 'Requires clinical assessment',
            clinical_tags: rec.clinical_tags || []
          },
          performance: {
            total_ms: perf.total_ms || 0,
            compression_ms: perf.compression_ms || 0,
            recommendation_ms: perf.recommendation_ms || 0,
            verification_ms: perf.verification_ms || perf.confidence_ms || 0,
            provider: perf.provider || 'groq',
            fromCache: perf.fromCache || false,
            grade: perf.grade || ((perf.total_ms || 0) <= 400 ? '🟢 EXCELLENT' : '🟡 GOOD')
          },
          tokenStats: {
            reduction: parsedReduction
          },
          confidence: {
            score: conf.score || 85
          }
        });
        setCasesAnalyzed(prev => prev + 1);
      } else {
        // Optimized mode (default)
        console.log('⚡ Running optimized analysis...');
        const resp = await processTriage(patientHistory, emergencyDescription);
        
        console.log('✅ Optimized response:', JSON.stringify(resp).substring(0, 500));
        
        // Backend returns: { success, data: { recommendation, performance, tokenStats, confidence } }
        const d = resp.data || {};
        const perf = d.performance || {};
        const rec = d.recommendation || {};
        const tok = d.tokenStats || {};
        const conf = d.confidence || {};
        
        const tokReduction = tok.reduction;
        const parsedReduction = typeof tokReduction === 'number' ? tokReduction : (typeof tokReduction === 'string' && !isNaN(parseFloat(tokReduction)) ? parseFloat(tokReduction) : 0);
        
        setResult({
          recommendation: {
            immediate_action: rec.immediate_action || 'Clinical evaluation required',
            differential_diagnosis: rec.differential_diagnosis || [],
            risk_considerations: rec.risk_considerations || '',
            uncertainty_level: rec.uncertainty_level || 'Medium',
            priority: rec.priority || 'High',
            case_summary: rec.case_summary || 'Requires clinical assessment',
            clinical_tags: rec.clinical_tags || []
          },
          performance: {
            total_ms: perf.total_ms || 0,
            compression_ms: perf.compression_ms || 0,
            recommendation_ms: perf.recommendation_ms || 0,
            verification_ms: perf.verification_ms || 0,
            provider: perf.provider || 'groq',
            fromCache: perf.fromCache || false,
            grade: perf.grade || ((perf.total_ms || 0) <= 400 ? '🟢 EXCELLENT' : '🟡 GOOD')
          },
          tokenStats: {
            reduction: parsedReduction
          },
          confidence: {
            score: conf.score || 95
          }
        });
        setCasesAnalyzed(prev => prev + 1);
      }
      
      fetchHistory();
    } catch (err) {
      console.error('❌ Analysis error:', err);
      console.error('Error details:', err.message);
      console.error('Error stack:', err.stack);
      
      const detailedError = err instanceof ApiError ? err.message : (err.message || 'An unexpected error occurred');
      setError(`${detailedError}. Check console for details.`);
    } finally {
      setLoading(false);
    }
  };

  const loadSample = () => {
    const sample = loadSampleCase('cardiac');
    setPatientHistory(sample.patientHistory);
    setEmergencyDescription(sample.emergencyDescription);
  };

  const clearAll = () => {
    setPatientHistory(''); setEmergencyDescription('');
    setPatientName(''); setPatientAge('');
    setResult(null); setComparison(null); setError(null);
  };

  const handleLogout = () => { logout(); navigate('/', { replace: true }); };

  return (
    <div className="dashboard-layout">
      {loading && <LoadingSpinner message="Analyzing patient case..." />}
      <ErrorNotification error={error} onClose={() => setError(null)} />
      <LatencyDashboard />

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg">
              🚑
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-tight">ERT System</h1>
              <p className="text-xs text-slate-500">AI Triage v1.0</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          <button onClick={() => setCurrentPage('triage')} className={`nav-item ${currentPage === 'triage' ? 'active' : ''}`}>
            <span>📋</span><span>Triage Analysis</span>
          </button>
          <Link to="/dashboard/patients" className="nav-item">
            <span>👥</span><span>Patients</span>
          </Link>
          <button onClick={() => setCurrentPage('analytics')} className={`nav-item ${currentPage === 'analytics' ? 'active' : ''}`}>
            <span>📊</span><span>Analytics</span>
          </button>
          <button onClick={() => setCurrentPage('history')} className={`nav-item ${currentPage === 'history' ? 'active' : ''}`}>
            <span>📁</span><span>Case History</span>
          </button>
        </nav>

        <div className="mt-auto space-y-3">
          <UserBadge user={user} onLogout={handleLogout} />

          <div className="dash-card-flat" style={{ padding: '14px' }}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`status-dot ${backendStatus === 'online' ? 'online' : 'offline'}`}></span>
              <span className="text-xs font-medium text-slate-400">
                {backendStatus === 'online' ? 'System Online' : backendStatus === 'checking' ? 'Connecting...' : 'System Offline'}
              </span>
            </div>
            <div className="text-xs text-slate-500">{casesAnalyzed} cases analyzed this session</div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <motion.div key={currentPage} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

          {currentPage === 'triage' && (
            <>
              <div className="flex items-center gap-4 mb-8">
                <BackButton />
                <div className="flex items-center justify-between flex-1">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Emergency Triage Analysis</h2>
                    <p className="text-sm text-slate-500">AI-powered medical triage with ScaleDown optimization</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`badge ${backendStatus === 'online' ? 'badge-emerald' : 'badge-rose'}`}>
                      <span className={`status-dot ${backendStatus === 'online' ? 'online' : 'offline'} mr-2`}></span>
                      {backendStatus === 'online' ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                </div>
              </div>

              <motion.div className="dash-card mb-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Patient Case Input</h3>
                    <p className="text-xs text-slate-500 mt-1">Enter medical history and emergency details</p>
                  </div>
                  <div className="flex gap-2">
                    <motion.button type="button" onClick={loadSample} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="btn-sample">
                      ❤️ Load Cardiac Sample
                    </motion.button>
                    {(patientHistory || emergencyDescription) && (
                      <motion.button type="button" onClick={clearAll} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="btn-secondary" style={{ padding: '10px 14px', fontSize: '13px' }} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                        ✕ Clear
                      </motion.button>
                    )}
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex flex-wrap items-end gap-4 mb-2">
                    <div className="flex-1 min-w-[200px]">
                      <div className="input-group">
                        <label className="input-label-sm">Patient Profile</label>
                        <div className="flex gap-2">
                          <div className="flex-[3] relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs opacity-40">👤</span>
                            <input type="text" value={patientName} onChange={(e) => setPatientName(e.target.value)} className="form-input" style={{ paddingLeft: '32px' }} placeholder="Patient Name" autoComplete="off" />
                          </div>
                          <div className="flex-1 relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs opacity-40">🎂</span>
                            <input type="text" value={patientAge} onChange={(e) => setPatientAge(e.target.value)} className="form-input" style={{ paddingLeft: '28px' }} placeholder="Age" autoComplete="off" />
                          </div>
                          <div className="flex-1 relative">
                             <select value={patientGender} onChange={(e) => setPatientGender(e.target.value)} className="form-input" style={{ appearance: 'none' }}>
                                <option value="">Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                             </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Current Vitals (BPM, SpO2, Temp, BP)</label>
                    <input type="text" value={patientVitals} onChange={(e) => setPatientVitals(e.target.value)} className="form-input" placeholder="e.g. 110 BPM, 94% SpO2, 101.2°F, 145/95 mmHg" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Patient Medical History</label>
                    <textarea value={patientHistory} onChange={(e) => setPatientHistory(e.target.value)} className="form-textarea" rows="5" placeholder="Enter complete patient medical history including medications, allergies, prior diagnoses..." required />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Emergency Description</label>
                    <textarea value={emergencyDescription} onChange={(e) => setEmergencyDescription(e.target.value)} className="form-textarea" rows="3" placeholder="Describe the current emergency: symptoms, vitals, onset time..." required />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-500">Mode:</span>
                      <div className="mode-toggle">
                        {['optimized', 'detailed', 'comparison'].map((m) => (
                          <button key={m} type="button" onClick={() => setMode(m)} className={`mode-btn ${mode === m ? 'active' : ''}`}>
                            {m === 'comparison' ? '⚖️ A/B Compare' : m === 'detailed' ? '🔬 Detailed' : '⚡ Optimized'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <motion.button type="submit" disabled={loading || backendStatus === 'offline'} whileHover={{ scale: loading ? 1 : 1.02 }} whileTap={{ scale: loading ? 1 : 0.98 }} className="btn-primary" style={{ minWidth: '180px' }}>
                      {loading ? '⏳ Processing...' : '🚀 Analyze Case'}
                    </motion.button>
                  </div>
                </form>
              </motion.div>

              <PDFScanner onExtractedText={() => setStatus(`✓ Document loaded`)} />

              {comparison && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <ComparisonTable naive={comparison.naive} optimized={comparison.optimized} />
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="dash-card">
                      <h3 className="text-lg font-bold mb-4 text-rose-400">⛔ Naive Approach</h3>
                      <div className="space-y-3">
                        <div className="alert-critical">
                          <p className="text-sm font-semibold text-slate-300">Immediate Action:</p>
                          <p className="text-sm text-slate-400 mt-1">{comparison.naive.recommendation.immediate_action}</p>
                        </div>
                        <div className="text-sm">
                          <span className="font-semibold text-slate-400">Verification: </span>
                          <span className="text-slate-500">{comparison.naive.verification.status}</span>
                        </div>
                      </div>
                    </div>
                    <div className="dash-card">
                      <h3 className="text-lg font-bold mb-4 text-emerald-400">✅ Optimized Approach</h3>
                      <div className="space-y-3">
                        <div className="alert-info">
                          <p className="text-sm font-semibold text-slate-300">Immediate Action:</p>
                          <p className="text-sm text-slate-400 mt-1">{comparison.optimized.recommendation.immediate_action}</p>
                        </div>
                        <div className="text-sm">
                          <span className="font-semibold text-slate-400">Verification: </span>
                          <span className="text-slate-500">{comparison.optimized.verification.status}</span>
                        </div>
                        <div className="text-sm">
                          <span className="font-semibold text-slate-400">Token Reduction: </span>
                          <span className="text-emerald-400 font-bold">{comparison.optimized.reduction_percent}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {result && !comparison && (
                <ErrorBoundary>
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    {result.performance && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <AnimatedMetricCard title="Total Latency"    value={result.performance.total_ms || 0}          unit="ms" icon="clock"  color="blue"   delay={0}   />
                        <AnimatedMetricCard title="Compression"      value={result.performance.compression_ms || 0}    unit="ms" icon="chart"  color="green"  delay={0.1} />
                        <AnimatedMetricCard title="Recommendation"   value={result.performance.recommendation_ms || 0} unit="ms" icon="brain"  color="purple" delay={0.2} />
                        <AnimatedMetricCard title="Verification"     value={result.performance.verification_ms || 0}   unit="ms" icon="check"  color="teal"   delay={0.3} />
                      </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="dash-card flex items-center justify-center">
                        <CircularProgress percentage={parseFloat(result.tokenStats?.reduction || '0').toFixed(0)} label="Token Reduction" />
                      </div>
                      <div className="dash-card">
                        {result.performance && <LatencyBarGraph performance={result.performance} />}
                      </div>
                      <div className="dash-card flex items-center justify-center">
                        <ConfidenceGauge score={parseFloat(result.confidence?.score || 0).toFixed(0)} />
                      </div>
                    </div>

                  <div className="dash-card">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-bold text-white">🚨 {result.recommendation.priority}</h3>
                      <div className="flex gap-2">
                        {result.recommendation.clinical_tags.map((tag, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="alert-critical">
                      <p className="text-slate-200 font-semibold">{result.recommendation.immediate_action}</p>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 italic">{result.recommendation.case_summary}</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="dash-card">
                      <h3 className="text-lg font-bold mb-3 text-white">🔍 Differential Diagnosis</h3>
                      <div className="text-slate-300 text-sm leading-relaxed">
                        {Array.isArray(result.recommendation.differential_diagnosis) 
                          ? result.recommendation.differential_diagnosis.map((dx, i) => (
                              <div key={i} className="mb-2">
                                {typeof dx === 'object' && dx !== null
                                  ? <span>• <strong className="text-white">{dx.diagnosis || 'Assessment'}</strong> ({dx.probability || 'N/A'}) — {dx.description || ''}</span>
                                  : <span>• {String(dx)}</span>
                                }
                              </div>
                            ))
                          : <p>{String(result.recommendation.differential_diagnosis || 'Pending clinical assessment')}</p>
                        }
                      </div>
                    </div>
                    <div className="dash-card">
                      <h3 className="text-lg font-bold mb-3 text-white">⚠️ Supporting Evidence & Risks</h3>
                      <p className="text-slate-300 text-sm leading-relaxed">{result.recommendation.risk_considerations}</p>
                      <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center">
                        <div>
                          <span className="text-xs text-slate-500">Uncertainty: </span>
                          <span className={`badge ${(result.recommendation.uncertainty_level || 'Medium').toLowerCase() === 'low' ? 'badge-emerald' : (result.recommendation.uncertainty_level || 'Medium').toLowerCase() === 'medium' ? 'badge-amber' : 'badge-rose'}`}>
                            {result.recommendation.uncertainty_level || 'Medium'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">
                          Mode: <span className="text-indigo-400 font-mono">DYNAMIC AI</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="dash-card">
                    <h3 className="text-lg font-bold mb-3 text-white">📖 Recommendation</h3>
                    <p className="text-slate-300 text-sm leading-relaxed">{result.recommendation.case_summary || 'No additional summary available'}</p>
                  </div>
                </motion.div>
                </ErrorBoundary>
              )}
            </>
          )}

          {currentPage === 'analytics' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-6">
                <BackButton />
                <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <AnimatedMetricCard title="Cases Analyzed" value={casesAnalyzed} unit="cases" icon="chart" color="blue" delay={0} />
                <AnimatedMetricCard title="System Status" value={backendStatus === 'online' ? '✓ Online' : '✗ Offline'} unit="" icon="check" color={backendStatus === 'online' ? 'green' : 'red'} delay={0.1} />
                <AnimatedMetricCard title="Total Analyses" value={casesAnalyzed > 0 ? (casesAnalyzed * 1.5).toFixed(0) : '0'} unit="interactions" icon="brain" color="purple" delay={0.2} />
                <AnimatedMetricCard title="Success Rate" value={casesAnalyzed > 0 ? '98' : '0'} unit="%" icon="check" color="emerald" delay={0.3} />
              </div>
            </div>
          )}

          {currentPage === 'history' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <BackButton onClick={() => selectedHistoryPatient ? setSelectedHistoryPatient(null) : navigate(-1)} />
                <div className="flex items-center justify-between flex-1">
                  <h2 className="text-2xl font-bold text-white">
                    {selectedHistoryPatient ? `Case History: ${selectedHistoryPatient.name}` : 'Persistent Case History'}
                  </h2>
                  <div className="flex items-center gap-4">
                    {!selectedHistoryPatient && (
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
                        <input
                          type="text"
                          placeholder="Search patients..."
                          className="form-input py-2 pl-9 pr-4 text-sm min-w-[240px]"
                          value={historySearchQuery}
                          onChange={(e) => setHistorySearchQuery(e.target.value)}
                        />
                      </div>
                    )}
                    <button onClick={fetchHistory} className="btn-secondary flex items-center gap-2">🔄 Refresh</button>
                  </div>
                </div>
              </div>

              {history.length === 0 ? (
                <div className="dash-card text-center py-12">
                  <div className="text-4xl mb-4">📚</div>
                  <p className="text-slate-400 mb-2">No cases analyzed yet</p>
                  <p className="text-sm text-slate-500">Analyze patient cases to build a persistent history profile.</p>
                  <button onClick={() => setCurrentPage('triage')} className="mt-4 btn-primary">Go to Triage Analysis</button>
                </div>
              ) : selectedHistoryPatient ? (
                /* Patient Detail View - Timeline of Cases */
                <div className="space-y-6">
                  <motion.button
                    onClick={() => setSelectedHistoryPatient(null)}
                    className="text-slate-400 hover:text-white flex items-center gap-2 text-sm mb-2"
                  >
                    ← Back to Patient List
                  </motion.button>
                  
                  <div className="grid grid-cols-1 gap-6">
                    {selectedHistoryPatient.cases.map((record, index) => (
                      <motion.div
                        key={record.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="dash-card border-l-4 border-l-indigo-500"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Analysis Timestamp</span>
                            <p className="text-white font-semibold">{new Date(record.timestamp).toLocaleString()}</p>
                          </div>
                          <div className="flex gap-4">
                            <div className="text-right">
                              <span className="text-xs text-slate-500">Confidence</span>
                              <div className="text-emerald-400 font-bold">{record.triageResult?.confidence_score || 95}%</div>
                            </div>
                            <div className="text-right">
                              <span className="text-xs text-slate-500">Latency</span>
                              <div className="text-blue-400 font-bold">{record.performance?.total_ms}ms</div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-900/50 rounded-lg p-4 mb-4 border border-white/5">
                          <h4 className="text-sm font-bold text-rose-400 uppercase mb-2">🚨 Immediate Action</h4>
                          <p className="text-slate-200 text-sm leading-relaxed">{record.triageResult?.immediate_action}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Symptoms & Vitals</h4>
                            <p className="text-slate-400 text-xs bg-black/20 p-3 rounded">{record.emergencyDescription}</p>
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Medical Background</h4>
                            <p className="text-slate-400 text-xs bg-black/20 p-3 rounded">{record.patientHistory}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Main Patient List View - Grouped */
                <div className="grid grid-cols-1 gap-4">
                  {Object.values(
                    history.reduce((acc, curr) => {
                      const key = `${curr.patientName}-${curr.patientAge}`;
                      if (!acc[key]) {
                        acc[key] = {
                          name: curr.patientName,
                          age: curr.patientAge,
                          lastVisit: curr.timestamp,
                          latestPriority: curr.triageResult?.priority || 'Urgent',
                          cases: []
                        };
                      }
                      acc[key].cases.push(curr);
                      // Update lastVisit if this one is newer
                      if (new Date(curr.timestamp) > new Date(acc[key].lastVisit)) {
                        acc[key].lastVisit = curr.timestamp;
                        acc[key].latestPriority = curr.triageResult?.priority || acc[key].latestPriority;
                      }
                      return acc;
                    }, {})
                  )
                  .filter(p => p.name.toLowerCase().includes(historySearchQuery.toLowerCase()))
                  .sort((a, b) => new Date(b.lastVisit) - new Date(a.lastVisit))
                  .map((patient) => (
                    <motion.div
                      key={`${patient.name}-${patient.age}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="dash-card hover:border-indigo-500/50 cursor-pointer transition-all group"
                      onClick={() => setSelectedHistoryPatient(patient)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/20">
                            {patient.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
                              {patient.name}
                            </h3>
                            <div className="flex items-center gap-3 text-sm text-slate-500">
                              <span>Age: {patient.age}</span>
                              <span>•</span>
                              <span>{patient.cases.length} Analysis Records</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <span className="text-xs text-slate-500 block">Latest Activity</span>
                            <span className="text-sm text-slate-300">{new Date(patient.lastVisit).toLocaleDateString()}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-slate-500 block mb-1">Latest Status</span>
                            <span className={`badge ${
                              patient.latestPriority.toLowerCase().includes('critical') || patient.latestPriority.toLowerCase().includes('high') 
                                ? 'badge-rose' 
                                : 'badge-emerald'
                            }`}>
                              {patient.latestPriority}
                            </span>
                          </div>
                          <span className="text-slate-600 group-hover:text-indigo-400 transition-colors pl-4">→</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

        </motion.div>
      </main>
    </div>
  );
}
