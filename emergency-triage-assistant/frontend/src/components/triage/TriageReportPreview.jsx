import React from 'react';
import { X, Printer, Download, Clipboard, User, Calendar, Activity, ShieldAlert } from 'lucide-react';

const TriageReportPreview = ({ isOpen, onClose, data, patient }) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const severityStyles = {
    HIGH: { color: '#ef4444', bg: '#fee2e2' },
    MEDIUM: { color: '#f59e0b', bg: '#fef3c7' },
    LOW: { color: '#22c55e', bg: '#dcfce7' }
  };

  const style = severityStyles[data.priority] || severityStyles.LOW;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl h-[90vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header - Not Printable */}
        <div className="p-4 border-b flex justify-between items-center bg-gray-50 print:hidden">
          <div className="flex items-center gap-3">
             <div className="bg-indigo-600 p-2 rounded-lg">
                <Clipboard className="w-5 h-5 text-white" />
             </div>
             <div>
               <h2 className="text-gray-900 font-bold">Report Preview</h2>
               <p className="text-xs text-gray-500">Review and download medical report</p>
             </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-semibold"
            >
              <Printer className="w-4 h-4" /> Print / PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Report Content - This is the printable area */}
        <div className="flex-1 overflow-y-auto p-8 print:p-0 bg-gray-50 print:bg-white report-container">
          <div className="bg-white mx-auto max-w-3xl shadow-sm border border-gray-100 print:border-none print:shadow-none p-10 min-h-full">
            
            {/* Medical Facility Header */}
            <div className="flex justify-between items-start border-b-2 border-indigo-600 pb-6 mb-8">
               <div>
                  <h1 className="text-2xl font-black text-indigo-900 tracking-tight">ERT SYSTEM</h1>
                  <p className="text-xs font-bold text-indigo-600 uppercase tracking-[0.2em]">Emergency Response & Triage</p>
               </div>
               <div className="text-right">
                  <div className="text-sm font-bold text-gray-900">Medical Analysis Report</div>
                  <div className="text-xs text-gray-500">Case ID: #REP-{Math.floor(Math.random() * 90000) + 10000}</div>
                  <div className="text-xs text-gray-500">Date: {new Date().toLocaleDateString()}</div>
               </div>
            </div>

            {/* Patient Info Bar */}
            <div className="grid grid-cols-4 gap-4 mb-8 bg-gray-50 p-4 rounded-xl border border-gray-100">
               <div className="space-y-1">
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Patient Name</div>
                  <div className="text-sm font-bold text-gray-800">{patient.name}</div>
               </div>
               <div className="space-y-1">
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Age / Gender</div>
                  <div className="text-sm font-medium text-gray-800">{patient.age}Y / {patient.gender}</div>
               </div>
               <div className="space-y-1">
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Blood Group</div>
                  <div className="text-sm font-medium text-gray-800">{patient.bloodGroup}</div>
               </div>
               <div className="space-y-1">
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Patient ID</div>
                  <div className="text-sm font-medium text-gray-800">{patient.id}</div>
               </div>
            </div>

            {/* Triage Status */}
            <div className="mb-8 overflow-hidden rounded-xl border-2" style={{ borderColor: style.color }}>
               <div className="px-6 py-4 flex items-center justify-between" style={{ background: style.color }}>
                  <div className="text-white font-black text-xl tracking-wide">{data.priority} PRIORITY</div>
                  <div className="text-white/80 text-xs font-bold bg-white/10 px-3 py-1 rounded-full border border-white/20 uppercase">
                     AI Verified Analysis
                  </div>
               </div>
               <div className="p-6 bg-white">
                  <div className="text-[11px] font-extrabold text-gray-400 uppercase mb-2 tracking-widest">Reasoning & Assessment</div>
                  <p className="text-gray-800 leading-relaxed text-sm font-medium">
                    {data.severityReason}
                  </p>
               </div>
            </div>

            {/* Clinical Details */}
            <div className="grid grid-cols-2 gap-8 mb-8">
               <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-black text-indigo-900 uppercase border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
                       <Activity className="w-3 h-3" /> Triage Vitals
                    </h3>
                    <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                        {Object.entries(data.rawInput?.vitals || {}).map(([key, val]) => (
                          <div key={key} className="flex justify-between border-b border-gray-50 py-1">
                             <span className="text-[10px] text-gray-500 font-bold uppercase">{key}</span>
                             <span className="text-xs font-black text-gray-800">{val || '--'}</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-black text-indigo-900 uppercase border-b border-gray-100 pb-2 mb-4">Probable Diagnosis</h3>
                    <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100">
                       <p className="text-sm font-bold text-indigo-900">{data.probableDiagnosis}</p>
                    </div>
                  </div>
               </div>

               <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-black text-indigo-900 uppercase border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
                       <ShieldAlert className="w-3 h-3" /> Immediate Actions
                    </h3>
                    <div className="space-y-2">
                       {data.immediateActions?.map((action, i) => (
                         <div key={i} className="flex items-start gap-3 bg-gray-50 p-2 rounded-lg text-xs text-gray-700 font-medium">
                            <span className="bg-indigo-600 text-white w-4 h-4 rounded flex items-center justify-center text-[9px] flex-shrink-0">{i+1}</span>
                            {action}
                         </div>
                       ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-black text-indigo-900 uppercase border-b border-gray-100 pb-2 mb-4">Clinical Observations</h3>
                    <div className="bg-white p-3 rounded-lg border border-gray-100">
                       <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Chief Complaint</div>
                       <p className="text-xs text-gray-700 line-clamp-3">{data.rawInput?.chiefComplaint}</p>
                    </div>
                  </div>
               </div>
            </div>

            {/* Footer Sign-off */}
            <div className="mt-16 pt-8 border-t border-gray-200">
               <div className="grid grid-cols-2">
                  <div className="text-[10px] text-gray-400 space-y-1">
                     <p>Electronic Verification: ERT-SYS-AI-GROQ</p>
                     <p>Time Generated: {new Date().toLocaleTimeString()}</p>
                  </div>
                  <div className="text-right">
                     <div className="inline-block w-40 border-b border-gray-800 mb-2"></div>
                     <p className="text-[10px] font-bold text-gray-800 uppercase">On-Duty Medical Officer Signature</p>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Global Print Styles */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body * {
              visibility: hidden;
            }
            .report-container, .report-container * {
              visibility: visible;
            }
            .report-container {
              position: absolute;
              left: 0;
              top: 0;
              width: 100% !important;
              padding: 0 !important;
              margin: 0 !important;
              background: white !important;
            }
            .report-container > div {
              width: 100% !important;
              max-width: 100% !important;
              border: none !important;
              box-shadow: none !important;
              margin: 0 !important;
            }
            @page {
              margin: 0.5cm;
            }
          }
        `}} />
      </div>
    </div>
  );
};

export default TriageReportPreview;
