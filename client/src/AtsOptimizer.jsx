import { useState } from 'react';
import { FileText, Sparkles } from 'lucide-react';
import { apiUrl } from './config/api';

export default function AtsOptimizer({ onBackToHome }) {
  const [resumeText, setResumeText] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!resumeText.trim() || loading) return;
    setLoading(true);
    setReport(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(apiUrl('/api/resume/analyze'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'ats',
          resumeText: resumeText
        })
      });

      const json = await response.json();
      if (!response.ok) throw new Error(json.message || 'ATS calculation handshake failed.');
      
      setReport(json.data);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        
        <button onClick={onBackToHome} className="flex items-center gap-1.5 text-xs font-bold uppercase text-gray-400 hover:text-white mb-6 transition-colors cursor-pointer">
          Back to Dashboard
        </button>

        <div className="bg-[#151D30] border border-gray-800 rounded-2xl p-6 md:p-8 shadow-2xl mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl">
              <FileText size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">ATS Optimization Matrix</h2>
              <p className="text-xs text-gray-400">Paste your raw resume text payload below for AI analysis</p>
            </div>
          </div>

          <form onSubmit={handleAnalyze} className="space-y-4">
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              rows={10}
              placeholder="Paste your full resume content here (Projects, Experience, Skills)..."
              className="w-full bg-[#0B0F19] border border-gray-800 rounded-xl p-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors leading-relaxed resize-none font-sans"
            />
            <button
              type="submit"
              disabled={loading || !resumeText.trim()}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition-all cursor-pointer shadow-lg shadow-purple-600/10"
            >
              {loading ? 'Running Structural Diagnostic Scans...' : 'Compute Optimization Score'}
            </button>
          </form>
        </div>

        {report && (
          <div className="bg-[#151D30] border border-purple-500/20 rounded-2xl p-6 shadow-2xl animate-fade-in grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
            <div className="text-center p-5 bg-[#0B0F19] border border-gray-800 rounded-xl md:col-span-1 sticky top-4">
              <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500 font-mono block">ATS Score</span>
              <span className="text-4xl font-black text-purple-400 mt-1 block">{report.score}%</span>
            </div>
            <div className="md:col-span-3 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                <Sparkles size={14} /> AI Diagnostic Action Checklist
              </h3>
              <ul className="space-y-2.5">
                {report.feedback.map((item, idx) => (
                  <li key={idx} className="bg-[#0B0F19] border border-gray-800 p-3.5 rounded-xl flex items-start gap-3 text-sm text-gray-300 leading-relaxed select-text">
                    <span className="text-purple-400 font-bold shrink-0 mt-0.5">▪</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
