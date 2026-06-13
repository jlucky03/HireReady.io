import React, { useState } from 'react';
import BuyCredits from "./BuyCredits";
import PaymentHistory from "./PaymentHistory";
import {
  FileText,
  Volume2,
  Upload,
  History,
  Award,
  UserCheck,
  Cpu,
  ClipboardCheck,
  Play
} from "lucide-react";
import { auth } from "./firebase";
import { useAuthStore } from "./store/authStore";

export default function DashboardHome({ onStartInterview, onViewReport, history = [], showToast }) {
  const [file, setFile] = useState(null);
  const { user: authUser, setUser } = useAuthStore();
  const [loadingAts, setLoadingAts] = useState(false);
  const [atsResult, setAtsResult] = useState(null);
  const [cachedResumeText, setCachedResumeText] = useState(""); 
  const [showHistoryModal, setShowHistoryModal] = useState(false); 
  const [showBuyCredits, setShowBuyCredits] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);

  // Selection configurations
  const [selectedTopic, setSelectedTopic] = useState('MERN Stack');
  const [interviewMode, setInterviewMode] = useState('standard'); 
  const [selectedDifficulty, setSelectedDifficulty] = useState('Medium');
  



  const user = auth.currentUser;

const userName =
  authUser?.name ||
  user?.displayName ||
  "Candidate";

const userEmail =
  authUser?.email ||
  user?.email ||
  "";

const userAvatar =
  user?.photoURL ||
  `https://ui-avatars.com/api/?name=${encodeURIComponent(
    userName
  )}&background=6D28D9&color=fff`;

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleCheckAts = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoadingAts(true);
    setAtsResult(null);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/resume/analyze', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'ATS execution pipeline rejection.');

setAtsResult(data.atsAnalysis);
setCachedResumeText(data.extractedText || "");

