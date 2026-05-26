import React, { useEffect, useState } from 'react';
import { Calendar, BookOpen, AlertCircle, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';

export default function HistoryCenter({ onSelectInterview, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/interviews/history', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) setHistory(data.history || []);
      } catch (err) {
        console.error("Error loading historical metrics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const handleResumeOrView = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/interviews/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        onSelectInterview(data.interview);
      }
    } catch (err) {
      alert("Failed to pull session state metadata.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Dynamic Isolated Navigation Row */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-6 mb-8">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">Your Historical Records Index</h1>
            <p className="text-xs text-gray-400 mt-1 font-mono">Review past placement grades or resume pending loops</p>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl border border-gray-700 transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} /> Back To Dashboard
          </button>
        </div>

        {/* Dynamic List Rendering */}
        {loading ? (
          <div className="text-center py-12 text-gray-500 text-sm font-mono animate-pulse">
            Compiling historical data matrices...
          </div>
        ) : history.length === 0 ? (
          <div className="text-center bg-[#151D30] border border-gray-800 rounded-2xl p-12 shadow-xl">
            <BookOpen size={40} className="mx-auto text-gray-600 mb-3" />
            <h3 className="text-base font-semibold text-white">No Practice History Found</h3>
            <p className="text-xs text-gray-400 mt-1 mb-6">Initialize parameters on the main dashboard to trigger your first training loop.</p>
            <button onClick={onClose} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all cursor-pointer">
              Return to Dashboard
            </button>
          </div>
        ) : (
          <div className="bg-[#151D30] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-gray-800/60 bg-gray-900/20">
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Past Assessment Index</h2>
            </div>
            <div className="divide-y divide-gray-800/60">
              {history.map((item) => (
                <div key={item._id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-800/10 transition-colors">
                  <div className="space-y-1 max-w-xl">
                    <h3 className="text-sm font-semibold text-gray-100 truncate">{item.topic}</h3>
                    <div className="flex items-center gap-4 text-xs text-gray-400 font-medium">
                      <span className="uppercase font-mono text-[10px] bg-gray-800 px-1.5 py-0.5 rounded text-gray-300">
                        {item.difficulty}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        {item.isFinished ? (
                          <span className="text-emerald-400 flex items-center gap-1"><CheckCircle size={12}/> Evaluated</span>
                        ) : (
                          <span className="text-amber-400 flex items-center gap-1 animate-pulse"><AlertCircle size={12}/> In Progress</span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 justify-between md:justify-end">
                    {item.isFinished && (
                      <div className="text-right">
                        <span className="text-xs text-gray-500 block uppercase font-mono">Score</span>
                        <span className="text-base font-extrabold text-white">{item.score} / 100</span>
                      </div>
                    )}
                    <button
                      onClick={() => handleResumeOrView(item._id)}
                      className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
                        item.isFinished
                          ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700'
                          : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20'
                      }`}
                    >
                      {item.isFinished ? 'View Metrics' : 'Resume Test'}
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}