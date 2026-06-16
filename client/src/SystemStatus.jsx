import React, { useEffect, useState } from "react";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Database,
  Server,
  Radio,
} from "lucide-react";
import { apiUrl } from "./config/api";

export default function SystemStatus() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    try {
      const res = await fetch(apiUrl("/api/health"));
      const data = await res.json();
      setHealth(data);
    } catch {
      setHealth({
        status: "offline",
        server: "offline",
        mongo: "unknown",
        redis: "unknown",
        rabbitmq: "unknown",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();

    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const isOnline = health?.status === "ok";

  const statusItems = [
    {
      label: "API",
      value: health?.server || "checking",
      icon: Server,
    },
    {
      label: "MongoDB",
      value: health?.mongo || "checking",
      icon: Database,
    },
    {
      label: "Redis",
      value: health?.redis || "checking",
      icon: Activity,
    },
    {
      label: "RabbitMQ",
      value: health?.rabbitmq || "checking",
      icon: Radio,
    },
  ];

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl shadow-xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            {loading ? (
              <Activity size={18} className="animate-pulse text-blue-400" />
            ) : isOnline ? (
              <CheckCircle2 size={18} className="text-emerald-400" />
            ) : (
              <AlertTriangle size={18} className="text-amber-400" />
            )}

            <h3 className="text-sm font-black uppercase tracking-wider text-white">
              System Status
            </h3>
          </div>

          <p className="mt-1 text-xs text-slate-500">
            Live backend, database, cache and queue health check.
          </p>
        </div>

        <div
          className={`w-fit rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
            loading
              ? "border border-blue-500/20 bg-blue-500/10 text-blue-300"
              : isOnline
              ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
              : "border border-amber-500/20 bg-amber-500/10 text-amber-300"
          }`}
        >
          {loading ? "Checking" : isOnline ? "All Systems Online" : "Degraded"}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {statusItems.map((item) => {
          const Icon = item.icon;
          const connected =
            item.value === "connected" || item.value === "running";

          return (
            <div
              key={item.label}
              className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"
            >
              <div className="flex items-center justify-between">
                <Icon size={16} className="text-slate-400" />
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    connected ? "bg-emerald-400" : "bg-amber-400"
                  }`}
                />
              </div>

              <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {item.label}
              </p>
              <p
                className={`mt-1 text-xs font-black uppercase ${
                  connected ? "text-emerald-300" : "text-amber-300"
                }`}
              >
                {item.value}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}