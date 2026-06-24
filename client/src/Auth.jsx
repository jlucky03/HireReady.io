import { useState } from 'react';
import { Mail, Lock, User, Terminal, ArrowRight } from 'lucide-react';
import { apiUrl } from './config/api';

export default function Auth({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
    
    try {
      // Connects directly to our local running Express backend port 5000
      const response = await fetch(apiUrl(endpoint), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication handshake failed.');
      }

      // Securely store the returned JSON Web Token and Profile locally
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Cascade the successful auth signal back up to App.jsx to toggle views
      if (onAuthSuccess) {
        onAuthSuccess();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#151D30] rounded-2xl border border-gray-800 p-8 shadow-2xl relative overflow-hidden">
        
        {/* Subdued Premium Top Tech Border */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-blue-500/10 rounded-xl text-blue-500 mb-3">
            <Terminal size={28} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Intervyo.ai</h1>
          <p className="text-gray-400 text-sm mt-1">
            {isLogin ? 'Welcome back. Sign in to practice.' : 'Create your account to start evaluation.'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="John Doe"
                  className="w-full bg-[#0B0F19] border border-gray-800 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors text-sm"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="you@example.com"
                className="w-full bg-[#0B0F19] border border-gray-800 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                  placeholder="Password"
                className="w-full bg-[#0B0F19] border border-gray-800 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl py-2.5 px-4 mt-2 flex items-center justify-center gap-2 transition-colors duration-200 disabled:opacity-50 group text-sm"
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          {isLogin ? "Don't have an account?" : 'Already have an account?'} {' '}
          <button
            onClick={() => { setError(''); setIsLogin(!isLogin); }}
            className="text-blue-500 hover:underline font-medium"
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </div>

      </div>
    </div>
  );
}
