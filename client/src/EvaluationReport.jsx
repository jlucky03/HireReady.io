import React, { useEffect, useState } from "react";
import {
  Award,
  MessageSquare,
  BookOpen,
  ChevronLeft,
  ShieldCheck,
  Download,
  Loader2,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { apiUrl } from "./config/api";

export default function EvaluationReport({ report, onClose }) {
  const [liveReport, setLiveReport] = useState(report);
const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (!liveReport?._id || liveReport.status !== "evaluating") return;

    const pollReport = async () => {
      try {
        const token = localStorage.getItem("token");

   const res = await fetch(apiUrl(`/api/interviews/${liveReport._id}`), {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

        const data = await res.json();

      if (res.ok && (data.status === "completed" || data.status === "failed")) {
  setLiveReport(data);
}
      } catch (err) {
        console.error("Failed to poll evaluation:", err);
      }
    };

    const interval = setInterval(pollReport, 2000);
    pollReport();

    return () => clearInterval(interval);
  }, [liveReport?._id, liveReport?.status]);

  if (!liveReport) return null;

  const handleDownloadPDF = () => {
    window.print();
  };

  const handleRetryEvaluation = async () => {
  try {
    setRetrying(true);

    const token = localStorage.getItem("token");

    const res = await fetch(
      apiUrl(`/api/interviews/${liveReport._id}/retry-evaluation`),
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to retry evaluation.");
    }

    setLiveReport({
      ...liveReport,
      status: "evaluating",
      isFinished: false,
      overallFeedback:
        "Evaluation retry is queued. Your report is being regenerated.",
    });
  } catch (err) {
    alert(err.message || "Failed to retry evaluation.");
  } finally {
    setRetrying(false);
  }
};

  if (liveReport.status === "evaluating") {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-gray-100 flex items-center justify-center p-6">
        <div className="bg-[#151D30] border border-gray-800 rounded-2xl p-8 max-w-xl w-full text-center shadow-2xl">
          <Loader2 className="animate-spin mx-auto text-purple-400 mb-4" size={42} />

          <h1 className="text-2xl font-black text-white">
            Generating Evaluation Report
          </h1>

          <p className="text-sm text-gray-400 mt-3 leading-relaxed">
            Your interview has been submitted successfully. RabbitMQ worker is
            processing your AI evaluation in the background.
          </p>

          <div className="mt-6 bg-[#0B0F19] border border-gray-800 rounded-xl p-4 text-left text-xs text-gray-400">
            <p>✅ Interview answers received</p>
            <p>📩 Evaluation job queued</p>
            <p>👷 Worker generating AI report...</p>
          </div>

          <button
            onClick={onClose}
            className="mt-6 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

if (liveReport.status === "failed") {
  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-3xl border border-red-500/20 bg-[#151D30]/90 p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400">
          <AlertTriangle size={34} />
        </div>

        <h1 className="mt-6 text-2xl font-black text-white">
          Evaluation Failed
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-gray-400">
          Your interview answers were submitted successfully, but the background
          AI evaluation could not be completed. You can retry the evaluation
          without using extra credits.
        </p>

        <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-left text-xs text-red-200/90 space-y-2">
          <p className="font-bold uppercase tracking-wider text-red-300">
            Possible reasons
          </p>
          <p>• AI API timeout or temporary failure</p>
          <p>• Invalid AI response format</p>
          <p>• Worker or queue processing issue</p>
        </div>

        {liveReport.overallFeedback && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-[#0B0F19] p-4 text-left text-xs text-gray-400">
            <p className="font-bold uppercase tracking-wider text-gray-500 mb-2">
              System Message
            </p>
            <p>{liveReport.overallFeedback}</p>
          </div>
        )}

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={handleRetryEvaluation}
            disabled={retrying}
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-purple-900/40 transition-all hover:from-purple-500 hover:to-indigo-500 disabled:opacity-60"
          >
            {retrying ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RotateCcw size={15} />
                Retry Evaluation
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-300 transition-all hover:bg-white/10 hover:text-white"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 p-6 md:p-12 overflow-y-auto font-sans print:bg-white print:text-black print:p-0">
      <div className="max-w-4xl mx-auto space-y-8 print:space-y-6">
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

        <div className="hidden print:block border-b-2 border-gray-300 pb-2 text-center">
          <h1 className="text-2xl font-black uppercase tracking-tight">
            HireReady AI Assessment Registry Record
          </h1>
          <p className="text-xs text-gray-600">
            Automated Speech Screening Evaluation Matrix Logs · Topic:{" "}
            {liveReport.topic}
          </p>
        </div>

        <div className="bg-[#151D30]/80 border border-gray-800 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden shadow-2xl print:bg-gray-100 print:border-gray-300 print:text-black">
          <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-purple-500 to-blue-500 print:hidden" />

          <div className="text-center bg-[#0B0F19] border border-gray-800 px-8 py-6 rounded-2xl shrink-0 shadow-inner select-none print:bg-white print:border-gray-300">
            <span className="block text-[10px] uppercase font-black tracking-widest text-gray-500 print:text-gray-600">
              Evaluation Grade
            </span>
            <span className="text-5xl font-black text-purple-400 tracking-tight print:text-purple-700">
              {liveReport.score ?? 0}%
            </span>
          </div>

          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-xl font-bold text-white uppercase tracking-wide print:text-black">
              Technical Assessment Synthesis
            </h2>
            <p className="text-xs text-gray-400 leading-relaxed max-w-xl select-text print:text-gray-700">
              {liveReport.overallFeedback ||
                "The multi-round validation loop has evaluated your answers against industry standards."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="bg-[#151D30]/60 border border-gray-800 rounded-2xl p-5">
  <h3 className="text-xs font-black uppercase text-emerald-400 mb-3">
    Strengths
  </h3>

  {liveReport.strengths?.length > 0 ? (
    <ul className="space-y-2 text-xs text-gray-300">
      {liveReport.strengths.map((x, i) => (
        <li key={i}>✅ {x}</li>
      ))}
    </ul>
  ) : (
    <p className="text-xs text-gray-500 italic leading-relaxed">
      No clear strengths detected in this attempt.
    </p>
  )}
</div>

          <div className="bg-[#151D30]/60 border border-gray-800 rounded-2xl p-5">
            <h3 className="text-xs font-black uppercase text-red-400 mb-3">
              Weaknesses
            </h3>
            <ul className="space-y-2 text-xs text-gray-300">
              {(liveReport.weaknesses || []).map((x, i) => (
                <li key={i}>⚠️ {x}</li>
              ))}
            </ul>
          </div>

          <div className="bg-[#151D30]/60 border border-gray-800 rounded-2xl p-5">
            <h3 className="text-xs font-black uppercase text-blue-400 mb-3">
              Suggestions
            </h3>
            <ul className="space-y-2 text-xs text-gray-300">
              {(liveReport.suggestions || []).map((x, i) => (
                <li key={i}>💡 {x}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-6 print:space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 select-none print:text-black print:text-sm print:border-b print:pb-1">
            Round-by-Round Breakdown Matrix
          </h3>

          {Array.isArray(liveReport.questions) &&
            liveReport.questions.map((q, idx) => (
              <div
                key={idx}
                className="bg-[#151D30]/40 border border-gray-800 rounded-2xl p-6 space-y-4 shadow-md transition-all hover:border-gray-700/40 relative print:bg-white print:border-gray-300 print:shadow-none print:break-inside-avoid"
              >
                <div className="flex items-center gap-2 select-none">
                  <span className="flex items-center justify-center w-5 h-5 bg-purple-600/10 border border-purple-500/20 text-purple-400 rounded-md text-[10px] font-mono font-bold print:bg-gray-200 print:text-black print:border-gray-400">
                    0{idx + 1}
                  </span>
                  <span className="text-xs font-mono text-gray-400 tracking-wide select-text font-bold print:text-black print:text-xs">
                    {q.question}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 print:grid-cols-1 print:gap-2">
                  <div className="bg-[#0B0F19]/60 border border-gray-800/60 p-4 rounded-xl space-y-2 print:bg-gray-50 print:border-gray-200">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-gray-500 flex items-center gap-1 select-none print:text-gray-600">
                      <MessageSquare size={11} /> Your Speech Transcript
                    </span>
                    <p className="text-xs text-gray-300 leading-relaxed font-mono select-text italic print:text-gray-800">
                      "{q.answer || "No answer recorded."}"
                    </p>
                  </div>

                  <div className="bg-purple-950/10 border border-purple-900/20 p-4 rounded-xl space-y-2 print:bg-purple-50 print:bg-opacity-5 print:border-purple-200">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-purple-400 flex items-center gap-1 select-none print:text-purple-700">
                      <BookOpen size={11} /> Ideal Expert Response Solution
                    </span>
                    <p className="text-xs text-purple-200/90 leading-relaxed select-text font-sans print:text-purple-950">
                      {q.idealAnswer ||
                        "Mention standard design patterns, tradeoffs, caching boundaries, scalability, and real implementation details."}
                    </p>
                  </div>
                </div>

                <div className="bg-[#0B0F19] border border-gray-800 p-3.5 rounded-xl flex gap-2.5 items-start print:bg-amber-50 print:border-amber-200">
                  <Award
                    size={14}
                    className="text-amber-500 shrink-0 mt-0.5 select-none print:text-amber-700"
                  />
                  <div className="space-y-0.5">
                    <span className="block text-[9px] uppercase font-bold tracking-wider text-amber-500 select-none print:text-amber-700">
                      Target Correction Metrics
                    </span>
                    <p className="text-xs text-gray-400 leading-relaxed select-text print:text-amber-950">
                      {q.feedback ||
                        "Candidate answer tracks basic paradigms but can improve with stronger technical depth, examples, and tradeoff discussion."}
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