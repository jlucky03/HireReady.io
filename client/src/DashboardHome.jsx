import React, { useState } from "react";
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
  Play,
  Loader2,
  CreditCard,
  Receipt,
  TrendingUp,
  Sparkles,
  LogOut,
} from "lucide-react";
import { auth } from "./firebase";
import { useAuthStore } from "./store/authStore";
import { apiUrl } from "./config/api";

export default function DashboardHome({
  onStartInterview,
  onViewReport,
  onOpenProgress,
  onLogout,
  history = [],
  showToast,
}) {
  const [file, setFile] = useState(null);
  const { user: authUser, setUser } = useAuthStore();

  const [loadingAts, setLoadingAts] = useState(false);
  const [atsResult, setAtsResult] = useState(null);
  const [cachedResumeText, setCachedResumeText] = useState("");

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showBuyCredits, setShowBuyCredits] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);

  const [selectedTopic, setSelectedTopic] = useState("MERN Stack");
  const [interviewMode, setInterviewMode] = useState("standard");
  const [selectedDifficulty, setSelectedDifficulty] = useState("Medium");

  const user = auth.currentUser;

  const userName = authUser?.name || user?.displayName || "Candidate";
  const userEmail = authUser?.email || user?.email || "";

const userInitial = userName?.trim()?.charAt(0)?.toUpperCase() || "C";

  const hasEnoughCredits = (authUser?.credits ?? 0) >= 3;

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
    formData.append("resume", file);

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(apiUrl("/api/resume/analyze"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "ATS analysis failed.");
      }

      setAtsResult(data.atsAnalysis);
      setCachedResumeText(data.extractedText || "");

      if (data.cached) {
        showToast("⚡ Redis Cache Hit — skipped AI processing.");
      } else {
        showToast("🚀 AI analysis completed and cached.");
      }

      if (typeof data.remainingCredits === "number") {
        setUser({
          ...authUser,
          credits: data.remainingCredits,
        });
      }

      if (data.extractedText) {
        setInterviewMode("resume");
      }
    } catch (err) {
      showToast(err.message || "ATS analysis failed.");
    } finally {
      setLoadingAts(false);
    }
  };

  const handleLaunchVoiceSession = () => {
    if (authUser?.credits < 3) {
      showToast("You need at least 3 credits to start an interview.");
      return;
    }

    if (interviewMode === "resume" && !cachedResumeText) {
      showToast("Please run ATS resume scan first.");
      return;
    }

    const focusPayload =
      interviewMode === "resume"
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-y-auto">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-32 h-96 w-96 rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-purple-600/20 blur-[120px]" />
        <div className="absolute bottom-0 left-1/2 h-80 w-80 rounded-full bg-blue-600/10 blur-[120px]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-5 py-8 md:px-10 md:py-12 space-y-10">
 <header className="rounded-3xl border border-white/10 bg-slate-900/70 backdrop-blur-xl p-5 md:p-6 shadow-2xl">
  {/* Top row */}
  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
    <div className="flex items-center gap-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 shadow-lg shadow-purple-900/50">
        <Sparkles size={25} className="text-white" />
      </div>

      <div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          HireReady AI
        </h1>
        <p className="mt-1 text-sm text-slate-400 max-w-xl leading-relaxed">
          AI-powered interview preparation, ATS optimization and technical skill assessment.
        </p>
      </div>
    </div>

    <div className="flex flex-wrap items-center gap-3">
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-3 min-w-[135px]">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-300/70">
          Credits
        </p>
        <p className="text-2xl font-black text-emerald-400 leading-tight">
          {authUser?.credits ?? 0}
        </p>
        <p className="text-[10px] text-slate-500">
          3 / interview · 1 / ATS
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-lg ring-2 ring-purple-500/40">
          {userInitial}
        </div>

        <div className="hidden sm:block text-left">
          <p className="text-sm font-semibold text-white truncate max-w-[180px]">
            {userName}
          </p>
          <p className="text-xs text-slate-500 truncate max-w-[180px]">
            {userEmail}
          </p>
        </div>
      </div>

      <button
        onClick={onLogout}
        className="flex items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs font-bold uppercase tracking-wider text-red-300 transition-all hover:bg-red-500 hover:text-white"
      >
        <LogOut size={15} />
        Logout
      </button>
    </div>
  </div>

  {/* Action row */}
  <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3 border-t border-white/10 pt-5">
    <button
      onClick={onOpenProgress}
      className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-purple-900/40 transition-all hover:from-purple-500 hover:to-indigo-500"
    >
      <TrendingUp size={15} />
      My Progress
    </button>

    <button
      onClick={() => setShowHistoryModal(true)}
      className="flex items-center justify-center gap-2 rounded-2xl border border-purple-500/20 bg-purple-500/10 px-4 py-3 text-xs font-bold uppercase tracking-wider text-purple-300 transition-all hover:border-purple-500/40 hover:bg-purple-500/20"
    >
      <History size={15} />
      History
    </button>

    <button
      onClick={() => setShowBuyCredits(true)}
      className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-purple-900/40 transition-all hover:from-indigo-400 hover:to-purple-500"
    >
      <CreditCard size={15} />
      Buy Credits
    </button>

    <button
      onClick={() => setShowPaymentHistory(true)}
      className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-300 transition-all hover:border-white/20 hover:bg-white/10"
    >
      <Receipt size={15} />
      Billing
    </button>
  </div>
</header>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-7 text-center backdrop-blur-xl transition-all hover:border-blue-500/30 hover:bg-white/[0.07]">
            <div className="space-y-5">
              <div className="flex items-center justify-center gap-3">
                <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-400 select-none">
                  Step 1
                </span>
              </div>

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
                <FileText size={24} />
              </div>

              <div>
                <h3 className="text-xl font-black text-white">
                  Resume ATS Optimizer
                </h3>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-400">
                  Drop your PDF resume into the analyzer to compute instant
                  match scores and project corrections.
                </p>
              </div>

              <form onSubmit={handleCheckAts} className="space-y-3 pt-1">
                <div className="relative rounded-2xl border border-dashed border-white/15 bg-slate-950/50 p-5 text-center transition-colors hover:border-blue-500/40">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                  <Upload size={20} className="mx-auto mb-2 text-slate-500" />
                  <span className="mx-auto block max-w-[220px] truncate text-xs text-slate-300">
                    {file ? file.name : "Choose PDF Resume"}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loadingAts || !file}
                  className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg transition-all ${
                    loadingAts || !file
                      ? "cursor-not-allowed bg-blue-600/40"
                      : "cursor-pointer bg-gradient-to-r from-blue-600 to-blue-500 shadow-blue-900/40 hover:from-blue-500 hover:to-blue-400"
                  }`}
                >
                  {loadingAts && <Loader2 size={14} className="animate-spin" />}
                  {loadingAts ? "Analyzing Resume..." : "Calculate ATS Match"}
                </button>
              </form>
            </div>
          </div>

          <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-7 text-center backdrop-blur-xl transition-all hover:border-purple-500/30 hover:bg-white/[0.07]">
            <div className="space-y-5">
              <div className="flex items-center justify-center gap-3">
                <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-purple-400 select-none">
                  Step 2
                </span>
              </div>

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-500/20 bg-purple-500/10 text-purple-400">
                <Volume2 size={24} />
              </div>

              <div>
                <h3 className="text-xl font-black text-white">
                  Smart Voice Interview
                </h3>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-400">
                  Launch a low-latency voice session for conversational tech
                  screening using standard topics or your profile.
                </p>
              </div>

              <div className="flex select-none gap-1.5 rounded-2xl border border-white/10 bg-slate-950/50 p-1.5 text-[10px] font-bold uppercase tracking-wider">
                <button
                  type="button"
                  onClick={() => setInterviewMode("standard")}
                  className={`flex-1 rounded-xl py-2 transition-all cursor-pointer ${
                    interviewMode === "standard"
                      ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Standard Topic
                </button>

                <button
                  type="button"
                  disabled={!cachedResumeText}
                  onClick={() => setInterviewMode("resume")}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 transition-all ${
                    !cachedResumeText
                      ? "cursor-not-allowed text-slate-600 opacity-50"
                      : interviewMode === "resume"
                      ? "cursor-pointer bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md"
                      : "cursor-pointer text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <UserCheck size={12} />
                  From Resume
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1 text-left">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    Focus Target
                  </label>

                  {interviewMode === "resume" ? (
                    <div className="w-full select-none truncate rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-2.5 text-xs font-medium tracking-wide text-purple-300">
                      ✨ Resume Loaded
                    </div>
                  ) : (
                    <select
                      value={selectedTopic}
                      onChange={(e) => setSelectedTopic(e.target.value)}
                      className="w-full cursor-pointer rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-xs font-medium text-slate-300 focus:border-purple-500/40 focus:outline-none"
                    >
                      <option value="MERN Stack">MERN Stack</option>
                      <option value="SDE Role">SDE Role</option>
                      <option value="System Design">System Design</option>
                    </select>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    Difficulty
                  </label>

                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="w-full cursor-pointer rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-xs font-medium text-slate-300 focus:border-purple-500/40 focus:outline-none"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLaunchVoiceSession}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-purple-900/40 transition-all hover:from-indigo-400 hover:to-purple-500 cursor-pointer"
            >
              <Play size={14} className="fill-white" />
              Launch Interview
            </button>
          </div>
        </div>

        {atsResult && (
          <div className="animate-fade-in relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-7 shadow-2xl backdrop-blur-xl">
            <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-emerald-400 to-emerald-600" />

            <div className="flex flex-col gap-6 border-b border-white/10 pb-5 sm:flex-row sm:items-center">
              <div className="shrink-0 select-none rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-7 py-5 text-center">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-300/70">
                  ATS Score
                </span>
                <span className="text-4xl font-black tracking-tight text-emerald-400">
                  {atsResult.score}%
                </span>
              </div>

              <div>
                <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-white">
                  <Cpu size={16} className="text-blue-400" />
                  Resume Analysis Summary
                </h4>
                <p className="mt-2 select-text text-sm leading-relaxed text-slate-400">
                  {atsResult.summary}
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-5">
              <h5 className="flex select-none items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-amber-400">
                <TrendingUp size={14} />
                Targeted Resume Improvements
              </h5>

              <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {Array.isArray(atsResult.improvements) ? (
                  atsResult.improvements.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex select-text gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm leading-relaxed text-slate-300"
                    >
                      <Award
                        size={16}
                        className="mt-0.5 shrink-0 text-blue-400"
                      />
                      <span>
                        {typeof item === "string"
                          ? item
                          : item?.suggest ||
                            item?.project ||
                            JSON.stringify(item)}
                      </span>
                    </li>
                  ))
                ) : (
                  <li className="flex select-text gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm leading-relaxed text-slate-300">
                    <Award
                      size={16}
                      className="mt-0.5 shrink-0 text-blue-400"
                    />
                    <span>{atsResult.improvements}</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}

        {showHistoryModal && (
          <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
            <div className="w-full max-w-3xl space-y-5 overflow-y-auto rounded-3xl border border-white/10 bg-slate-900/90 p-7 shadow-2xl backdrop-blur-xl max-h-[85vh]">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-purple-300">
                  <History size={16} />
                  Evaluation Session Log
                </h3>

                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="cursor-pointer rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-mono uppercase text-slate-400 transition-all hover:bg-white/10 hover:text-white"
                >
                  Close
                </button>
              </div>

              <div className="space-y-3">
                {history.length > 0 ? (
                  history.map((session, idx) => {
                    const status =
                      session.status ||
                      (session.isFinished ? "completed" : "active");

                    return (
                      <div
                        key={session._id || idx}
                        className="flex flex-col justify-between gap-4 rounded-2xl border border-white/5 bg-white/5 p-4 text-xs transition-colors hover:border-white/10 hover:bg-white/[0.08] sm:flex-row sm:items-center"
                      >
                        <div className="flex items-center gap-4">
                          <span
                            className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                              status === "completed"
                                ? "bg-emerald-400"
                                : status === "failed"
                                ? "bg-red-400"
                                : status === "evaluating"
                                ? "animate-pulse bg-blue-400"
                                : "animate-pulse bg-amber-400"
                            }`}
                          />

                          <div>
                            <span className="block text-sm font-bold text-slate-100">
                              {formatTopicTitle(session.topic)}
                            </span>
                            <span className="mt-0.5 block font-mono text-[11px] uppercase text-slate-500">
                              {session.difficulty} level ·{" "}
                              {new Date(session.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-6 shrink-0 sm:justify-end">
                          <div className="text-right">
                            <span className="block text-[10px] font-bold uppercase text-slate-500">
                              Grade
                            </span>
                            <span
                              className={`text-sm font-black ${
                                status === "completed"
                                  ? "text-white"
                                  : status === "failed"
                                  ? "text-red-400"
                                  : status === "evaluating"
                                  ? "text-blue-400"
                                  : "text-amber-400"
                              }`}
                            >
                              {status === "completed" &&
                              typeof session.score === "number"
                                ? `${session.score}%`
                                : status === "failed"
                                ? "Failed"
                                : status === "evaluating"
                                ? "Evaluating"
                                : "In Progress"}
                            </span>
                          </div>

                          {status === "completed" ? (
                            <button
                              onClick={() => {
                                setShowHistoryModal(false);
                                onViewReport(session);
                              }}
                              className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-purple-300 transition-all hover:bg-purple-600 hover:text-white"
                            >
                              <ClipboardCheck size={13} />
                              View Report
                            </button>
                          ) : status === "evaluating" ? (
                            <button
                              onClick={() => {
                                setShowHistoryModal(false);
                                onViewReport(session);
                              }}
                              className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-blue-300 transition-all hover:bg-blue-600 hover:text-white"
                            >
                              <Loader2 size={13} className="animate-spin" />
                              View Evaluation
                            </button>
                          ) : status === "failed" ? (
  <button
    onClick={() => {
      setShowHistoryModal(false);
      onViewReport(session);
    }}
    className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-red-300 transition-all hover:bg-red-600 hover:text-white"
  >
    Evaluation Failed
  </button>
) : (
                            <button
                              onClick={() => {
                                setShowHistoryModal(false);

                                localStorage.setItem(
                                  "intervyo_active_id",
                                  session._id
                                );
                                localStorage.setItem(
                                  "intervyo_current_step",
                                  (
                                    session.currentStep ||
                                    session.questions.length ||
                                    1
                                  ).toString()
                                );

                                const lastQuestion =
                                  session.questions?.[
                                    session.questions.length - 1
                                  ]?.question || "Resume interview question";

                                localStorage.setItem(
                                  "intervyo_current_question",
                                  lastQuestion
                                );

                                onStartInterview(
                                  session.topic,
                                  session.difficulty
                                );
                              }}
                              className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-amber-300 transition-all hover:bg-amber-600 hover:text-white"
                            >
                              <Play size={13} className="fill-amber-400" />
                              Resume Room
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-white/5 bg-white/5 p-8 text-center text-sm italic text-slate-500">
                    No past interviews found yet.
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
          <PaymentHistory onClose={() => setShowPaymentHistory(false)} />
        )}
      </div>
    </div>
  );
}