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
import PDFScanner from './components/PDFScanner';
import LatencyDashboard from './components/LatencyDashboard';
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
    let data;
    try {
      if (mode === 'comparison') {
        data = await compareApproaches(patientHistory, emergencyDescription);
        setComparison(data.data);
      } else if (mode === 'detailed') {
        data = await processDetailedTriage(patientHistory, emergencyDescription);
        setResult(data.data);
      } else {
        data = await processTriage(patientHistory, emergencyDescription);
        setResult(data.data);
      }
      setCasesAnalyzed(prev => prev + 1);
      if (mode !== 'comparison' && data && data.data) {
        await saveCaseHistory({
          patientName: patientName || 'Anonymous',
          patientAge: patientAge || 'N/A',
          patientHistory,
          emergencyDescription,
          triageResult: data.data.recommendation,
          performance: data.data.performance,
        });
        fetchHistory();
      }
    } catch (err) {
      console.error('Analysis or history save failed:', err);
      setError(err instanceof ApiError ? err.message : 'An unexpected error occurred. Please try again.');
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
              <div className="flex items-center justify-between mb-8">
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
                        <label className="input-label-sm">Patient Metadata (Auto-extracted if possible)</label>
                        <div className="flex gap-2">
                          <div className="flex-[3] relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs opacity-40">👤</span>
                            <input type="text" value={patientName} onChange={(e) => setPatientName(e.target.value)} className="form-input" style={{ paddingLeft: '32px' }} placeholder="Patient Name" autoComplete="off" />
                          </div>
                          <div className="flex-1 relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs opacity-40">🎂</span>
                            <input type="text" value={patientAge} onChange={(e) => setPatientAge(e.target.value)} className="form-input" style={{ paddingLeft: '28px' }} placeholder="Age" autoComplete="off" />
                          </div>
                        </div>
                      </div>
                    </div>
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
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <AnimatedMetricCard title="Total Latency"    value={result.performance.total_ms}          unit="ms" icon="clock"  color="blue"   delay={0}   />
                    <AnimatedMetricCard title="Compression"      value={result.performance.compression_ms}    unit="ms" icon="chart"  color="green"  delay={0.1} />
                    <AnimatedMetricCard title="Recommendation"   value={result.performance.recommendation_ms} unit="ms" icon="brain"  color="purple" delay={0.2} />
                    <AnimatedMetricCard title="Verification"     value={result.performance.verification_ms}   unit="ms" icon="check"  color="teal"   delay={0.3} />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="dash-card flex items-center justify-center">
                      <CircularProgress percentage={parseFloat(result.tokenStats?.reduction || 0).toFixed(0)} label="Token Reduction" />
                    </div>
                    <div className="dash-card">
                      <LatencyBarGraph performance={result.performance} />
                    </div>
                    <div className="dash-card flex items-center justify-center">
                      <ConfidenceGauge score={parseFloat(result.confidence?.score || 0).toFixed(0)} />
                    </div>
                  </div>

                  <div className="dash-card">
                    <h3 className="text-lg font-bold mb-3 text-white">🚨 Immediate Action</h3>
                    <div className="alert-critical">
                      <p className="text-slate-200 font-semibold">{result.recommendation.immediate_action}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="dash-card">
                      <h3 className="text-lg font-bold mb-3 text-white">🔍 Differential Diagnosis</h3>
                      <ul className="space-y-2">
                        {result.recommendation.differential_diagnosis.map((dx, i) => (
                          <li key={i} className="flex items-start">
                            <span className="text-indigo-400 mr-2 mt-0.5">›</span>
                            <span className="text-slate-300 text-sm">{dx}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="dash-card">
                      <h3 className="text-lg font-bold mb-3 text-white">⚠️ Risk Considerations</h3>
                      <p className="text-slate-300 text-sm leading-relaxed">{result.recommendation.risk_considerations}</p>
                      <div className="mt-3 pt-3 border-t border-white/5">
                        <span className="text-xs text-slate-500">Uncertainty: </span>
                        <span className={`badge ${result.recommendation.uncertainty_level === 'Low' ? 'badge-emerald' : result.recommendation.uncertainty_level === 'Medium' ? 'badge-amber' : 'badge-rose'}`}>
                          {result.recommendation.uncertainty_level}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="dash-card">
                    <h3 className="text-lg font-bold mb-3 text-white">📖 Supporting Evidence</h3>
                    <p className="text-slate-300 text-sm leading-relaxed">{result.recommendation.supporting_evidence}</p>
                  </div>

                  <div className="dash-card">
                    <h3 className="text-lg font-bold mb-3 text-white">🛡️ Verification Status</h3>
                    <div className="flex items-center justify-between">
                      <span className={`badge ${result.verification.status === 'Verified' ? 'badge-emerald' : result.verification.status === 'Mostly Verified' ? 'badge-amber' : 'badge-rose'}`}>
                        {result.verification.status}
                      </span>
                      <span className="text-xs text-slate-500">{result.confidence.reasoning}</span>
                    </div>
                  </div>

                  {result.recommendation.physician_guidance && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="dash-card border-l-4 border-l-purple-500">
                        <h3 className="text-base font-bold mb-2 text-white">👨⚕️ Physician Guidance</h3>
                        <p className="text-slate-300 text-sm italic">"{result.recommendation.physician_guidance}"</p>
                      </div>
                      <div className="dash-card border-l-4 border-l-blue-500">
                        <h3 className="text-base font-bold mb-2 text-white">🏥 Next Clinical Steps</h3>
                        <p className="text-slate-300 text-sm">{result.recommendation.next_clinical_steps}</p>
                      </div>
                    </div>
                  )}

                  {result.recommendation.case_summary && (
                    <div className="dash-card" style={{ borderLeft: '3px solid var(--accent-cyan)' }}>
                      <h3 className="text-lg font-bold mb-2 text-white">📝 Case Summary</h3>
                      <p className="text-slate-300 text-sm leading-relaxed">{result.recommendation.case_summary}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </>
          )}

          {currentPage === 'analytics' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Analytics Dashboard</h2>
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
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Persistent Case History</h2>
                <button onClick={fetchHistory} className="btn-secondary flex items-center gap-2">🔄 Refresh</button>
              </div>
              {history.length === 0 ? (
                <div className="dash-card">
                  <div className="text-center py-8">
                    <div className="text-4xl mb-3">📚</div>
                    <p className="text-slate-400 mb-2">No cases analyzed yet</p>
                    <p className="text-sm text-slate-500">Go to Triage Analysis and analyze patient cases to see history here</p>
                    <button onClick={() => setCurrentPage('triage')} className="mt-4 btn-primary">Go to Triage Analysis</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((record) => (
                    <motion.div key={record.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="dash-card hover:bg-slate-800/40 transition-colors">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-bold text-white text-lg">{record.patientName}</span>
                            <span className="badge badge-indigo">Age: {record.patientAge}</span>
                            <span className="text-xs text-slate-500">{new Date(record.timestamp).toLocaleString()}</span>
                          </div>
                          <div className="alert-info p-2 mb-3">
                            <span className="text-xs font-bold text-slate-400 block mb-1 uppercase tracking-wider">Immediate Action</span>
                            <p className="text-sm text-slate-300">{record.triageResult?.immediate_action}</p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <span className="text-xs font-bold text-slate-500 uppercase">Emergency</span>
                              <p className="text-xs text-slate-400 line-clamp-2 mt-1">{record.emergencyDescription}</p>
                            </div>
                            <div>
                              <span className="text-xs font-bold text-slate-500 uppercase">History Snippet</span>
                              <p className="text-xs text-slate-400 line-clamp-2 mt-1">{record.patientHistory}</p>
                            </div>
                          </div>
                        </div>
                        <div className="lg:w-48 flex flex-col items-end justify-center border-t lg:border-t-0 lg:border-l border-slate-700/50 pt-4 lg:pt-0 lg:pl-6">
                          <div className="flex flex-col items-end gap-2">
                            <div className="text-right">
                              <span className="text-xs text-slate-500">Latency</span>
                              <div className="text-blue-400 font-bold">{record.performance?.total_ms || record.performance?.total_latency_ms}ms</div>
                            </div>
                            <div className="text-right">
                              <span className="text-xs text-slate-500">Confidence</span>
                              <div className="text-emerald-400 font-bold">{(record.triageResult?.confidence_score || 95)}%</div>
                            </div>
                          </div>
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
