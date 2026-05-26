import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { useVoiceInput } from './hooks/useVoiceInput';
import { Mic, MicOff, Send, Cpu, ArrowLeft, Terminal as TerminalIcon, Timer, ShieldAlert } from 'lucide-react';

export default function InterviewRoom({ interview, onInterviewUpdate, onBackToHome }) {
  const [codeOrText, setCodeOrText] = useState('// Write your functional code snippet or type your theoretical explanation here...\n\n');
  const [language, setLanguage] = useState('javascript');
  const [loading, setLoading] = useState(false);
  
  const currentTurnNumber = interview.turns.length;
  const currentTurnIndex = interview.turns.length - 1;
  const currentQuestion = interview.turns[currentTurnIndex]?.question || 'Compiling assessment parameter criteria...';

  // ---- INTEGRATED: 45 MINUTES PRESSURE TIMER STATE (2700 SECONDS) ----
  const [timeLeft, setTimeLeft] = useState(2700);

  useEffect(() => {
    if (timeLeft <= 0) {
      alert("⏰ Time's up! Auto-submitting session parameters.");
      handleSubmit();
      return;
    }
    const timerId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ---- FIXED: ISOLATED TERMINAL METRICS CLEANUP ENGINE ----
  const [terminalFeed, setTerminalFeed] = useState(null);

  // Force reset the dashboard terminal whenever a new question loads
  useEffect(() => {
    setTerminalFeed(null);
  }, [currentTurnNumber]);

  // ---- INTEGRATED: ANTI-CHEAT EVENT LISTENER PROCTORING SUITE ----
  const [infractions, setInfractions] = useState(0);
  const proctorSubmitRef = useRef();

  useEffect(() => {
    const handleCheatCheck = () => {
      setInfractions((prev) => {
        const nextInfractionCount = prev + 1;
        if (nextInfractionCount >= 3) {
          alert("🚨 Crucial Infraction Limit Reached: You have left the test workspace 3 times. Your interview is being force-submitted immediately.");
          if (proctorSubmitRef.current) {
            // Force submit using an explicit system string parameter to bypass frontend textbox validation
            proctorSubmitRef.current("Session terminated due to automated proctoring infraction. Candidate repeatedly shifted window focus paths.");
          }
        } else {
          alert(`⚠️ Anti-Cheat Warning (${nextInfractionCount}/3): Departure from the active evaluation window detected. Switching tabs or minimization tools is restricted.`);
        }
        return nextInfractionCount;
      });
    };

    window.addEventListener('blur', handleCheatCheck);
    return () => window.removeEventListener('blur', handleCheatCheck);
  }, []);

  // ---- FIXED: ROBUST VOICE TRANSLATION POOL INJECTION ----
  const { isListening, toggleListening } = useVoiceInput((transcript) => {
    if (!transcript) return;
    setCodeOrText((prev) => {
      const cleanPrev = prev === '// Write your functional code snippet or type your theoretical explanation here...\n\n' ? '' : prev;
      return cleanPrev + (cleanPrev.endsWith('\n') || cleanPrev === '' ? '' : ' ') + transcript;
    });
  });

  const handleSubmit = async (forcedAnswerPayload = null) => {
    // Intercept whether to use state or the forced anti-cheat text string
    const finalSubmissionText = typeof forcedAnswerPayload === 'string' ? forcedAnswerPayload : codeOrText;

    // Only block if it is a standard submit trigger and the input field is empty
    if (typeof forcedAnswerPayload !== 'string' && (!finalSubmissionText.trim() || loading)) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/interviews/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          interviewId: interview._id,
          answer: finalSubmissionText
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Handshake pipeline failure.');

      // ---- FIXED: POPULATE STATE FROM DIRECT RESPONSE BEFORE CLEARING ----
      const completedTurnIndex = data.interview.turns.length - 2;
      const justAnalyzedTurn = data.interview.turns[completedTurnIndex];

      if (justAnalyzedTurn && justAnalyzedTurn.score > 0) {
        setTerminalFeed(justAnalyzedTurn);
      }

      setCodeOrText('// Write your functional code snippet or type your theoretical explanation here...\n\n');
      onInterviewUpdate(data.interview);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Sync execution ref hook target on every render cascade pass cleanly
  useEffect(() => {
    proctorSubmitRef.current = handleSubmit;
  });

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 flex flex-col h-screen overflow-hidden">
      
      {/* Top Application Bar Navbar Shell */}
      <div className="bg-[#151D30] border-b border-gray-800/80 p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToHome}
            className="flex items-center gap-1.5 bg-[#0B0F19] hover:bg-gray-800 text-gray-400 hover:text-white text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-xl border border-gray-800 transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} /> Exit Room
          </button>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
              Adaptive Live Lab
            </span>
            <h2 className="text-xs font-mono font-bold text-gray-400 mt-1 truncate max-w-xs md:max-w-md">
              Session Focus: {interview.topic}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* ---- LIVE ANTI-CHEAT PROCTOR SECURITY BADGE ---- */}
          <div className={`flex items-center gap-1.5 font-mono text-[10px] uppercase font-black px-2.5 py-1.5 border rounded-xl shadow-inner select-none ${
            infractions > 0 
              ? 'bg-red-950/40 text-red-400 border-red-900/50 animate-pulse' 
              : 'bg-[#0B0F19] text-emerald-400 border-emerald-900/20'
          }`}>
            <ShieldAlert size={12} className={infractions > 0 ? 'text-red-400' : 'text-emerald-500'} />
            <span>Proctor Alerts: {infractions} / 3</span>
          </div>

          {/* ---- PRESSURE TIMER DISPLAY PANEL ---- */}
          <div className={`flex items-center gap-1.5 font-mono text-xs px-3 py-1.5 border rounded-xl shadow-inner select-none ${
            timeLeft < 300 ? 'bg-red-950/30 text-red-400 border-red-900/40 animate-pulse' : 'bg-[#0B0F19] text-amber-400 border-gray-800'
          }`}>
            <Timer size={14} />
            <span>{formatTime(timeLeft)}</span>
          </div>

          {/* Language Selector Dropdown */}
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-[#0B0F19] border border-gray-800 text-xs font-mono rounded-xl px-3 py-1.5 text-gray-300 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="cpp">C++</option>
            <option value="java">Java</option>
          </select>

          <div className="bg-[#0B0F19] border border-gray-800 px-3 py-1 rounded-xl text-right select-none">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest block font-bold">Round Step</span>
            <span className="text-sm font-black text-white">{currentTurnNumber} <span className="text-gray-600 text-xs">/ 5</span></span>
          </div>
        </div>
      </div>

      {/* Primary Split-Screen Content Layout Engine */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        
        {/* Left Side Column Panel: Recruiter Query Feed Box */}
        <div className="w-full md:w-5/12 border-b md:border-b-0 md:border-r border-gray-800/80 p-6 flex flex-col justify-between bg-[#111827]/40 overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-400">
              <Cpu size={16} /> AI Screener Directive
            </div>
            <div className="bg-[#151D30] border border-gray-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
              <p className="text-sm md:text-base text-gray-200 leading-relaxed font-medium select-text whitespace-pre-wrap">
                {currentQuestion}
              </p>
            </div>
          </div>

          {loading && (
            <div className="mt-4 flex items-center gap-2 text-xs text-blue-400 font-mono animate-pulse bg-blue-500/5 p-3 rounded-xl border border-blue-500/10">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
              Compiling source tokens & computing metric delta layers...
            </div>
          )}
        </div>

        {/* Right Side Column Panel: Monaco Editor Workspace & Terminal Canvas */}
        <div className="w-full md:w-7/12 flex flex-col h-full min-h-0 overflow-hidden">
          
          {/* Upper Zone Panel: Monaco Code Canvas Component mount */}
          <div className="flex-1 min-h-0 border-b border-gray-800/80 relative">
            <Editor
              height="100%"
              theme="vs-dark"
              language={language}
              value={codeOrText}
              onChange={(value) => setCodeOrText(value || '')}
              options={{
                fontSize: 13,
                fontFamily: 'Fira Code, Menlo, Monaco, Consolas, Courier New, monospace',
                minimap: { enabled: false },
                wordWrap: 'on',
                automaticLayout: true,
                padding: { top: 16 },
                scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 }
              }}
            />
          </div>

          {/* Lower Zone Panel: Live Real-Time Interactive Diagnostic Terminal feedback */}
          <div className="h-52 bg-[#070A12] p-4 flex flex-col overflow-hidden font-mono text-xs border-t border-gray-900">
            <div className="flex items-center justify-between border-b border-gray-800/60 pb-2 mb-2 shrink-0">
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold flex items-center gap-1.5">
                <TerminalIcon size={12} /> Diagnostic Performance Feed
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleListening}
                  disabled={loading}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                    isListening 
                      ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse font-bold' 
                      : 'bg-[#151D30] text-gray-400 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  {isListening ? <MicOff size={12} /> : <Mic size={12} />}
                  {isListening ? 'Stop Mic' : 'Dictate Code/Prose'}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !codeOrText.trim()}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold text-[10px] uppercase tracking-wider px-3 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                >
                  Submit Block <Send size={10} />
                </button>
              </div>
            </div>

            {/* Terminal Feed Data Content Frame */}
            <div className="flex-1 overflow-y-auto text-gray-400 space-y-2 select-text leading-relaxed">
              {terminalFeed ? (
                <div className="space-y-1.5 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">▼ Status Matrix:</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      terminalFeed.score >= 70 ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      Previous Question Score: {terminalFeed.score}/100
                    </span>
                  </div>
                  <p className="text-gray-300"><span className="text-blue-400">Feedback:</span> {terminalFeed.feedback}</p>
                  {terminalFeed.improvedAnswer && (
                    <div className="mt-2 pt-2 border-t border-gray-800/60">
                      <span className="text-emerald-400 text-[10px] block uppercase tracking-wider font-bold mb-1">Recommended Benchmark Fix:</span>
                      <pre className="text-[11px] font-mono leading-tight bg-black/40 p-2.5 rounded border border-gray-900 overflow-x-auto text-emerald-300 select-text whitespace-pre">
                        {terminalFeed.improvedAnswer}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-600 italic animate-pulse">
                  stdout: Awaiting submission block for Question #{currentTurnNumber} to stream diagnostic telemetry...
                </p>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}