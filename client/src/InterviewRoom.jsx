import { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  ArrowRight,
  Loader2,
  MessageSquare,
  Headphones,
  AlertTriangle,
  ShieldCheck,
  Radio,
} from "lucide-react";
import { useAuthStore } from "./store/authStore";
import { apiUrl } from "./config/api";

export default function InterviewRoom({ topic, difficulty, onExit, onFinished }) {
  const { user: authUser, setUser } = useAuthStore();

  const [currentStep, setCurrentStep] = useState(() => {
  const savedStep = localStorage.getItem("intervyo_current_step");
  const step = savedStep ? parseInt(savedStep, 10) : 1;
  return Math.min(Math.max(step, 1), 5);
});
  

  const [question, setQuestion] = useState(() => {
    return (
      localStorage.getItem("intervyo_current_question") ||
      "Initializing your secure voice interview..."
    );
  });

  const [activeId, setActiveId] = useState(() => {
    return localStorage.getItem("intervyo_active_id") || null;
  });

  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [networkError, setNetworkError] = useState("");

  const recognitionRef = useRef(null);
  const isMounted = useRef(true);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    isMounted.current = true;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onresult = (event) => {
        let currentResult = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentResult += event.results[i][0].transcript;
        }

        if (isMounted.current) {
          setTranscript(currentResult);
        }
      };

      rec.onerror = (e) => {
        console.error("Speech Recognition Error:", e.error);
      };

      rec.onend = () => {
        if (isMounted.current) {
          setIsRecording(false);
        }
      };

      recognitionRef.current = rec;
    }

    if (!localStorage.getItem("intervyo_active_id")) {
      if (!hasStartedRef.current) {
        hasStartedRef.current = true;
        startVoiceSession();
      }
    } else {
      setTimeout(() => {
        if (isMounted.current) {
          speakText(localStorage.getItem("intervyo_current_question"));
        }
      }, 800);
    }

    return () => {
      isMounted.current = false;

      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore stop errors
        }
      }

      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (activeId) {
      localStorage.setItem("intervyo_active_id", activeId);
    }

    localStorage.setItem("intervyo_current_step", currentStep.toString());
    localStorage.setItem("intervyo_current_question", question);
  }, [activeId, currentStep, question]);

  async function startVoiceSession() {
    setNetworkError("");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(apiUrl("/api/interviews/start"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ topic, difficulty }),
      });

      const data = await response.json();

      if (!isMounted.current) return;

      if (response.ok && data.question) {
        if (typeof data.remainingCredits === "number") {
          setUser({
            ...authUser,
            credits: data.remainingCredits,
          });
        }

        setActiveId(data.interviewId);
        setQuestion(data.question);
        speakText(data.question);
      } else {
        throw new Error(
          data.message || "Failed to initialize interview session."
        );
      }
    } catch (err) {
      if (isMounted.current) {
        setNetworkError(err.message || "Failed to start session.");
        setQuestion("Unable to start interview session.");
      }
    }
  }

  function speakText(text) {
    if (!window.speechSynthesis || !text) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.onstart = () => {
      if (isMounted.current) {
        setAiSpeaking(true);
      }
    };

    utterance.onend = () => {
      if (isMounted.current) {
        setAiSpeaking(false);
      }
    };

    const voices = window.speechSynthesis.getVoices();
    const cleanVoice =
      voices.find((v) => v.lang.includes("en-US")) || voices[0];

    if (cleanVoice) {
      utterance.voice = cleanVoice;
    }

    window.speechSynthesis.speak(utterance);
  }

  const toggleVoiceCapture = () => {
    if (!recognitionRef.current) {
      alert("Microphone requires Google Chrome or Microsoft Edge.");
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

  const clearSessionStorage = () => {
    localStorage.removeItem("intervyo_active_id");
    localStorage.removeItem("intervyo_current_step");
    localStorage.removeItem("intervyo_current_question");
    localStorage.removeItem("intervyo_active_topic");
    localStorage.removeItem("intervyo_active_difficulty");
  };

  const handleSubmitVoiceAnswer = async () => {
    if (!transcript.trim() || isRecording) return;

    setSubmitting(true);
    setNetworkError("");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(apiUrl("/api/interviews/submit"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          answer: transcript,
          interviewId: activeId,
        }),
      });

      const data = await response.json();

      if (!isMounted.current) return;

      if (!response.ok) {
        throw new Error(data.message || "Answer submission failed.");
      }

      if (data.status === "evaluating") {
        clearSessionStorage();

        if (onFinished) {
          onFinished({
            _id: data.interviewId,
            status: "evaluating",
            isFinished: false,
            score: null,
            overallFeedback: "Your AI evaluation report is being generated...",
          });
        }

        return;
      }

   if (data.status === "completed") {
  clearSessionStorage();

  if (onFinished) {
    onFinished(
      data.interviewData ||
      data.interview ||
      data
    );
  }

  return;
}

      const nextPrompt =
        data.nextQuestion ||
        "Can you elaborate further on the architectural tradeoffs of your decision?";

      const nextStepNum = data.currentStep || currentStep + 1;

      setQuestion(nextPrompt);
      setCurrentStep(nextStepNum);
      setTranscript("");

      setTimeout(() => speakText(nextPrompt), 100);
    } catch (err) {
      if (isMounted.current) {
        setNetworkError(
          err.message || "Network transmission error. Please try again."
        );
      }
    } finally {
      if (isMounted.current) {
        setSubmitting(false);
      }
    }
  };

  const handleCustomExit = () => {
    clearSessionStorage();
    onExit();
  };

  const progressPct = Math.min((currentStep / 5) * 100, 100);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-y-auto flex flex-col">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-32 h-96 w-96 rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-purple-600/20 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-indigo-500/10 blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col flex-1 px-4 py-6 sm:px-6 md:px-10 md:py-10">
        <header className="mx-auto w-full max-w-5xl">
          <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-purple-900/40">
                <Headphones size={20} className="text-white" />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-bold tracking-tight text-white">
                    Live Voice Interview
                  </h1>

                  <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                    Live
                  </span>
                </div>

                <p className="text-xs text-slate-400">
  {topic?.startsWith("RESUME_DATA_STREAM:")
    ? "Personal Resume Screen"
    : topic || "Adaptive screening"}
  {difficulty ? ` · ${difficulty}` : ""}
