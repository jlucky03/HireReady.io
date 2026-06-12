import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, ArrowRight, Loader2, MessageSquare, User, Headphones, AlertTriangle } from 'lucide-react';

export default function InterviewRoom({ topic, difficulty, onExit, onFinished }) {
  // 🌟 READ PERSISTENT STATE ON MOUNT: Check if there's a cached state from a previous refresh
  const [currentStep, setCurrentStep] = useState(() => {
    const savedStep = localStorage.getItem('intervyo_current_step');
    return savedStep ? parseInt(savedStep, 10) : 1;
  });

  const [question, setQuestion] = useState(() => {
    return localStorage.getItem('intervyo_current_question') || "Initializing your secure voice channel matrix...";
  });

  const [activeId, setActiveId] = useState(() => {
    return localStorage.getItem('intervyo_active_id') || null;
  });

  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [networkError, setNetworkError] = useState("");
  
  const recognitionRef = useRef(null);
  const isMounted = useRef(true);

  // Initialize Speech Capture API Link
  useEffect(() => {
    isMounted.current = true;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event) => {
        let currentResult = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentResult += event.results[i][0].transcript;
        }
        if (isMounted.current) setTranscript(currentResult);
      };

      rec.onerror = (e) => console.error("Speech Recognition Link Error:", e.error);
      rec.onend = () => {
        if (isMounted.current) setIsRecording(false);
      };
      recognitionRef.current = rec;
    }

    // 🌟 REFRESH RESILIENCE LAYOUT: Only start a new session if we don't already have an active ID cached
    if (!localStorage.getItem('intervyo_active_id')) {
      startVoiceSession();
    } else {
      // If we recovered a state, replay the question for the student
      setTimeout(() => {
        if (isMounted.current) speakText(localStorage.getItem('intervyo_current_question'));
      }, 800);
    }

    return () => {
      isMounted.current = false;
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  // 🌟 SYNCHRONIZE CACHE STATE LOGS: Keep localStorage updated whenever values shift
  useEffect(() => {
    if (activeId) localStorage.setItem('intervyo_active_id', activeId);
    localStorage.setItem('intervyo_current_step', currentStep.toString());
    localStorage.setItem('intervyo_current_question', question);
  }, [activeId, currentStep, question]);

  const startVoiceSession = async () => {
    setNetworkError("");
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/interviews/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ topic, difficulty })
      });
      const data = await response.json();
      
      if (!isMounted.current) return;

      if (response.ok && data.question) {
        setActiveId(data.interviewId);
        setQuestion(data.question);
        speakText(data.question);
      } else {
        throw new Error(data.message || "Failed to initialize active screening session.");
      }
    } catch (err) {
      if (isMounted.current) {
        setNetworkError("Failed to start session. Verify server connectivity.");
        const fallbackQ = "Explain how you handle asynchronous middleware state errors in an Express API.";
        setQuestion(fallbackQ);
        speakText(fallbackQ);
      }
    }
  };

  const speakText = (text) => {
    if (!window.speechSynthesis || !text) return;
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => { if (isMounted.current) setAiSpeaking(true); };
    utterance.onend = () => { if (isMounted.current) setAiSpeaking(false); };
    
    const voices = window.speechSynthesis.getVoices();
    const cleanVoice = voices.find(v => v.lang.includes('en-US')) || voices[0];
    if (cleanVoice) utterance.voice = cleanVoice;
    
    window.speechSynthesis.speak(utterance);
  };

  const toggleVoiceCapture = () => {
    if (!recognitionRef.current) {
      alert("Platform Warning: Microphones require standard Google Chrome or Edge engines.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setTranscript("");
      setIsRecording(true);
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // 🌟 CLEAN STORAGE SHUTDOWN HELPER
  const clearSessionStorage = () => {
    localStorage.removeItem('intervyo_active_id');
    localStorage.removeItem('intervyo_current_step');
    localStorage.removeItem('intervyo_current_question');
    localStorage.removeItem('intervyo_active_topic');
    localStorage.removeItem('intervyo_active_difficulty');
  };

  const handleSubmitVoiceAnswer = async () => {
    if (!transcript.trim() || isRecording) return;
    setSubmitting(true);
    setNetworkError("");

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/interviews/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          answer: transcript, 
          interviewId: activeId 
        })
      });
      
      const data = await response.json();
      if (!isMounted.current) return;

      if (!response.ok) {
        throw new Error(data.message || "Pipeline submission rejection.");
      }

      if (data.status === 'completed' || currentStep >= 5) {
        clearSessionStorage(); // Clear state logs since assessment is complete!
        if (onFinished && data.interviewData) {
          onFinished(data.interviewData); 
        } else {
          onExit();
        }
      } else {
        const nextPrompt = data.nextQuestion || "Can you elaborate further on the architectural tradeoffs of your decision?";
        const nextStepNum = data.currentStep || (currentStep + 1);
        
        setQuestion(nextPrompt);
        setCurrentStep(nextStepNum);
        setTranscript("");
        
        setTimeout(() => speakText(nextPrompt), 100);
      }
    } catch (err) {
      if (isMounted.current) {
        setNetworkError(err.message || "Network transmission error. Retrying recommended.");
      }
    } finally {
      if (isMounted.current) setSubmitting(false);
    }
  };

  const handleCustomExit = () => {
    clearSessionStorage(); // Clear cached session when explicitly hitting exit
    onExit();
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 p-6 md:p-12 overflow-y-auto flex flex-col justify-between font-sans relative">
      
      {/* HEADER BAR PANEL */}
      <div className="max-w-5xl w-full mx-auto flex justify-between items-center border-b border-gray-800/60 pb-4 select-none">
        <div className="flex items-center gap-3">
          <div className="bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-xl text-xs font-mono font-bold tracking-wider text-purple-400 uppercase flex items-center gap-1.5">
            <Headphones size={12} /> Live Voice Board
          </div>
          <span className="text-xs font-mono text-gray-500 font-bold tracking-widest uppercase bg-[#151D30] px-2.5 py-1 rounded-lg border border-gray-800">
            Question {currentStep} / 5
          </span>
        </div>
        
        <button 
          onClick={handleCustomExit} 
          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-xl border border-red-500/20 transition-all cursor-pointer"
        >
          Exit Room
        </button>
      </div>

      {/* ERROR BANNER NOTIFICATION */}
      {networkError && (
        <div className="max-w-5xl w-full mx-auto mt-4 bg-red-500/10 border border-red-500/20 p-3.5 rounded-xl flex items-center gap-2.5 text-xs text-red-400 animate-fade-in">
          <AlertTriangle size={15} />
          <span>{networkError}</span>
        </div>
      )}

      {/* INTERVIEW TILES SPLIT */}
      <div className="max-w-5xl w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 my-auto py-6">
        
        <div className="bg-[#151D30]/60 border border-gray-800 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden shadow-2xl min-h-[340px]">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500" />
          <div className="space-y-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 flex items-center gap-1.5 select-none">
              <MessageSquare size={12} /> AI Screener Audio Directive
            </span>
            <h2 className="text-xl md:text-2xl font-extrabold text-white leading-relaxed tracking-tight select-text">
              "{question}"
            </h2>
          </div>
          
          <div className="mt-8 flex items-center justify-between text-xs text-gray-400 bg-[#0B0F19]/60 p-3.5 border border-gray-800/60 rounded-xl select-none">
            <div className="flex items-center gap-2">
              <Volume2 size={14} className={aiSpeaking ? "text-purple-400 animate-pulse" : "text-gray-600"} />
              <span className="font-medium">{aiSpeaking ? "Voice Assistant is speaking..." : "Assistant idle. Dictate your response."}</span>
            </div>
            {!aiSpeaking && (
              <button 
                onClick={() => speakText(question)} 
                className="text-[9px] text-purple-400 hover:text-purple-300 font-bold uppercase tracking-widest bg-purple-500/10 px-2 py-1 rounded border border-purple-500/20 cursor-pointer"
              >
                Replay Audio
              </button>
            )}
          </div>
        </div>

        <div className="bg-[#151D30]/60 border border-gray-800 rounded-2xl p-6 flex flex-col justify-between shadow-2xl min-h-[340px]">
          <div className="w-full space-y-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 select-none block">
              Audio Telemetry Stream Capture
            </span>
            
            <div className="relative py-4 flex items-center justify-center select-none">
              {isRecording && (
                <div className="absolute w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 animate-ping" />
              )}
              <button
                type="button"
                onClick={toggleVoiceCapture}
                disabled={submitting || aiSpeaking}
                className={`w-16 h-16 rounded-full flex items-center justify-center border transition-all shadow-xl cursor-pointer relative z-10 ${
                  isRecording 
                    ? 'bg-red-600 border-red-500 hover:bg-red-500 text-white' 
                    : 'bg-[#0B0F19] border-gray-800 hover:border-purple-500/40 text-gray-400 hover:text-purple-400 disabled:opacity-30'
                }`}
              >
                {isRecording ? <MicOff size={22} /> : <Mic size={22} />}
              </button>
            </div>
          </div>

          <div className="w-full flex-1 flex flex-col justify-end mt-4">
            <div className="w-full bg-[#0B0F19] border border-gray-800 rounded-xl p-4 h-[120px] overflow-y-auto text-left text-xs leading-relaxed font-mono text-gray-300 select-text">
              {transcript ? (
                <span className="text-white">{transcript}</span>
              ) : (
                <span className="text-gray-600 italic flex items-center gap-1.5 select-none">
                  <User size={13} /> Voice capture stream is empty. Tap the mic above to answer via speech. Typing is disabled for this session.
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleSubmitVoiceAnswer}
              disabled={submitting || !transcript.trim() || isRecording}
              className="w-full mt-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-[11px] font-bold uppercase tracking-wider py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer select-none"
            >
              {submitting ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Streaming Verbal Analytics...
                </>
              ) : (
                <>
                  Submit Voice Answer Block
                  <ArrowRight size={13} />
                </>
              )}
            </button>
          </div>

        </div>
      </div>

      <div className="max-w-5xl w-full mx-auto text-center text-[10px] text-gray-600 border-t border-gray-800/40 pt-4 select-none">
        🔒 Encrypted speech telemetry active · Audio waveforms match structured linguistic token indices natively.
      </div>
    </div>
  );
}