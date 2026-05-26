import React from 'react';
import { FileText, Building2, Terminal, LogOut, History, ArrowRight, Activity } from 'lucide-react';

export default function DashboardHome({ onLaunchInterviewSetup, onLaunchAts, onLaunchGap, onOpenHistory, onLogout }) {
  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 p-6 md:p-8 flex flex-col justify-between">
      <div className="max-w-6xl w-full mx-auto flex-1">
        
        {/* Top Navbar Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-6 mb-12">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-500 bg-clip-text text-transparent">
              Intervyo.ai
            </h1>
            <p className="text-xs text-gray-400 mt-1 font-mono">Unified AI SDE Placement Suite</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenHistory}
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl border border-gray-700 transition-colors cursor-pointer"
            >
              <History size={14} /> View Past Records
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 bg-red-950/20 text-red-400 hover:bg-red-950/40 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl border border-red-900/30 transition-colors cursor-pointer"
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>

        {/* Core Layout Canvas Grid (2 Columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mb-12">
          
          {/* Left Canvas Grid (2/3 Width) - Ingest Diagnostics */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Card 1: ATS Optimization Tracker */}
            <div className="bg-[#151D30] border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between group hover:border-purple-500/40 transition-all duration-300">
              <div>
                <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl inline-block mb-4">
                  <FileText size={24} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">ATS Score Optimization</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Analyze your engineering profile text block. The engine computes structural density, metric tracking, and flags phrasing flaws out of 100.
                </p>
              </div>
              <button 
                onClick={onLaunchAts}
                className="mt-6 flex items-center gap-1 text-xs font-bold text-purple-400 tracking-wider group-hover:translate-x-1 transition-transform cursor-pointer text-left"
              >
                RUN ATS ANALYSIS <ArrowRight size={14} />
              </button>
            </div>

            {/* Card 2: Company Tech Gap Bridge */}
            <div className="bg-[#151D30] border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between group hover:border-amber-500/40 transition-all duration-300">
              <div>
                <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl inline-block mb-4">
                  <Building2 size={24} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Corporate Gap Analyzer</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Map your profile against specific companies (Google, Meta, TCS). Isolate missing stack keywords or tool vectors instantly.
                </p>
              </div>
              <button 
                onClick={onLaunchGap}
                className="mt-6 flex items-center gap-1 text-xs font-bold text-amber-400 tracking-wider group-hover:translate-x-1 transition-transform cursor-pointer text-left"
              >
                AUDIT COMPANY EXPECTATIONS <ArrowRight size={14} />
              </button>
            </div>

          </div>

          {/* Right Canvas Grid (1/3 Width) - Execution Launchpad */}
          <div className="lg:col-span-1">
            <div className="bg-[#151D30] border border-blue-900/40 rounded-2xl p-6 shadow-xl flex flex-col justify-between group hover:border-blue-600 transition-all duration-300 relative overflow-hidden h-full">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
              <div>
                <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl inline-block mb-4">
                  <Terminal size={24} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Placement Room</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Open an interactive coding lab. Practice weak target topics using a **Timed Monaco IDE Sandbox** with integrated real-time audio dictation.
                </p>
              </div>
              <button 
                onClick={onLaunchInterviewSetup}
                className="mt-8 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs tracking-wider px-5 py-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-600/10 w-full"
              >
                ENTER PLACEMENT ROOM <ArrowRight size={14} />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Consistency Strip: Activity Heatmap Placeholder */}
      <div className="max-w-6xl w-full mx-auto bg-[#151D30] border border-gray-800 rounded-2xl p-5 shadow-2xl shrink-0">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-400 mb-3">
          <Activity size={14} /> Daily Practice Consistency Tracker
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {Array.from({ length: 53 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1 shrink-0">
              {Array.from({ length: 7 }).map((_, j) => {
                // Generate pseudo random contribution hues
                const hues = ['bg-gray-800/40', 'bg-gray-800/40', 'bg-emerald-900/30', 'bg-emerald-700/60', 'bg-emerald-500'];
                const randomHue = hues[Math.floor(Math.random() * hues.length)];
                return (
                  <div 
                    key={j} 
                    className={`w-3 h-3 rounded-sm transition-colors hover:scale-110 duration-150 ${randomHue}`}
                    title="System metric captured" 
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}