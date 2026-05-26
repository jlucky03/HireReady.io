import React, { useState } from 'react';
import { Sparkles, Terminal, Sliders, Play } from 'lucide-react';

export default function InterviewSetup({ onStartInterview }) {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [loading, setLoading] = useState(false);

  const handleLaunch = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/interviews/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ topic, difficulty }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to initialize session');

      onStartInterview(data.interview);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-[#151D30] rounded-2xl border border-gray-800 p-8 shadow-2xl relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600" />
        
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="text-blue-500" /> Setup Your Training Session
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Configure your targets. The AI engine will instantly spin up a customized mock screening panel.
          </p>
        </div>

        <form onSubmit={handleLaunch} className="space-y-6">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-2 flex items-center gap-1.5">
              <Terminal size={14} /> What topic or target role do you want to test?
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
              rows={3}
              placeholder="e.g., React Hooks lifecycle and state tracking, System design optimization for an Uber-like application, Junior Python algorithms..."
              className="w-full bg-[#0B0F19] border border-gray-800 rounded-xl py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-all text-sm leading-relaxed"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-3 flex items-center gap-1.5">
              <Sliders size={14} /> Targeted Difficulty Level
            </label>
            <div className="grid grid-cols-3 gap-4">
              {['easy', 'medium', 'hard'].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setDifficulty(level)}
                  className={`py-3 rounded-xl border font-medium uppercase tracking-wider text-xs transition-all duration-200 ${
                    difficulty === level
                      ? 'bg-blue-600/10 border-blue-500 text-blue-400 shadow-lg'
                      : 'bg-[#0B0F19] border-gray-800 text-gray-400 hover:border-gray-700'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !topic.trim()}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl py-3 flex items-center justify-center gap-2 transition-all group"
          >
            {loading ? 'Compiling Dynamic Script...' : 'Launch AI Simulator'}
            <Play size={16} className="fill-current group-hover:translate-x-0.5 transition-transform" />
          </button>
        </form>
      </div>
    </div>
  );
}