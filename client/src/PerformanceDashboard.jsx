import React from 'react';
import { Award, ChevronRight, CornerDownRight, ThumbsUp, RefreshCw, FileText, ArrowLeft } from 'lucide-react';

export default function PerformanceDashboard({ interview, onReset }) {
  
  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 p-4 md:p-8 print:bg-white print:text-black">
      
      {/* Top Header Row */}
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-800 pb-6 mb-8 gap-4 print:hidden">
        <div className="flex items-center gap-4">
          {/* ---- FULLY WIRED BACK TO DASHBOARD BUTTON ---- */}
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold uppercase tracking-wider px-3.5 py-2.5 rounded-xl border border-gray-700 transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft size={14} /> Dashboard
          </button>
          
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Performance Analytics
            </h1>
            <p className="text-xs text-gray-500 mt-1 font-mono">
              Session Reference: {interview._id}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrintPDF}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold uppercase tracking-wider px-4 py-3 rounded-xl border border-gray-700 transition-colors cursor-pointer"
          >
            <FileText size={14} /> Export Report
          </button>
          <button
            onClick={onReset}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold uppercase tracking-wider px-5 py-3 rounded-xl transition-colors shadow-lg shadow-blue-600/20 cursor-pointer"
          >
            <RefreshCw size={14} /> New Session
          </button>
        </div>
      </div>

      {/* Main Container Layout Grid */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Stats Column */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Circular/Square Big Score Module */}
          <div className="bg-[#151D30] border border-gray-800 rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
            <div className="inline-flex p-4 bg-emerald-500/10 text-emerald-400 rounded-2xl mb-4">
              <Award size={36} />
            </div>
            <p className="text-xs uppercase tracking-widest text-gray-400 font-bold">Overall Skill Score</p>
            <h2 className="text-6xl font-black text-white tracking-tighter mt-2">
              {interview.score}<span className="text-xl text-gray-600 font-medium ml-1">/100</span>
            </h2>
            
            <div className="mt-6 pt-6 border-t border-gray-800/60 grid grid-cols-2 gap-2 text-xs text-gray-400">
              <div className="text-center border-r border-gray-800">
                <span className="block font-bold text-gray-200 uppercase tracking-wide mb-0.5">{interview.difficulty}</span>
                Difficulty
              </div>
              <div className="text-center">
                <span className="block font-bold text-gray-200 tracking-wide mb-0.5">5 Rounds</span>
                Capped Loop
              </div>
            </div>
          </div>

          {/* AI Comprehensive Summary Module */}
          <div className="bg-[#151D30] border border-gray-800 rounded-2xl p-6 shadow-2xl relative">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500 rounded-l-2xl" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-3">Recruiter Synthesis</h3>
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap select-text">
              {interview.finalSummary || "No synthesis compiled."}
            </p>
          </div>
        </div>

        {/* Right Audit Trail Column */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2 mb-4 print:hidden">
            <ChevronRight size={16} className="text-blue-500" /> Response History Timeline
          </h3>

          {interview.turns.map((turn, index) => (
            <div key={index} className="bg-[#151D30] border border-gray-800 rounded-2xl p-6 shadow-2xl space-y-4 relative overflow-hidden print:break-inside-avoid">
              
              {/* Question Header */}
              <div className="flex items-start justify-between gap-4 border-b border-gray-800/40 pb-3">
                <div className="flex items-start gap-3">
                  <span className="text-xs font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-md mt-0.5 shrink-0">
                    Q0{index + 1}
                  </span>
                  <h4 className="text-base font-semibold text-gray-100 leading-snug select-text">
                    {turn.question}
                  </h4>
                </div>
                <span className={`text-xs font-extrabold px-3 py-1.5 rounded-lg shrink-0 ${
                  turn.score >= 75 ? 'bg-green-500/10 text-green-400' : turn.score >= 40 ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'
                }`}>
                  {turn.score} pts
                </span>
              </div>

              {/* User Input Block */}
              <div className="bg-[#0B0F19] border border-gray-800 rounded-xl p-4 text-sm leading-relaxed text-gray-300 select-text">
                <span className="block text-[10px] uppercase tracking-wider text-gray-500 font-mono font-bold mb-1.5">Your Response:</span>
                {turn.answer ? (
                  <p className="italic">"{turn.answer}"</p>
                ) : (
                  <span className="text-gray-600 italic">No response captured.</span>
                )}
              </div>

              {/* Gap Feedback Evaluation */}
              {turn.feedback && (
                <div className="flex gap-3 text-sm text-gray-300 bg-amber-500/5 border border-amber-500/10 p-4 rounded-xl">
                  <CornerDownRight size={16} className="text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider text-amber-400 font-mono font-bold mb-0.5">Gap Diagnosis:</span>
                    <p className="text-gray-300 leading-relaxed">{turn.feedback}</p>
                  </div>
                </div>
              )}

              {/* Improved Code Sample Reference */}
              {turn.improvedAnswer && (
                <div className="bg-[#0B0F19] border border-dashed border-gray-800 rounded-xl p-4 text-xs font-mono text-emerald-400 select-text">
                  <div className="flex items-center gap-2 text-gray-400 font-sans font-bold text-[10px] uppercase tracking-wider mb-2.5">
                    <ThumbsUp size={12} className="text-emerald-500" /> Ideal Reference Benchmark:
                  </div>
                  <pre className="whitespace-pre-wrap bg-black/30 p-3 rounded-lg border border-gray-900 leading-relaxed">{turn.improvedAnswer}</pre>
                </div>
              )}

            </div>
          ))}
        </div>

      </div>
    </div>
  );
}