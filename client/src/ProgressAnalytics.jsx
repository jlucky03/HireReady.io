import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Trophy,
  BarChart3,
  TrendingUp,
  Target,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { apiUrl } from "./config/api";

export default function ProgressAnalytics({ onBack }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch(apiUrl("/api/interviews/analytics"), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to load analytics");
        }

        setAnalytics(data);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const getScoreClass = (score) => {
    if (typeof score !== "number") return "text-slate-400";
    if (score < 40) return "text-red-400";
    if (score < 70) return "text-amber-400";
    return "text-emerald-400";
  };

  const getStatusClass = (status) => {
  if (status === "completed") return "bg-emerald-500/10 text-emerald-300";
  if (status === "failed") return "bg-red-500/10 text-red-300";
  if (status === "evaluating") return "bg-blue-500/10 text-blue-300";
  return "bg-amber-500/10 text-amber-300";
};

const getScoreBadgeClass = (score) => {
  if (typeof score !== "number")
    return "bg-slate-700/30 text-slate-300";

  if (score < 40)
    return "bg-red-500/10 text-red-300";

  if (score < 70)
    return "bg-amber-500/10 text-amber-300";

  return "bg-emerald-500/10 text-emerald-300";
};

  const safeAnalytics = useMemo(() => {
    const completedRecent = (analytics?.recentInterviews || []).filter(
      (item) => item.status === "completed" && typeof item.score === "number"
    );

    const progressOverTime = (analytics?.progressOverTime || []).filter(
      (item) => typeof item.score === "number"
    );

    const topicPerformance = (analytics?.topicPerformance || []).filter(
      (item) => typeof item.averageScore === "number"
    );

    const weakAreas = (analytics?.weakAreas || []).filter(
      (item) => typeof item.averageScore === "number" && item.averageScore < 60
    );

    const latest = completedRecent[0]?.score ?? analytics?.latestScore ?? 0;
    const previous = completedRecent[1]?.score ?? null;
    const trend =
      previous === null || typeof latest !== "number" ? null : latest - previous;

    return {
      totalInterviews: analytics?.totalInterviews || 0,
      completedInterviews:
        analytics?.completedInterviews || completedRecent.length || 0,
      averageScore: analytics?.averageScore || 0,
      bestScore: analytics?.bestScore || 0,
      latestScore: latest,
      trend,
      progressOverTime,
      topicPerformance,
      weakAreas,
      recentInterviews: analytics?.recentInterviews || [],
    };
  }, [analytics]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-slate-400">Loading your progress...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-5 rounded-2xl">
          {error}
        </div>
      </div>
    );
  }

  const hasCompleted = safeAnalytics.completedInterviews > 0;

  const statCards = [
    {
      label: "Total Attempts",
      value: safeAnalytics.totalInterviews,
      icon: BarChart3,
      score: null,
    },
    {
      label: "Completed",
      value: safeAnalytics.completedInterviews,
      icon: CheckCircle,
      score: null,
    },
    {
      label: "Average Score",
      value: hasCompleted ? `${safeAnalytics.averageScore}%` : "-",
      icon: TrendingUp,
      score: hasCompleted ? safeAnalytics.averageScore : null,
    },
    {
      label: "Best Score",
      value: hasCompleted ? `${safeAnalytics.bestScore}%` : "-",
      icon: Trophy,
      score: hasCompleted ? safeAnalytics.bestScore : null,
    },
    {
      label: "Latest Score",
      value: hasCompleted ? `${safeAnalytics.latestScore}%` : "-",
      icon: Target,
      score: hasCompleted ? safeAnalytics.latestScore : null,
      trend: safeAnalytics.trend,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black">My Progress</h1>
            <p className="text-slate-400 text-sm mt-1">
              Track your interview performance and weak areas.
            </p>
          </div>

          <button
            onClick={onBack}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl text-sm font-bold"
          >
            <ArrowLeft size={16} />
            Back
          </button>
        </div>

        {!hasCompleted && (
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-5 text-indigo-200">
            <p className="font-bold">No completed interview analytics yet.</p>
            <p className="text-sm text-indigo-200/80 mt-1">
              Complete your first AI interview to unlock progress tracking.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {statCards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.label}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5"
              >
                <div className="flex items-center justify-between">
                  <div className="bg-indigo-500/10 p-3 rounded-xl">
                    <Icon size={20} className="text-indigo-400" />
                  </div>

                  {card.label === "Latest Score" &&
                    typeof card.trend === "number" && (
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded-lg ${
                          card.trend > 0
                            ? "bg-emerald-500/10 text-emerald-300"
                            : card.trend < 0
                            ? "bg-red-500/10 text-red-300"
                            : "bg-slate-700/50 text-slate-300"
                        }`}
                      >
                        {card.trend > 0
                          ? `+${card.trend}%`
                          : card.trend < 0
                          ? `${card.trend}%`
                          : "0%"}
                      </span>
                    )}
                </div>

                <p className="text-slate-400 text-xs uppercase font-bold mt-4">
                  {card.label}
                </p>
                <h2
  className={`text-2xl font-black mt-1 ${
    card.label.includes("Score")
      ? getScoreClass(parseInt(card.value))
      : ""
  }`}
>
  {card.value}
</h2>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h2 className="text-lg font-black mb-4">Progress Over Time</h2>

            {safeAnalytics.progressOverTime.length === 0 ? (
              <p className="text-slate-500 text-sm">
                Complete interviews to see your progress chart.
              </p>
            ) : (
              <div className="h-[300px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={safeAnalytics.progressOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="label" stroke="#94a3b8" />
                    <YAxis domain={[0, 100]} stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#020617",
                        border: "1px solid #334155",
                        borderRadius: "12px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#818cf8"
                      strokeWidth={3}
                      dot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h2 className="text-lg font-black mb-4">Topic-wise Performance</h2>

            {safeAnalytics.topicPerformance.length === 0 ? (
              <p className="text-slate-500 text-sm">
                Topic performance will appear after completed interviews.
              </p>
            ) : (
              <div className="h-[300px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={safeAnalytics.topicPerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="topic" stroke="#94a3b8" />
                    <YAxis domain={[0, 100]} stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#020617",
                        border: "1px solid #334155",
                        borderRadius: "12px",
                      }}
                    />
                    <Bar
                      dataKey="averageScore"
                      fill="#22c55e"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="text-lg font-black mb-4">Weak Area Suggestions</h2>

          {safeAnalytics.weakAreas.length === 0 ? (
            <div className="text-emerald-400 text-sm font-semibold">
              {hasCompleted
                ? "Great! No weak area detected below 60% yet."
                : "Weak areas will appear after completed interviews."}
            </div>
          ) : (
            <div className="space-y-3">
              {safeAnalytics.weakAreas.map((item) => (
                <div
                  key={item.topic}
                  className="flex gap-3 bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl"
                >
                  <AlertTriangle size={18} className="text-amber-400 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-300">
                      {item.topic} - {item.averageScore}%
                    </p>
                    <p className="text-slate-300 text-sm mt-1">
                      {item.suggestion}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="text-lg font-black mb-4">Recent Interview Summary</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800">
                  <th className="text-left py-3">Topic</th>
                  <th className="text-left py-3">Difficulty</th>
                  <th className="text-left py-3">Score</th>
                  <th className="text-left py-3">Status</th>
                  <th className="text-left py-3">Date</th>
                </tr>
              </thead>

              <tbody>
                {safeAnalytics.recentInterviews.map((item) => (
                  <tr key={item.id} className="border-b border-slate-800/70">
                    <td className="py-3 font-bold">{item.topic}</td>
                    <td className="py-3 text-slate-400 capitalize">
                      {item.difficulty}
                    </td>
                    <td className="py-3">
  {item.score !== null ? (
    <span
      className={`px-2 py-1 rounded-lg text-xs font-bold ${getScoreBadgeClass(
        item.score
      )}`}
    >
      {item.score}%
    </span>
  ) : (
    "-"
  )}
</td>
                    <td className="py-3">
                      <span
                        className={`capitalize text-xs font-bold px-2 py-1 rounded-lg ${getStatusClass(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400">{item.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {safeAnalytics.recentInterviews.length === 0 && (
              <p className="text-slate-500 text-sm py-5">
                No interviews found yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}