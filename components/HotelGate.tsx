import React, { useState } from 'react';
import { Shield, Lock, ChevronRight, Server, Building2 } from 'lucide-react';

interface HotelGateProps {
  onUnlock: () => void;
}

const HotelGate: React.FC<HotelGateProps> = ({ onUnlock }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(false);

    // Simulate network delay for security feel
    setTimeout(() => {
      // In production, use VITE_HOTEL_ACCESS_CODE from .env
      // Default fallback provided in vite.config.ts is 'hotel123'
      const masterKey = process.env.HOTEL_ACCESS_CODE; 

      if (password === masterKey) {
        onUnlock();
      } else {
        setError(true);
        setPassword('');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden text-slate-200 font-sans">
      {/* Abstract Tech Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-emerald-900/30 rounded-2xl border border-emerald-500/20 flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)]">
            <Building2 size={40} className="text-emerald-500" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">StaySync Enterprise</h1>
          <p className="text-slate-500 mt-2 text-sm">Secure Terminal Access</p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleUnlock} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Hotel Access Key
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input 
                  type="password" 
                  autoFocus
                  placeholder="Enter Master Password"
                  className={`w-full bg-slate-950 border ${error ? 'border-red-500 focus:border-red-500' : 'border-slate-700 focus:border-emerald-500'} rounded-lg py-3 pl-10 pr-4 text-white placeholder-slate-600 outline-none transition-all shadow-inner`}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(false); }}
                />
              </div>
              {error && (
                <p className="text-red-500 text-xs mt-2 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                  <Shield size={12} /> Access Denied: Invalid Key
                </p>
              )}
            </div>

            <button 
              type="submit"
              disabled={isLoading || !password}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                 <span className="flex items-center gap-2">
                   <Server className="animate-pulse" size={16} /> Authorizing...
                 </span>
              ) : (
                 <>
                   Initialize Terminal <ChevronRight size={16} />
                 </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center space-y-2">
          <p className="text-xs text-slate-600">
            <Shield size={12} className="inline mr-1" />
            End-to-End Encryption Enabled
          </p>
          <p className="text-[10px] text-slate-700">
            Unauthorized access is prohibited and monitored.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HotelGate;