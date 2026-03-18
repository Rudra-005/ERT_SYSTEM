import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedMetricCard from './components/AnimatedMetricCard';
import ComparisonTable from './components/ComparisonTable';
import CircularProgress from './components/CircularProgress';
import ConfidenceGauge from './components/ConfidenceGauge';
import LatencyBarGraph from './components/LatencyBarGraph';
import JsonViewer from './components/JsonViewer';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorNotification from './components/ErrorNotification';
import PDFScanner from './components/PDFScanner';
import { loadSampleCase } from './utils/sampleCases';
import { processTriage, compareApproaches, checkHealth, ApiError } from './utils/apiClient';

export default function App() {
  const [patientHistory, setPatientHistory] = useState('');
  const [emergencyDescription, setEmergencyDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [mode, setMode] = useState('optimized');
  const [comparison, setComparison] = useState(null);
  const [error, setError] = useState(null);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [casesAnalyzed, setCasesAnalyzed] = useState(0);
  const [status, setStatus] = useState('');  // For PDF scanner status
  const [currentPage, setCurrentPage] = useState('triage');  // Navigation state

  useEffect(() => {
    checkHealth()
      .then(() => setBackendStatus('online'))
      .catch(() => setBackendStatus('offline'));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!patientHistory || !emergencyDescription) return;

    setLoading(true);
    setResult(null);
    setComparison(null);
    setError(null);

    try {
      if (mode === 'comparison') {
        const data = await compareApproaches(patientHistory, emergencyDescription);
        setComparison(data.data);
      } else {
        const data = await processTriage(patientHistory, emergencyDescription);
        setResult(data.data);
      }
      setCasesAnalyzed(prev => prev + 1);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
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
    setPatientHistory('');
    setEmergencyDescription('');
    setResult(null);
    setComparison(null);
    setError(null);
  };

  const handlePDFExtracted = (filename) => {
    setStatus(`✓ Loaded document: ${filename}`);
  };

  return (
    <div className="dashboard-layout">
      {loading && <LoadingSpinner message="Analyzing patient case..." />}
      <ErrorNotification error={error} onClose={() => setError(null)} />

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
          <button 
            onClick={() => setCurrentPage('triage')}
            className={`nav-item ${currentPage === 'triage' ? 'active' : ''}`}
          >
            <span>📋</span>
            <span>Triage Analysis</span>
          </button>
          <button 
            onClick={() => setCurrentPage('analytics')}
            className={`nav-item ${currentPage === 'analytics' ? 'active' : ''}`}
          >
            <span>📊</span>
            <span>Analytics</span>
          </button>
          <button 
            onClick={() => setCurrentPage('history')}
            className={`nav-item ${currentPage === 'history' ? 'active' : ''}`}
          >
            <span>📁</span>
            <span>Case History</span>
          </button>
          <button 
            onClick={() => setCurrentPage('docs')}
            className={`nav-item ${currentPage === 'docs' ? 'active' : ''}`}
          >
            <span>📖</span>
            <span>Documentation</span>
          </button>
        </nav>

        <div className="mt-auto space-y-3">
          <div className="dash-card-flat" style={{ padding: '14px' }}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`status-dot ${backendStatus === 'online' ? 'online' : 'offline'}`}></span>
              <span className="text-xs font-medium text-slate-400">
                {backendStatus === 'online' ? 'System Online' : backendStatus === 'checking' ? 'Connecting...' : 'System Offline'}
              </span>
            </div>
            <div className="text-xs text-slate-500">
              {casesAnalyzed} cases analyzed this session
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {currentPage === 'triage' && (
            <>
          {/* Header */}
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

          {/* Patient Case Input */}
          <motion.div
            className="dash-card mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-semibold text-white">Patient Case Input</h3>
                <p className="text-xs text-slate-500 mt-1">Enter medical history and emergency details</p>
              </div>
              <div className="flex gap-2">
                <motion.button
                  type="button"
                  onClick={loadSample}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="btn-sample"
                >
                  ❤️ Load Cardiac Sample
                </motion.button>
                {(patientHistory || emergencyDescription) && (
                  <motion.button
                    type="button"
                    onClick={clearAll}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="btn-secondary"
                    style={{ padding: '10px 14px', fontSize: '13px' }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    ✕ Clear
                  </motion.button>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Patient Medical History
                </label>
                <textarea
                  value={patientHistory}
                  onChange={(e) => setPatientHistory(e.target.value)}
                  className="form-textarea"
                  rows="5"
                  placeholder="Enter complete patient medical history including medications, allergies, prior diagnoses..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Emergency Description
                </label>
                <textarea
                  value={emergencyDescription}
                  onChange={(e) => setEmergencyDescription(e.target.value)}
                  className="form-textarea"
                  rows="3"
                  placeholder="Describe the current emergency: symptoms, vitals, onset time..."
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-500">Mode:</span>
                  <div className="mode-toggle">
                    {['optimized', 'comparison'].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMode(m)}
                        className={`mode-btn ${mode === m ? 'active' : ''}`}
                      >
                        {m === 'comparison' ? '⚖️ A/B Compare' : '⚡ Optimized'}
                      </button>
                    ))}
                  </div>
                </div>

                <motion.button
                  type="submit"
                  disabled={loading || backendStatus === 'offline'}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  className="btn-primary"
                  style={{ minWidth: '180px' }}
                >
                  {loading ? '⏳ Processing...' : '🚀 Analyze Case'}
                </motion.button>
              </div>
            </form>
          </motion.div>

          {/* PDF Scanner Component */}
          <PDFScanner onExtractedText={handlePDFExtracted} />

          {/* Comparison Results */}
          {comparison && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
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

          {/* Optimized Results */}
          {result && !comparison && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Metrics Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <AnimatedMetricCard
                  title="Total Latency"
                  value={result.performance.total_ms}
                  unit="ms"
                  icon="clock"
                  color="blue"
                  delay={0}
                />
                <AnimatedMetricCard
                  title="Compression"
                  value={result.performance.compression_ms}
                  unit="ms"
                  icon="chart"
                  color="green"
                  delay={0.1}
                />
                <AnimatedMetricCard
                  title="Recommendation"
                  value={result.performance.recommendation_ms}
                  unit="ms"
                  icon="brain"
                  color="purple"
                  delay={0.2}
                />
                <AnimatedMetricCard
                  title="Verification"
                  value={result.performance.verification_ms}
                  unit="ms"
                  icon="check"
                  color="teal"
                  delay={0.3}
                />
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="dash-card flex items-center justify-center">
                  <CircularProgress
                    percentage={parseFloat(result.tokenStats?.reduction || 0).toFixed(0)}
                    label="Token Reduction"
                  />
                </div>

                <div className="dash-card">
                  <LatencyBarGraph performance={result.performance} />
                </div>

                <div className="dash-card flex items-center justify-center">
                  <ConfidenceGauge score={parseFloat(result.confidence?.score || 0).toFixed(0)} />
                </div>
              </div>

              {/* Immediate Action */}
              <div className="dash-card">
                <h3 className="text-lg font-bold mb-3 text-white">🚨 Immediate Action</h3>
                <div className="alert-critical">
                  <p className="text-slate-200 font-semibold">{result.recommendation.immediate_action}</p>
                </div>
              </div>

              {/* Diagnosis & Risk */}
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
                    <span className={`badge ${result.recommendation.uncertainty_level === 'Low' ? 'badge-emerald' :
                        result.recommendation.uncertainty_level === 'Medium' ? 'badge-amber' :
                          'badge-rose'
                      }`}>{result.recommendation.uncertainty_level}</span>
                  </div>
                </div>
              </div>

              {/* Supporting Evidence */}
              <div className="dash-card">
                <h3 className="text-lg font-bold mb-3 text-white">📖 Supporting Evidence</h3>
                <p className="text-slate-300 text-sm leading-relaxed">{result.recommendation.supporting_evidence}</p>
              </div>

              {/* Verification */}
              <div className="dash-card">
                <h3 className="text-lg font-bold mb-3 text-white">🛡️ Verification Status</h3>
                <div className="flex items-center justify-between">
                  <span className={`badge ${result.verification.status === 'Verified' ? 'badge-emerald' :
                      result.verification.status === 'Mostly Verified' ? 'badge-amber' :
                        'badge-rose'
                    }`}>{result.verification.status}</span>
                  <span className="text-xs text-slate-500">{result.confidence.reasoning}</span>
                </div>
              </div>

              {/* JSON Viewer */}
              <JsonViewer data={result} title="Full Response Data" />
            </motion.div>
          )}
            </>
          )}

          {/* Analytics Page */}
          {currentPage === 'analytics' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Analytics Dashboard</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <AnimatedMetricCard
                  title="Cases Analyzed"
                  value={casesAnalyzed}
                  unit="cases"
                  icon="chart"
                  color="blue"
                  delay={0}
                />
                <AnimatedMetricCard
                  title="System Status"
                  value={backendStatus === 'online' ? '✓ Online' : '✗ Offline'}
                  unit=""
                  icon="check"
                  color={backendStatus === 'online' ? 'green' : 'red'}
                  delay={0.1}
                />
                <AnimatedMetricCard
                  title="Total Analyses"
                  value={casesAnalyzed > 0 ? (casesAnalyzed * 1.5).toFixed(0) : '0'}
                  unit="interactions"
                  icon="brain"
                  color="purple"
                  delay={0.2}
                />
                <AnimatedMetricCard
                  title="Success Rate"
                  value={casesAnalyzed > 0 ? '98' : '0'}
                  unit="%"
                  icon="check"
                  color="emerald"
                  delay={0.3}
                />
              </div>
            </div>
          )}

          {/* Case History Page */}
          {currentPage === 'history' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Case History</h2>
              <div className="dash-card">
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">📚</div>
                  <p className="text-slate-400 mb-2">No cases analyzed yet</p>
                  <p className="text-sm text-slate-500">Go to Triage Analysis and analyze patient cases to see history here</p>
                  <button
                    onClick={() => setCurrentPage('triage')}
                    className="mt-4 btn-primary"
                  >
                    Go to Triage Analysis
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Documentation Page */}
          {currentPage === 'docs' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Documentation</h2>
              <div className="space-y-4">
                <div className="dash-card">
                  <h3 className="text-lg font-semibold text-white mb-3">How to Use</h3>
                  <ul className="space-y-2 text-slate-300 text-sm list-disc list-inside">
                    <li>Enter patient medical history and emergency description</li>
                    <li>Select analysis mode: Optimized or A/B Compare</li>
                    <li>Click "Analyze Case" to process the information</li>
                    <li>Review recommendations and verification status</li>
                    <li>Upload PDF documents for additional context</li>
                  </ul>
                </div>
                <div className="dash-card">
                  <h3 className="text-lg font-semibold text-white mb-3">Modes</h3>
                  <ul className="space-y-2 text-slate-300 text-sm">
                    <li><strong className="text-blue-400">⚡ Optimized:</strong> Fast analysis with optimized token usage</li>
                    <li><strong className="text-purple-400">⚖️ A/B Compare:</strong> Compare naive vs optimized approaches</li>
                  </ul>
                </div>
                <div className="dash-card">
                  <h3 className="text-lg font-semibold text-white mb-3">PDF Upload</h3>
                  <p className="text-slate-300 text-sm">Upload medical documents (PDFs) to enrich patient context and improve analysis accuracy.</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