</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  Question
                </span>
                <span className="text-sm font-bold text-white">
                  {currentStep} <span className="text-slate-500">/ 5</span>
                </span>
              </div>

              <button
                onClick={handleCustomExit}
                className="cursor-pointer rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-red-400 transition-all hover:bg-red-500/20"
              >
                Exit Room
              </button>
            </div>
          </div>

          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </header>

        {networkError && (
          <div className="mx-auto mt-4 flex w-full max-w-5xl items-center gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-300 backdrop-blur-xl">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{networkError}</span>
          </div>
        )}

        <main className="mx-auto my-auto grid w-full max-w-5xl grid-cols-1 gap-6 py-8 md:grid-cols-2 md:gap-8">
          <section className="relative flex min-h-[320px] flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl sm:p-7">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />

            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-300">
                  <MessageSquare size={15} />
                </span>

                <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-300">
                  AI Interviewer
                </span>
              </div>

              <h2 className="text-pretty text-xl font-bold leading-relaxed tracking-tight text-white sm:text-2xl">
                “{question}”
              </h2>
            </div>

            <div className="mt-8 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/50 p-3.5">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Volume2
                  size={16}
                  className={
                    aiSpeaking
                      ? "text-indigo-400 animate-pulse"
                      : "text-slate-600"
                  }
                />
                <span className="font-medium">
                  {aiSpeaking
                    ? "Assistant is speaking..."
                    : "Assistant idle · answer when ready"}
                </span>
              </div>

              {!aiSpeaking && (
                <button
                  onClick={() => speakText(question)}
                  className="cursor-pointer rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-indigo-300 transition-colors hover:bg-indigo-500/20"
                >
                  Replay
                </button>
              )}
            </div>
          </section>

          <section className="flex min-h-[320px] flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl sm:p-7">
            <div className="w-full space-y-4">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/15 text-purple-300">
                  <Radio size={15} />
                </span>

                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  Your Response
                </span>
              </div>

              <div className="relative flex items-center justify-center py-5">
                {isRecording && (
                  <>
                    <span className="absolute h-24 w-24 animate-ping rounded-full bg-red-500/20" />
                    <span className="absolute h-20 w-20 animate-pulse rounded-full bg-red-500/10" />
                  </>
                )}

                <button
                  type="button"
                  onClick={toggleVoiceCapture}
                  disabled={submitting || aiSpeaking}
                  aria-label={isRecording ? "Stop recording" : "Start recording"}
                  className={`relative z-10 flex h-20 w-20 cursor-pointer items-center justify-center rounded-full border shadow-xl transition-all disabled:cursor-not-allowed disabled:opacity-30 ${
                    isRecording
                      ? "border-red-400 bg-red-600 text-white hover:bg-red-500"
                      : "border-white/10 bg-gradient-to-br from-indigo-500 to-purple-600 text-white hover:shadow-purple-900/40"
                  }`}
                >
                  {isRecording ? <MicOff size={26} /> : <Mic size={26} />}
                </button>
              </div>

              <p className="text-center text-xs font-medium text-slate-400">
                {isRecording
                  ? "Listening... tap to stop"
                  : "Tap the mic to start speaking"}
              </p>
            </div>

            <div className="mt-4 space-y-4">
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Type your answer here if the microphone is not working..."
                className="h-24 w-full resize-none rounded-xl border border-white/10 bg-slate-950/60 p-4 text-sm leading-relaxed text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />

              <button
                type="button"
                onClick={handleSubmitVoiceAnswer}
                disabled={submitting || !transcript.trim() || isRecording}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-purple-900/30 transition-all hover:from-indigo-400 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Analyzing response...
                  </>
                ) : (
                  <>
                    Submit Answer
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>
          </section>
        </main>

        <footer className="mx-auto w-full max-w-5xl border-t border-white/5 pt-4 text-center">
          <p className="flex items-center justify-center gap-1.5 text-[11px] text-slate-600">
            <ShieldCheck size={13} className="text-emerald-500/70" />
            Secure voice session active · responses are processed safely.
          </p>
        </footer>
      </div>
    </div>
  );
}
