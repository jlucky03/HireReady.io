import React from 'react';
import { Award, MessageSquare, BookOpen, ChevronLeft, ShieldCheck, Download } from 'lucide-react';

export default function EvaluationReport({ report, onClose }) {
  if (!report) return null;

  // 🌟 BROWSER LOGIC TO SAVE METRICS AS A CLEAN CONSOLIDATED PDF DOCUMENT
  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 p-6 md:p-12 overflow-y-auto font-sans print:bg-white print:text-black print:p-0">
      <div className="max-w-4xl mx-auto space-y-8 print:space-y-6">
        
        {/* Navigation control bar row (Hidden automatically on PDF Compilation outputs) */}
        <div className="flex justify-between items-center border-b border-gray-800 pb-4 select-none print:hidden">
          <button 
            onClick={onClose} 
            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <ChevronLeft size={16} /> Return to Dashboard
          </button>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer"
            >
              <Download size={14} /> Download Report PDF
            </button>
            <div className="flex items-center gap-1.5 text-xs font-mono tracking-widest text-emerald-400 uppercase bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
              <ShieldCheck size={14} /> Audit Completed
            </div>
          </div>
        </div>

        {/* PRINT CAPTION HEADER LAYOUT (Only triggers inside compiled PDF sheets) */}
        <div className="hidden print:block border-b-2 border-gray-300 pb-2 text-center">
          <h1 className="text-2xl font-black uppercase tracking-tight">Intervyo.ai Assessment Registry Record</h1>
          <p className="text-xs text-gray-600">Automated Speech Screening Evaluation Matrix Logs · Topic: {report.topic}</p>
        </div>

        {/* Master Telemetry Analytical Score Section */}
        <div className="bg-[#151D30]/80 border border-gray-800 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden shadow-2xl print:bg-gray-100 print:border-gray-300 print:text-black">
          <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-purple-500 to-blue-500 print:hidden" />
          
          <div className="text-center bg-[#0B0F19] border border-gray-800 px-8 py-6 rounded-2xl shrink-0 shadow-inner select-none print:bg-white print:border-gray-300">
            <span className="block text-[10px] uppercase font-black tracking-widest text-gray-500 print:text-gray-600">Evaluation Grade</span>
            <span className="text-5xl font-black text-purple-400 tracking-tight print:text-purple-700">{report.score}%</span>
          </div>

          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-xl font-bold text-white uppercase tracking-wide print:text-black">Technical Assessment Synthesis</h2>
            <p className="text-xs text-gray-400 leading-relaxed max-w-xl select-text print:text-gray-700">
              {report.overallFeedback || "The multi-round validation loop has evaluated your answers against industry standards. Review question parameters down-sheet to resolve edge-case engineering omissions."}
            </p>
          </div>
        </div>

        {/* ROUND BY ROUND ACCORDION SHEET MATRIX CONTAINER */}
        <div className="space-y-6 print:space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 select-none print:text-black print:text-sm print:border-b print:pb-1">
            Round-by-Round Breakdown Matrix
          </h3>

          {Array.isArray(report.questions) && report.questions.map((q, idx) => (
            <div key={idx} className="bg-[#151D30]/40 border border-gray-800 rounded-2xl p-6 space-y-4 shadow-md transition-all hover:border-gray-700/40 relative print:bg-white print:border-gray-300 print:shadow-none print:break-inside-avoid">
              
              <div className="flex items-center gap-2 select-none">
                <span className="flex items-center justify-center w-5 h-5 bg-purple-600/10 border border-purple-500/20 text-purple-400 rounded-md text-[10px] font-mono font-bold print:bg-gray-200 print:text-black print:border-gray-400">
                  0{idx + 1}
                </span>
                <span className="text-xs font-mono text-gray-400 tracking-wide select-text font-bold print:text-black print:text-xs">
                  {q.question}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 print:grid-cols-1 print:gap-2">
                
                {/* Your Verbal Transcript Card */}
                <div className="bg-[#0B0F19]/60 border border-gray-800/60 p-4 rounded-xl space-y-2 print:bg-gray-50 print:border-gray-200">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-gray-500 flex items-center gap-1 select-none print:text-gray-600">
                    <MessageSquare size={11} /> Your Speech Transcript
                  </span>
                  <p className="text-xs text-gray-300 leading-relaxed font-mono select-text italic print:text-gray-800">
                    "{q.answer || "No verbal stream payload cached for this round option step."}"
                  </p>
                </div>

                {/* AI Recruiter Sample Solutions Output */}
                <div className="bg-purple-950/10 border border-purple-900/20 p-4 rounded-xl space-y-2 print:bg-purple-50 print:bg-opacity-5 print:border-purple-200">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-purple-400 flex items-center gap-1 select-none print:text-purple-700">
                    <BookOpen size={11} /> Ideal Expert Response Solution
                  </span>
                  <p className="text-xs text-purple-200/90 leading-relaxed select-text font-sans print:text-purple-950">
                    {q.idealAnswer || "Ensure to mention standard design patterns, proper caching boundaries, or structural complexity optimizations for this context."}
                  </p>
                </div>

              </div>

              {/* Targeted Correction Metrics footer layout wrapper */}
              <div className="bg-[#0B0F19] border border-gray-800 p-3.5 rounded-xl flex gap-2.5 items-start print:bg-amber-50 print:border-amber-200">
                <Award size={14} className="text-amber-500 shrink-0 mt-0.5 select-none print:text-amber-700" />
                <div className="space-y-0.5">
                  <span className="block text-[9px] uppercase font-bold tracking-wider text-amber-500 select-none print:text-amber-700">Target Correction Metrics</span>
                  <p className="text-xs text-gray-400 leading-relaxed select-text print:text-amber-950">
                    {q.feedback || "Candidate answer tracks basic paradigms but lacks structural keyword delivery markers. Target optimization terminology loops."}
                  </p>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </div>
  );
}