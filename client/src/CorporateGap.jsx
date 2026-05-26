import React, { useState } from 'react';
import { ArrowLeft, Building2, AlertTriangle, Sparkles } from 'lucide-react';

export default function CorporateGap({ onBackToHome }) {
  const [company, setCompany] = useState('Google');
  const [role, setRole] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  const handleAudit = async (e) => {
    e.preventDefault();
    if (!role.trim() || !resumeText.trim() || loading) return;
    setLoading(true);
    setReport(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/resume/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'gap',
          resumeText,
          targetCompany: company,
          targetRole: role
        })
      });

      const json = await response.json();
      if (!response.ok) throw new Error(json.message || 'Corporate gap pipeline error.');

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
          ← Back to Dashboard
        </button>

        <div className="bg-[#151D30] border border-gray-800 rounded-2xl p-6 md:p-8 shadow-2xl mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl">
              <Building2 size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Corporate Gap Bridge Analyzer</h2>
              <p className="text-xs text-gray-400">Cross-reference your tech stack against production-level criteria</p>
            </div>
          </div>

          <form onSubmit={handleAudit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">Target Enterprise Company</label>
                <select
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-gray-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
                >
                  <option value="Google">Google</option>
                  <option value="Microsoft">Microsoft</option>
                  <option value="Meta">Meta</option>
                  <option value="Stripe">Stripe</option>
                  <option value="TCS">TCS / Mass Recruiter</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">Target SDE Role Title</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                  placeholder="e.g., Fullstack Node Developer, Systems Intern"
                  className="w-full bg-[#0B0F19] border border-gray-800 rounded-xl py-2.5 px-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">Paste Resume Content For Audit</label>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                required
                rows={6}
                placeholder="Paste your profile text block here to run alignment queries..."
                className="w-full bg-[#0B0F19] border border-gray-800 rounded-xl p-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 transition-colors leading-relaxed resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !role.trim() || !resumeText.trim()}
              className="w-full mt-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-[#0B0F19] font-black text-xs uppercase tracking-wider py-3 rounded-xl transition-all cursor-pointer shadow-lg shadow-amber-500/10"
            >
              {loading ? 'Extracting Job Requirements & Reviewing Ecosystem...' : 'Audit Target Company Gaps'}
            </button>
          </form>
        </div>

        {report && (
          <div className="bg-[#151D30] border border-gray-800 rounded-2xl p-6 shadow-2xl animate-fade-in space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800/60 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                <AlertTriangle size={14} /> Missing Core Competencies: {company} ({role})
              </h3>
              <span className="text-xs font-mono bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">
                Match Index: {report.score}/100
              </span>
            </div>
            <ul className="space-y-2.5 text-sm text-gray-300 list-inside">
              {report.feedback.map((gap, index) => (
                <li key={index} className="bg-[#0B0F19] border border-gray-800 p-4 rounded-xl flex items-start gap-3 select-text leading-relaxed">
                  <span className="text-amber-500 font-bold shrink-0 mt-0.5">✕</span>
                  <span>{gap}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

      </div>
    </div>
  );
}