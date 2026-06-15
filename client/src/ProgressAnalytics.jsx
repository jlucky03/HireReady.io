import React, { useEffect, useState } from "react";
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
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

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

  const statCards = [
    {
      label: "Total Interviews",
      value: analytics.totalInterviews,
      icon: BarChart3,
    },
    {
      label: "Completed",
      value: analytics.completedInterviews,
      icon: CheckCircle,
    },
    {
      label: "Average Score",
      value: `${analytics.averageScore}%`,
      icon: TrendingUp,
    },
    {
      label: "Best Score",
      value: `${analytics.bestScore}%`,
      icon: Trophy,
    },
    {
      label: "Latest Score",
      value: `${analytics.latestScore}%`,
      icon: Target,
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

        {/* Overall Cards */}
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
                </div>

                <p className="text-slate-400 text-xs uppercase font-bold mt-4">
                  {card.label}
                </p>
                <h2 className="text-2xl font-black mt-1">{card.value}</h2>
              </div>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Progress Over Time */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h2 className="text-lg font-black mb-4">Progress Over Time</h2>

            {analytics.progressOverTime.length === 0 ? (
              <p className="text-slate-500 text-sm">
                Complete interviews to see your progress chart.
              </p>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.progressOverTime}>
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

          {/* Topic Wise Performance */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h2 className="text-lg font-black mb-4">Topic-wise Performance</h2>

            {analytics.topicPerformance.length === 0 ? (
              <p className="text-slate-500 text-sm">
                Topic performance will appear after completed interviews.
              </p>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.topicPerformance}>
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
                    <Bar dataKey="averageScore" fill="#22c55e" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Weak Areas */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="text-lg font-black mb-4">Weak Area Suggestions</h2>

          {analytics.weakAreas.length === 0 ? (
            <div className="text-emerald-400 text-sm font-semibold">
              Great! No weak area detected below 60% yet.
            </div>
          ) : (
            <div className="space-y-3">
              {analytics.weakAreas.map((item) => (
                <div
                  key={item.topic}
                  className="flex gap-3 bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl"
                >
                  <AlertTriangle size={18} className="text-amber-400 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-300">
                      {item.topic} — {item.averageScore}%
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

        {/* Recent Interviews */}
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
                {analytics.recentInterviews.map((item) => (
                  <tr key={item.id} className="border-b border-slate-800/70">
                    <td className="py-3 font-bold">{item.topic}</td>
                    <td className="py-3 text-slate-400 capitalize">
                      {item.difficulty}
                    </td>
                    <td className="py-3">
                      {item.score !== null ? `${item.score}%` : "—"}
                    </td>
                    <td className="py-3">
                      <span className="capitalize text-xs font-bold px-2 py-1 rounded-lg bg-slate-800 text-slate-300">
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400">{item.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {analytics.recentInterviews.length === 0 && (
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