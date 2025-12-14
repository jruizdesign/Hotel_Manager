import React, { useState } from 'react';
import { Shield, Lock, ChevronRight, Server, Building2, AlertCircle, CloudOff } from 'lucide-react';
import { loginTerminal } from '../services/firebase';

const TerminalAuth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await loginTerminal(email, password);
      // Success is handled by the onAuthStateChanged listener in App.tsx
    } catch (err: any) {
      console.error("Auth Error", err);
      if (err.message.includes("Cloud connection not active")) {
        setError("System Offline: Firebase Config missing in Environment Variables.");
      } else if (err.code === 'auth/invalid-credential') {
        setError("Invalid Email or Password.");
      } else if (err.code === 'auth/too-many-requests') {
        setError("Too many failed attempts. Try again later.");
      } else {
        setError("Authentication Failed. Check connection.");
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden text-slate-200 font-sans">
      {/* Background Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-emerald-900/30 rounded-2xl border border-emerald-500/20 flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)]">
            <Building2 size={40} className="text-emerald-500" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">StaySync Cloud</h1>
          <p className="text-slate-500 mt-2 text-sm">Authorized Terminal Access</p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Administrator Email
              </label>
              <input 
                type="email" 
                autoFocus
                required
                placeholder="admin@hotel.com"
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-lg py-3 px-4 text-white placeholder-slate-600 outline-none transition-all shadow-inner"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-lg py-3 pl-10 pr-4 text-white placeholder-slate-600 outline-none transition-all shadow-inner"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-900/20 border border-red-900/50 rounded-lg flex items-start gap-2 text-red-400 text-xs animate-in fade-in slide-in-from-top-1">
                {error.includes("Offline") ? <CloudOff size={16} className="shrink-0" /> : <AlertCircle size={16} className="shrink-0" />}
                <span>{error}</span>
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                 <span className="flex items-center gap-2">
                   <Server className="animate-pulse" size={16} /> Authenticating...
                 </span>
              ) : (
                 <>
                   Connect Terminal <ChevronRight size={16} />
                 </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center space-y-2">
          <p className="text-xs text-slate-600">
            <Shield size={12} className="inline mr-1" />
            Secured by Google Firebase Authentication
          </p>
        </div>
      </div>
    </div>
  );
};

export default TerminalAuth;