if (data.cached) {
  showToast("⚡ Redis Cache Hit — skipped AI processing.");
} else {
  showToast("🚀 AI analysis completed and cached.");
}
      
      if (typeof data.remainingCredits === "number") {
  setUser({ ...authUser, credits: data.remainingCredits });
}

      if (data.extractedText) {
        setInterviewMode('resume');
      }
    } catch (err) {
      showToast(err.message || "ATS analysis failed.");
    } finally {
      // ✅ FIXED TYPO HERE: Corrected from 'fillAll' to standard 'finally' block
      setLoadingAts(false);
    }
  };

 const handleLaunchVoiceSession = () => {
  if (authUser?.credits < 3) {
    showToast("You need at least 3 credits to start an interview.");
    return;
  }

  if (interviewMode === 'resume' && !cachedResumeText) {
    showToast("Please run ATS resume scan first.");
    return;
  }

  const focusPayload =
    interviewMode === 'resume'
      ? `RESUME_DATA_STREAM: ${cachedResumeText}`
      : selectedTopic;

  onStartInterview(focusPayload, selectedDifficulty.toLowerCase());
};
  const formatTopicTitle = (title) => {
    if (!title) return "Technical Interview";
    if (title.startsWith("RESUME_DATA_STREAM") || title.length > 40) {
      return "Personal Resume Screen";
    }
    return title;
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 p-6 md:p-12 overflow-y-auto font-sans relative">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* UPPER DASHBOARD HEADER BAR */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-5 border-b border-gray-800 pb-6">

  <div className="text-center lg:text-left space-y-1">
    <h1 className="text-4xl font-black text-white tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
      HireReady AI
    </h1>
    <p className="text-xs text-gray-400 max-w-xl">
      AI-powered interview preparation, ATS optimization and technical skill assessment platform.
    </p>
  </div>

  <div className="flex items-center gap-3">

    {/* Credits */}
    <div className="bg-[#151D30] border border-yellow-500/20 px-4 py-2 rounded-xl">
      <p className="text-[10px] uppercase text-gray-500">Credits</p>
 <p className={`text-lg font-bold ${
  (authUser?.credits ?? 0) >= 3
    ? "text-emerald-400"
    : "text-yellow-400"
}`}>{authUser?.credits ?? 0}</p>
<p className="text-[9px] text-gray-500 mt-1">
  3 credits / interview • 1 credit / ATS
</p>
    </div>

    {/* User */}
    <div className="flex items-center gap-3 bg-[#151D30] border border-gray-800 px-3 py-2 rounded-xl">
      <img
        src={userAvatar}
        alt="avatar"
        className="w-11 h-11 rounded-full border border-purple-500/30"
      />

      <div className="hidden sm:block text-left">
        <p className="text-sm font-semibold text-white truncate max-w-[160px]">
          {userName}
        </p>
        <p className="text-[11px] text-gray-500 truncate max-w-[160px]">
          {userEmail}
        </p>
      </div>
    </div>

    {/* History */}
    <button
      onClick={() => setShowHistoryModal(true)}
      className="flex items-center gap-1.5 bg-[#151D30] hover:bg-gray-800 text-purple-400 hover:text-purple-300 text-xs font-bold uppercase tracking-wider px-4 py-3 rounded-xl border border-gray-800 transition-all"
    >
      <History size={14} />
      History
    </button>

    <button
  onClick={() => setShowBuyCredits(true)}
  className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider px-4 py-3 rounded-xl"
>
  Buy Credits
</button>

<button
  onClick={() => setShowPaymentHistory(true)}
  className="bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold uppercase py-2.5 px-4 rounded-xl"
>
  Billing History
</button>

  </div>
</div>

        {/* LAYOUT GRID VECTOR PANELS */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* STEP 1: INSTANT ATS RESUME CALCULATOR */}
          <div className="bg-[#151D30]/60 border border-gray-800/80 rounded-2xl p-6 flex flex-col justify-between text-center relative overflow-hidden transition-all hover:bg-[#151D30] hover:border-gray-700/60">
            <div className="space-y-4">
              <div className="inline-flex mx-auto bg-gray-800/40 border border-gray-700/60 text-gray-400 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full select-none">
                Step 1
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto border border-blue-500/10">
                <FileText size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-wide">Resume ATS Optimizer</h3>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed px-2">
                  Drop your PDF resume directly into the vector analyzer to compute instant match scores and project corrections.
                </p>
              </div>

              <form onSubmit={handleCheckAts} className="space-y-2 pt-2">
                <div className="border border-dashed border-gray-800 hover:border-gray-700 bg-[#0B0F19]/60 rounded-xl p-3 text-center relative transition-colors">
                  <input type="file" accept=".pdf" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <Upload size={14} className="mx-auto text-gray-500 mb-1" />
                  <span className="block text-[10px] text-gray-300 truncate max-w-[180px] mx-auto">
                    {file ? file.name : "Choose PDF Layout"}
                  </span>
                </div>
             <button
  type="submit"
  disabled={loadingAts || !file}
  className={`w-full text-white text-[11px] font-bold uppercase tracking-wider py-2.5 rounded-xl transition-all shadow-md ${
    loadingAts || !file
      ? "bg-blue-600/50 cursor-not-allowed"
      : "bg-blue-600 hover:bg-blue-500 cursor-pointer"
  }`}
>
  {loadingAts ? "Parsing Clusters..." : "Calculate ATS Match"}
</button>
              </form>
            </div>
          </div>

          {/* STEP 2: VOICE INTERVIEW MATRIX */}
          <div className="bg-[#151D30]/60 border border-gray-800/80 rounded-2xl p-6 flex flex-col justify-between text-center relative overflow-hidden transition-all hover:bg-[#151D30] hover:border-gray-700/60">
            <div className="space-y-4">
              <div className="inline-flex mx-auto bg-gray-800/40 border border-gray-700/60 text-gray-400 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full select-none">
                Step 2
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto border border-purple-500/10">
                <Volume2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-wide">Smart Voice Interview</h3>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed px-2">
                  Launch a low-latency voice session. Complete conversational tech screening using standard topics or your uploaded profile.
                </p>
              </div>

              <div className="flex bg-[#0B0F19] p-1 rounded-xl border border-gray-800 text-[10px] font-bold uppercase tracking-wider select-none">
                <button type="button" onClick={() => setInterviewMode('standard')} className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${interviewMode === 'standard' ? 'bg-purple-600 text-white' : 'text-gray-400'}`}>
                  Standard Topic
                </button>
                <button
  type="button"
  disabled={!cachedResumeText}
  onClick={() => setInterviewMode("resume")}
  className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
    !cachedResumeText
      ? "opacity-50 cursor-not-allowed text-gray-500"
      : interviewMode === "resume"
      ? "bg-purple-600 text-white"
      : "text-gray-400"
  }`}
>
  <UserCheck size={11} /> From Resume
