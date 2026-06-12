import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Timer, Code2, Play, Loader2, CheckCircle2, ArrowLeft, Terminal, FileText, Check, X, Code, Info, Globe } from 'lucide-react';

export default function CorporateGap({ topic, difficulty, onBackToHome }) {
  const [exam, setExam] = useState(null);
  const [activeIdx, setActiveIdx] = useState(0); 
  const [solutions, setSolutions] = useState({}); // problemId_lang -> code snapshot map
  const [selectedLang, setSelectedLang] = useState("javascript"); 
  const [timeLeft, setTimeLeft] = useState(5400); 
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [terminalTab, setTerminalTab] = useState("testcases"); 
  const [activeCaseIdx, setActiveCaseIdx] = useState(0); 
  const [problemEvaluations, setProblemEvaluations] = useState({}); 

  const timerRef = useRef(null);

  useEffect(() => {
    initializeExamBundle();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [topic, difficulty]);

  useEffect(() => {
    if (timeLeft <= 0 || !exam) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t - 1 <= 0) clearInterval(timerRef.current);
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [timeLeft, exam]);

  const initializeExamBundle = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/dsa/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ topic, difficulty })
      });
      const data = await response.json();
      
      if (response.ok && data.exam && data.exam.problems && data.exam.problems.length > 0) {
        setExam(data.exam);
        setTimeLeft(data.exam.timeLeft || 5400);
        
        const initialSolutions = {};
        data.exam.problems.forEach((p) => {
          const defaultTemplates = p.starterCode || {
            javascript: `function solve(nums) {\n    return null;\n}`,
            python: `class Solution:\n    def solve(self, nums: List[int]) -> int:\n        pass`,
            cpp: `class Solution {\npublic:\n    int solve(vector<int>& nums) {\n        return 0;\n    }\n};`,
            java: `class Solution {\n    public int solve(int[] nums) {\n        return 0;\n    }\n}`
          };

          Object.keys(defaultTemplates).forEach(lang => {
            initialSolutions[`${p._id}_${lang}`] = p.userSolution || defaultTemplates[lang];
          });
        });
        setSolutions(initialSolutions);
      }
    } catch {
      alert("Error linking communication channels with contest matrix engine.");
    } finally {
      setLoading(false);
    }
  };

  const activeProblem = exam?.problems && Array.isArray(exam.problems) ? exam.problems[activeIdx] : null;
  const activeEval = activeProblem ? problemEvaluations[activeProblem._id] : null;
  const currentCodeKey = activeProblem ? `${activeProblem._id}_${selectedLang}` : '';
  const activeCodeValue = solutions[currentCodeKey] || "";

  const handleActiveCodeChange = (text) => {
    if (!currentCodeKey) return;
    setSolutions(prev => ({ ...prev, [currentCodeKey]: text }));
  };

  const handleEvaluateSolutionBlock = async () => {
    if (!exam || !activeProblem) return;

    setSubmitting(true);
    setTerminalTab("results"); 
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/dsa/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          examId: exam._id, 
          problemId: activeProblem._id, 
          code: activeCodeValue,
          language: selectedLang 
        })
      });
      const data = await response.json();
      if (response.ok && data.problem) {
        let parsedFeedback = { feedbackText: "Compilation verified successfully.", caseDetails: [] };
        try {
          parsedFeedback = JSON.parse(data.problem.feedback);
        } catch (e) { console.error("Feedback packet json parsing breakdown:", e); }
        
        setProblemEvaluations(prev => ({
          ...prev,
          [activeProblem._id]: {
            score: data.problem.score,
            isSolved: data.problem.isSolved,
            feedbackText: parsedFeedback.feedbackText,
            caseDetails: parsedFeedback.caseDetails || []
          }
        }));
      }
    } catch {
      alert("Verification runtime channel pipeline exception.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimerString = (sec) => {
    const hours = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-gray-100 flex flex-col items-center justify-center font-mono gap-3 select-none">
        <Loader2 className="animate-spin text-purple-500" size={32} />
        <span className="text-xs uppercase tracking-widest text-gray-400">Syncing LeetCode Contest Server Instance...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080B11] text-gray-100 flex flex-col justify-between font-sans selection:bg-purple-500/20">
      
      {/* HEADER CONTROL ACTIONS BAR */}
      <div className="w-full bg-[#0F1422] border-b border-gray-800 px-6 py-3.5 flex justify-between items-center select-none shadow-md">
        <div className="flex items-center gap-6">
          <button onClick={onBackToHome} className="text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer">
            <ArrowLeft size={14} /> Exit Contest
          </button>
          
          <div className="flex items-center bg-[#161F32] p-1 rounded-xl border border-gray-800 text-[11px] font-bold tracking-wide">
            {exam?.problems?.map((p, index) => (
              <button
                key={p._id}
                onClick={() => { setActiveIdx(index); setActiveCaseIdx(0); }}
                className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
                  activeIdx === index 
                    ? 'bg-purple-600 text-white shadow-lg font-black' 
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <span>Q${index + 1}</span>
                <span className="text-[9px] uppercase tracking-widest opacity-60">({p.difficulty})</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center bg-[#161F32] border border-gray-800 rounded-xl px-2.5 py-1 gap-1.5 text-xs text-gray-300">
            <Globe size={13} className="text-purple-400" />
            <select 
              value={selectedLang} 
              onChange={(e) => setSelectedLang(e.target.value)} 
              className="bg-transparent font-mono focus:outline-none cursor-pointer pr-2 text-gray-200 font-bold"
            >
              <option value="javascript" className="bg-[#161F32]">JavaScript</option>
              <option value="python" className="bg-[#161F32]">Python 3</option>
              <option value="cpp" className="bg-[#161F32]">C++ (GCC 14)</option>
              <option value="java" className="bg-[#161F32]">Java (OpenJDK 21)</option>
            </select>
          </div>

          <div className="bg-[#161F32] px-3.5 py-1.5 rounded-xl text-xs font-mono font-black border border-gray-800 text-gray-300 tracking-widest flex items-center gap-1.5">
            <Timer size={14} className="text-purple-400" /> {formatTimerString(timeLeft)}
          </div>
          <button 
            onClick={handleEvaluateSolutionBlock}
            disabled={submitting || !activeProblem}
            className="bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            {submitting ? <Loader2 size={13} className="animate-spin" /> : <Play size={12} className="fill-white" />}
            Submit Code Matrix
          </button>
        </div>
      </div>

      {/* CORE RUNTIME INTERACTIVE PANELS SPLIT */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 p-4 items-stretch overflow-hidden max-h-[86vh]">
        
        {/* LEFT COMPONENT COLUMN: DESCRIPTION */}
        <div className="md:col-span-5 bg-[#0F1422] border border-gray-800 rounded-2xl flex flex-col justify-between overflow-hidden shadow-xl">
          <div className="flex bg-[#161F32]/80 border-b border-gray-800/60 p-1 font-bold text-[10px] uppercase tracking-widest text-gray-400 select-none">
            <div className="px-4 py-2 border-b-2 border-purple-500 text-white flex items-center gap-1.5 bg-[#0F1422]/60 rounded-t-lg">
              <FileText size={12} className="text-purple-400" /> Contest Challenge Details
            </div>
          </div>

          <div className="flex-1 p-5 overflow-y-auto space-y-6 max-h-[75vh]">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-purple-400 tracking-widest block">Problem Track 0{activeIdx + 1}</span>
              <h2 className="text-xl font-black text-white leading-tight tracking-tight select-text">"{activeProblem?.title}"</h2>
            </div>

            <p className="text-xs md:text-sm text-gray-300 font-sans leading-relaxed select-text bg-[#080B11]/50 p-4 border border-gray-800/40 rounded-xl whitespace-pre-wrap">
              {activeProblem?.description}
            </p>

            <div className="space-y-2.5">
              <span className="text-[10px] uppercase font-black tracking-widest text-gray-500 select-none block">Technical Constraints</span>
              <div className="flex flex-wrap gap-2 text-[11px] font-mono select-text">
                {activeProblem?.constraints?.map((con, index) => (
                  <span key={index} className="bg-[#080B11] border border-gray-800 px-3 py-1 rounded-lg text-amber-200/90">{con}</span>
                ))}
                <span className="bg-[#080B11] border border-purple-900/30 px-3 py-1 rounded-lg text-purple-400/90">Time Limit: {activeProblem?.optimalTimeComplexity}</span>
                <span className="bg-[#080B11] border border-purple-900/30 px-3 py-1 rounded-lg text-purple-400/90">Memory Pool: {activeProblem?.optimalSpaceComplexity}</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COMPONENT COLUMN: INTERACTIVE EDITOR */}
        <div className="md:col-span-7 flex flex-col justify-between items-stretch overflow-hidden gap-4 max-h-[85vh]">
          
          <div className="flex-1 min-h-[300px] bg-[#1E1E1E] border border-gray-800 focus-within:border-purple-500/30 rounded-2xl relative overflow-hidden flex flex-col shadow-xl">
            <div className="bg-[#161F32]/80 px-4 py-2.5 border-b border-gray-800/60 text-[9px] font-mono uppercase font-black tracking-widest text-gray-400 select-none flex justify-between items-center">
              <span className="flex items-center gap-1.5 text-purple-400"><Code size={12} /> Live Compiler Subsystem Instance</span>
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            </div>
            
            <div className="w-full flex-1 pt-2">
              <Editor
                height="100%"
                language={selectedLang === "cpp" ? "cpp" : selectedLang === "python" ? "python" : selectedLang === "java" ? "java" : "javascript"}
                theme="vs-dark"
                value={activeCodeValue}
                onChange={handleActiveCodeChange}
                options={{
                  readOnly: submitting,
                  fontSize: 13,
                  fontFamily: "Fira Code, Courier New, monospace",
                  minimap: { enabled: false },
                  scrollbar: { vertical: "visible", horizontal: "visible" },
                  automaticLayout: true,
                  tabSize: 4,
                  cursorBlinking: "smooth"
                }}
              />
            </div>
          </div>

          {/* LOWER TERMINAL GRID */}
          <div className="h-[230px] bg-[#0F1422] border border-gray-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl shrink-0">
            <div className="flex bg-[#161F32]/60 border-b border-gray-800/60 px-2 font-bold text-[10px] uppercase tracking-widest select-none justify-between items-center shrink-0">
              <div className="flex gap-1 text-gray-400">
                <button 
                  onClick={() => setTerminalTab("testcases")}
                  className={`px-3 py-2.5 transition-all cursor-pointer flex items-center gap-1.5 border-b-2 ${terminalTab === 'testcases' ? 'border-purple-500 text-white bg-[#0F1422]/60' : 'border-transparent hover:text-gray-200'}`}
                >
                  <Terminal size={12} /> Input Vectors
                </button>
                <button 
                  onClick={() => setTerminalTab("results")}
                  className={`px-3 py-2.5 transition-all cursor-pointer flex items-center gap-1.5 border-b-2 ${terminalTab === 'results' ? 'border-purple-500 text-white bg-[#0F1422]/60' : 'border-transparent hover:text-gray-200'}`}
                >
                  <CheckCircle2 size={12} /> Contest Verification {activeEval && `(${activeEval.score}%)`}
                </button>
              </div>
            </div>

            {/* TEST CASES TAB */}
            {terminalTab === 'testcases' && (
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                <div className="flex items-center gap-2 select-none">
                  {activeProblem?.testCases?.map((tc, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveCaseIdx(index)}
                      className={`px-3 py-1 text-[10px] font-mono rounded-lg border font-bold transition-all cursor-pointer ${activeCaseIdx === index ? 'bg-purple-600/10 border-purple-500/40 text-purple-400 shadow-sm' : 'bg-[#080B11] border-gray-800 text-gray-500 hover:text-gray-300'}`}
                    >
                      Case ${index + 1}
                    </button>
                  ))}
                </div>
                {activeProblem?.testCases?.[activeCaseIdx] ? (
                  <div className="space-y-2 font-mono text-[11px] select-text animate-fade-in grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                    <div className="bg-[#080B11] border border-gray-800/60 p-3 rounded-xl">
                      <span className="text-gray-500 block text-[9px] font-sans uppercase font-bold tracking-wider mb-1">Passed Arguments Vector:</span>
                      <pre className="text-gray-300 font-mono text-[11px] whitespace-pre-wrap">{activeProblem.testCases[activeCaseIdx].input}</pre>
                    </div>
                    <div className="bg-[#080B11] border border-gray-800/60 p-3 rounded-xl">
                      <span className="text-emerald-500 block text-[9px] font-sans uppercase font-bold tracking-wider mb-1">Expected Contest Output:</span>
                      <span className="text-emerald-400 font-bold font-mono">{activeProblem.testCases[activeCaseIdx].output}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs italic text-gray-600 text-center my-auto">No input vectors generated.</div>
                )}
              </div>
            )}

            {/* RESULTS TAB */}
            {terminalTab === 'results' && (
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {submitting ? (
                  <div className="h-full flex flex-col items-center justify-center font-mono text-gray-500 text-xs gap-2 select-none">
                    <Loader2 size={18} className="animate-spin text-purple-500" />
                    <span>Executing contest parameters through sandboxed execution nodes...</span>
                  </div>
                ) : activeEval ? (
                  <div className="space-y-3 animate-fade-in">
                    <div className="flex items-center gap-2 select-none">
                      {activeEval.caseDetails?.map((res, index) => (
                        <button
                          key={index}
                          onClick={() => setActiveCaseIdx(index)}
                          className={`px-3 py-1 text-[10px] font-mono rounded-lg border font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            activeCaseIdx === index ? 'bg-purple-600/10 border-purple-500/40 text-purple-400' : 'bg-[#080B11] border-gray-800 text-gray-500'
                          }`}
                        >
                          {res.status === 'Passed' ? <Check size={11} className="text-emerald-400" /> : <X size={11} className="text-red-400" />}
                          Case ${index + 1}
                        </button>
                      ))}
                      <span className={`ml-auto border px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase ${activeEval.score === 100 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                        {activeEval.score === 100 ? 'Accepted' : 'Wrong Answer'}
                      </span>
                    </div>

                    {activeEval.caseDetails?.[activeCaseIdx] ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-[10px] select-text">
                        <div className="bg-[#080B11] border border-gray-800 p-2.5 rounded-xl space-y-1">
                          <span className="text-gray-500 block font-sans uppercase font-bold tracking-wider">Your Output:</span>
                          <pre className={`font-bold whitespace-pre-wrap ${activeEval.caseDetails[activeCaseIdx].status === 'Passed' ? 'text-purple-300' : 'text-red-400'}`}>
                            {activeEval.caseDetails[activeCaseIdx].actual !== null ? String(activeEval.caseDetails[activeCaseIdx].actual) : 'undefined'}
                          </pre>
                        </div>
                        <div className="bg-[#080B11] border border-gray-800 p-2.5 rounded-xl space-y-1">
                          <span className="text-emerald-500 block font-sans uppercase font-bold tracking-wider">Expected Output:</span>
                          <pre className="text-emerald-400 font-bold">{activeEval.caseDetails[activeCaseIdx].expected}</pre>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-[#080B11] border border-gray-800 p-3 rounded-xl text-[11px] font-sans text-gray-400 select-text leading-relaxed flex gap-2">
                        <Info size={14} className="text-purple-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-purple-400 font-bold font-mono text-[10px] uppercase block mb-1">Contest Feedback Analysis:</span>
                          "{activeEval.feedbackText}"
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs italic text-gray-600 text-center my-auto select-none">Terminal idle. Click "Submit Code Matrix" inside headers to execute test parameters.</div>
                )}
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}