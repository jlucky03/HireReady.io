import { useEffect, useState } from "react";
import {
  ShieldCheck,
  Users,
  CreditCard,
  Activity,
  AlertTriangle,
  Database,
  Server,
  Radio,
  ArrowLeft,
  RefreshCcw,
  Save,
} from "lucide-react";
import { apiUrl } from "./config/api";

export default function AdminDashboard({ onBack }) {
  const [overview, setOverview] = useState(null);
  const [health, setHealth] = useState(null);
  const [users, setUsers] = useState([]);
  const [failedInterviews, setFailedInterviews] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [savingUserId, setSavingUserId] = useState(null);
  const [creditInputs, setCreditInputs] = useState({});
  const [error, setError] = useState("");

  const getToken = () => localStorage.getItem("token");

  const buildCreditInputMap = (usersData) => {
    const inputMap = {};

    if (Array.isArray(usersData)) {
      usersData.forEach((u) => {
        inputMap[u._id] = u.credits;
      });
    }

    return inputMap;
  };

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [overviewRes, usersRes, failedRes, healthRes] = await Promise.all([
        fetch(apiUrl("/api/admin/overview"), { headers }),
        fetch(apiUrl(`/api/admin/users?search=${encodeURIComponent(search)}`), {
          headers,
        }),
        fetch(apiUrl("/api/admin/failed-interviews"), { headers }),
        fetch(apiUrl("/api/admin/health"), { headers }),
      ]);

      const overviewData = await overviewRes.json();
      const usersData = await usersRes.json();
      const failedData = await failedRes.json();
      const healthData = await healthRes.json();

      if (!overviewRes.ok) {
        throw new Error(overviewData.message || "Admin access failed.");
      }

      setOverview(overviewData);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setFailedInterviews(Array.isArray(failedData) ? failedData : []);
      setHealth(healthData);
      setCreditInputs(buildCreditInputMap(usersData));
    } catch (err) {
      setError(err.message || "Failed to load admin dashboard.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminLiveStatus = async () => {
  try {
    const token = getToken();

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    const [overviewRes, failedRes] = await Promise.all([
      fetch(apiUrl("/api/admin/overview"), { headers }),
      fetch(apiUrl("/api/admin/failed-interviews"), { headers }),
    ]);

    const overviewData = await overviewRes.json();
    const failedData = await failedRes.json();

    if (overviewRes.ok) {
      setOverview(overviewData);
    }

    if (failedRes.ok) {
      setFailedInterviews(Array.isArray(failedData) ? failedData : []);
    }
  } catch (err) {
    console.error("Live admin status sync failed:", err.message);
  }
};

 

  const searchUsers = async () => {
    try {
      setUsersLoading(true);

      const token = getToken();

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const usersRes = await fetch(
        apiUrl(`/api/admin/users?search=${encodeURIComponent(search)}`),
        { headers }
      );

      const usersData = await usersRes.json();

      if (!usersRes.ok) {
        throw new Error(usersData.message || "Failed to search users.");
      }

      setUsers(Array.isArray(usersData) ? usersData : []);
      setCreditInputs(buildCreditInputMap(usersData));
    } catch (err) {
      alert(err.message || "Failed to search users.");
    } finally {
      setUsersLoading(false);
    }
  };

  const resetSearch = async () => {
    try {
      setSearch("");
      setUsersLoading(true);

      const token = getToken();

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const usersRes = await fetch(apiUrl("/api/admin/users"), { headers });
      const usersData = await usersRes.json();

      if (!usersRes.ok) {
        throw new Error(usersData.message || "Failed to reset users.");
      }

      setUsers(Array.isArray(usersData) ? usersData : []);
      setCreditInputs(buildCreditInputMap(usersData));
    } catch (err) {
      alert(err.message || "Failed to reset search.");
    } finally {
      setUsersLoading(false);
    }
  };

  const retryFailedEvaluation = async (interviewId) => {
    try {
      const token = getToken();

      const res = await fetch(
        apiUrl(`/api/admin/failed-interviews/${interviewId}/retry`),
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

      setFailedInterviews((prev) =>
        prev.filter((item) => item._id !== interviewId)
      );

      setOverview((prev) => ({
        ...prev,
        failedInterviews: Math.max((prev?.failedInterviews || 1) - 1, 0),
        evaluatingInterviews: (prev?.evaluatingInterviews || 0) + 1,
      }));

      alert("Evaluation retry queued successfully.");
    } catch (err) {
      alert(err.message || "Failed to retry evaluation.");
    }
  };

  const updateCredits = async (userId) => {
    try {
      setSavingUserId(userId);

      const token = getToken();
      const credits = Number(creditInputs[userId]);

      const res = await fetch(apiUrl(`/api/admin/users/${userId}/credits`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ credits }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to update credits.");
      }

      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, credits } : u))
      );
    } catch (err) {
      alert(err.message || "Failed to update credits.");
    } finally {
      setSavingUserId(null);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAdminData();
  }, []);

  useEffect(() => {
  if (!overview?.evaluatingInterviews) return;

  const interval = setInterval(() => {
    fetchAdminLiveStatus();
  }, 3000);

  return () => clearInterval(interval);
}, [overview?.evaluatingInterviews]);

  useEffect(() => {
    if (!overview?.evaluatingInterviews) return;

    const interval = setInterval(() => {
      fetchAdminLiveStatus();
    }, 3000);

    return () => clearInterval(interval);
  }, [overview?.evaluatingInterviews]);

  const formatRevenue = (amount) => {
    const value = Number(amount || 0);
    return `Rs. ${Math.round(value / 100)}`;
  };

  const healthItems = [
    { label: "API", value: health?.server || "unknown", icon: Server },
    { label: "MongoDB", value: health?.mongo || "unknown", icon: Database },
    { label: "Redis", value: health?.redis || "unknown", icon: Activity },
    { label: "RabbitMQ", value: health?.rabbitmq || "unknown", icon: Radio },
  ];

  const cards = [
    {
      label: "Total Users",
      value: overview?.totalUsers ?? 0,
      icon: Users,
    },
    {
      label: "Total Interviews",
      value: overview?.totalInterviews ?? 0,
      icon: Activity,
    },
    {
      label: "Completed",
      value: overview?.completedInterviews ?? 0,
      icon: ShieldCheck,
    },
    {
      label: "Evaluating",
      value: overview?.evaluatingInterviews ?? 0,
      icon: RefreshCcw,
    },
    {
      label: "Failed",
      value: overview?.failedInterviews ?? 0,
      icon: AlertTriangle,
    },
    {
      label: "Revenue",
      value: formatRevenue(overview?.totalRevenue),
      icon: CreditCard,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        Loading admin dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="max-w-lg w-full rounded-3xl border border-red-500/20 bg-red-500/10 p-8 text-center">
          <AlertTriangle className="mx-auto text-red-400" size={42} />

          <h1 className="mt-4 text-2xl font-black">Admin Access Failed</h1>

          <p className="mt-3 text-sm text-red-200">{error}</p>

          <button
            onClick={onBack}
            className="mt-6 rounded-2xl bg-white/10 px-5 py-3 text-xs font-bold uppercase text-white hover:bg-white/20"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-5 md:p-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-500/10 text-yellow-300 border border-yellow-500/20">
              <ShieldCheck size={28} />
            </div>

            <div>
              <h1 className="text-3xl font-black text-white">
                Admin Dashboard
              </h1>
              <p className="text-sm text-slate-400">
                Manage users, credits, failed evaluations and service health.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {overview?.evaluatingInterviews > 0 && (
              <span className="flex items-center gap-2 rounded-2xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-xs font-bold uppercase text-blue-300">
                <RefreshCcw size={14} className="animate-spin" />
                Live Sync
              </span>
            )}


            {overview?.evaluatingInterviews > 0 && (
  <span className="flex items-center gap-2 rounded-2xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-xs font-bold uppercase text-blue-300">
    <RefreshCcw size={14} className="animate-spin" />
    Live Sync
  </span>
)}

            <button
              onClick={fetchAdminData}
              className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-bold uppercase text-slate-300 hover:bg-white/10"
            >
              <RefreshCcw size={15} />
              Refresh
            </button>

            <button
              onClick={onBack}
              className="flex items-center gap-2 rounded-2xl bg-purple-600 px-4 py-3 text-xs font-bold uppercase text-white hover:bg-purple-500"
            >
              <ArrowLeft size={15} />
              Logout
            </button>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.label}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"
              >
                <div className="flex items-center justify-between">
                  <Icon size={20} className="text-purple-300" />
                  <span className="rounded-full bg-purple-500/10 px-2 py-1 text-[10px] font-bold text-purple-300">
                    LIVE
                  </span>
                </div>

                <p className="mt-5 text-xs font-bold uppercase tracking-wider text-slate-500">
                  {card.label}
                </p>

                <p className="mt-1 text-3xl font-black text-white">
                  {card.value}
                </p>
              </div>
            );
          })}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-white">Service Health</h2>
              <p className="text-xs text-slate-500">
                Backend, database, cache and queue status.
              </p>
            </div>

            <span
              className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${
                health?.status === "ok"
                  ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-300 border border-amber-500/20"
              }`}
            >
              {health?.status || "unknown"}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            {healthItems.map((item) => {
              const Icon = item.icon;
              const ok = item.value === "connected" || item.value === "running";

              return (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"
                >
                  <Icon size={17} className="text-slate-400" />

                  <p className="mt-3 text-[10px] font-bold uppercase text-slate-500">
                    {item.label}
                  </p>

                  <p
                    className={`mt-1 text-xs font-black uppercase ${
                      ok ? "text-emerald-300" : "text-amber-300"
                    }`}
                  >
                    {item.value}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-lg font-black text-white">User Credits</h2>

            <p className="text-xs text-slate-500">
              Manually adjust credits for support/testing.
            </p>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") searchUsers();
                }}
                placeholder="Search user by name or email..."
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-purple-500/40"
              />

              <button
                type="button"
                onClick={searchUsers}
                className="rounded-2xl bg-purple-600 px-4 py-3 text-xs font-bold uppercase text-white transition-all hover:bg-purple-500"
              >
                Search
              </button>

              <button
                type="button"
                onClick={resetSearch}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-bold uppercase text-slate-300 transition-all hover:bg-white/10"
              >
                Reset
              </button>
            </div>

            {usersLoading && (
              <p className="mt-3 text-xs text-purple-300">
                Updating user list...
              </p>
            )}

            <div className="mt-5 space-y-3 max-h-[430px] overflow-y-auto pr-1">
              {users.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-8 text-center text-sm text-slate-500">
                  No users found.
                </div>
              ) : (
                users.map((u) => (
                  <div
                    key={u._id}
                    className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-bold text-white">{u.name}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                        <p className="mt-1 text-[10px] uppercase text-purple-300">
                          User Account
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={creditInputs[u._id] ?? 0}
                          onChange={(e) =>
                            setCreditInputs((prev) => ({
                              ...prev,
                              [u._id]: e.target.value,
                            }))
                          }
                          className="w-24 rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        />

                        <button
                          onClick={() => updateCredits(u._id)}
                          disabled={savingUserId === u._id}
                          className="flex items-center gap-1 rounded-xl bg-purple-600 px-3 py-2 text-xs font-bold text-white hover:bg-purple-500 disabled:opacity-60"
                        >
                          <Save size={13} />
                          {savingUserId === u._id ? "Saving" : "Save"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-lg font-black text-white">
              Failed Evaluations
            </h2>

            <p className="text-xs text-slate-500">
              Recent worker/API failures from async evaluation.
            </p>

            <div className="mt-5 space-y-3 max-h-[430px] overflow-y-auto pr-1">
              {failedInterviews.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-8 text-center text-sm text-slate-500">
                  No failed evaluations found.
                </div>
              ) : (
                failedInterviews.map((item) => (
                  <div
                    key={item._id}
                    className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4"
                  >
                    <p className="font-bold text-white">
                      {item.topic?.length > 50
                        ? "Personal Resume Screen"
                        : item.topic}
                    </p>

                    <p className="mt-1 text-xs text-red-200">
                      {item.user?.email || "Unknown user"}
                    </p>

                    <p className="mt-2 text-xs text-slate-400 line-clamp-2">
                      {item.overallFeedback || "No failure details available."}
                    </p>

                    <button
                      onClick={() => retryFailedEvaluation(item._id)}
                      className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold uppercase text-white transition-all hover:bg-red-500"
                    >
                      Retry Evaluation
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