</button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 text-left">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-gray-500 tracking-wide">Focus Target</label>
                  {interviewMode === 'resume' ? (
                    <div className="w-full bg-[#0B0F19]/40 border border-purple-900/20 px-2 py-2 rounded-lg text-[10px] text-purple-400 font-medium tracking-wide truncate select-none">
                      ✨ Resume Loaded
                    </div>
                  ) : (
                    <select value={selectedTopic} onChange={(e) => setSelectedTopic(e.target.value)} className="w-full bg-[#0B0F19] border border-gray-800 px-2 py-1.5 rounded-lg text-[11px] font-mono text-gray-300 focus:outline-none cursor-pointer">
                      <option value="MERN Stack">MERN Engine</option>
                      <option value="SDE Role">SDE Core</option>
                      <option value="System Design">Architecture</option>
                    </select>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-gray-500 tracking-wide">Seniority</label>
                  <select value={selectedDifficulty} onChange={(e) => setSelectedDifficulty(e.target.value)} className="w-full bg-[#0B0F19] border border-gray-800 px-2 py-1.5 rounded-lg text-[11px] font-mono text-gray-300 focus:outline-none cursor-pointer">
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>
            </div>
            <button type="button" onClick={handleLaunchVoiceSession} className="w-full mt-4 bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold uppercase tracking-wider py-2.5 rounded-xl shadow-md transition-all cursor-pointer">
              Launch Interview
            </button>
          </div>

        </div>

        {/* --- INLINE ATS OUTPUT VIEW --- */}
        {atsResult && (
          <div className="bg-[#151D30] border border-gray-800 rounded-2xl p-6 space-y-6 shadow-2xl animate-fade-in relative">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
            <div className="flex flex-col sm:flex-row sm:items-center gap-6 border-b border-gray-800/60 pb-4">
              <div className="text-center bg-[#0B0F19] border border-gray-800 px-6 py-4 rounded-xl shrink-0 select-none">
                <span className="block text-[10px] uppercase font-bold tracking-wider text-gray-500">ATS Score</span>
                <span className="text-4xl font-black text-emerald-400 tracking-tight">{atsResult.score}%</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2"><Cpu size={16} className="text-blue-400" /> Advanced Core Parser Extraction Synthesis</h4>
                <p className="text-xs text-gray-400 leading-relaxed mt-1 select-text">{atsResult.summary}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h5 className="text-[10px] uppercase font-bold tracking-widest text-amber-400 select-none">Targeted Bullet-Point & Project Improvements:</h5>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Array.isArray(atsResult.improvements) ? (
                  atsResult.improvements.map((item, idx) => (
                    <li key={idx} className="flex gap-2.5 text-xs text-gray-300 bg-[#0B0F19] border border-gray-800/40 p-3.5 rounded-xl leading-relaxed select-text">
                      <Award size={14} className="text-blue-500 shrink-0 mt-0.5" />
                      <span>
  {typeof item === "string"
    ? item
    : item?.suggest || item?.project || JSON.stringify(item)}
</span>
                    </li>
                  ))
                ) : (
                  <li className="flex gap-2.5 text-xs text-gray-300 bg-[#0B0F19] border border-gray-800/40 p-3.5 rounded-xl leading-relaxed select-text">
                    <Award size={14} className="text-blue-500 shrink-0 mt-0.5" />
                    <span>{atsResult.improvements}</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* HISTORICAL REGISTRY OVERLAY MODAL */}
        {showHistoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-[#151D30] border border-gray-800 rounded-2xl max-w-3xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl">
              <div className="flex justify-between items-center border-b border-gray-800/60 pb-3">
                <h3 className="text-sm font-black uppercase tracking-widest text-purple-400 flex items-center gap-2">
                  <History size={16} /> Historical Evaluation Session Log Registry
                </h3>
                <button 
                  onClick={() => setShowHistoryModal(false)}
                  className="text-gray-500 hover:text-white text-xs font-mono uppercase bg-[#0B0F19] px-2 py-1 rounded border border-gray-800 cursor-pointer"
                >
                  Close [Esc]
                </button>
              </div>

              <div className="divide-y divide-gray-800/60">
                {history.length > 0 ? (
                  history.map((session, idx) => (
                    <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-800/20 transition-colors text-xs">
                      <div className="flex items-center gap-4">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${session.isFinished ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                        <div>
                          <span className="font-bold text-gray-200 block text-sm">
                            {formatTopicTitle(session.topic)}
                          </span>
                          <span className="text-[10px] text-gray-500 font-mono uppercase mt-0.5 block">
                            {session.difficulty} level · {new Date(session.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 justify-between sm:justify-end shrink-0">
                        <div className="text-right">
                          <span className="text-[10px] text-gray-500 block uppercase font-bold">Grade</span>
                          <span className={`text-sm font-black ${session.isFinished ? 'text-white' : 'text-amber-400'}`}>
                            {session.isFinished ? `${session.score}%` : 'In Progress'}
                          </span>
                        </div>

                        {session.isFinished ? (
                          <button
                            onClick={() => { setShowHistoryModal(false); onViewReport(session); }}
                            className="bg-purple-600/20 border border-purple-500/30 hover:bg-purple-600 hover:text-white text-purple-400 px-3 py-1.5 rounded-lg font-bold text-[11px] uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <ClipboardCheck size={12} /> View Report
                          </button>
                        ) : (
                          <button
                       onClick={() => {
  setShowHistoryModal(false);

  localStorage.setItem('intervyo_active_id', session._id);
  localStorage.setItem(
    'intervyo_current_step',
    (session.currentStep || session.questions.length || 1).toString()
  );

  const lastQuestion =
    session.questions?.[session.questions.length - 1]?.question ||
    "Resume interview question";
localStorage.setItem(
  'intervyo_current_question',
  lastQuestion
);

// Resume existing session (no extra credit deduction)
onStartInterview(session.topic, session.difficulty);
}}
                            className="bg-amber-600/20 border border-amber-500/30 hover:bg-amber-600 hover:text-white text-amber-400 px-3 py-1.5 rounded-lg font-bold text-[11px] uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Play size={12} className="fill-amber-400" /> Resume Room
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-gray-600 italic">
                    No past evaluation matrices detected inside user registry.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        
{showBuyCredits && (
  <BuyCredits
    onClose={() => setShowBuyCredits(false)}
    showToast={showToast}
  />
)}

{showPaymentHistory && (
  <PaymentHistory
    onClose={() => setShowPaymentHistory(false)}
  />
)}

      </div>
    </div>
  );
}