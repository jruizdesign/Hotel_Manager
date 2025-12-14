import React, { useState } from 'react';
import { Shield, Lock, ChevronRight, Server, Building2, AlertCircle, CloudOff, KeyRound, ArrowLeft, Mail, CheckCircle2, UserPlus } from 'lucide-react';
import { loginTerminal, resetTerminalPassword, registerTerminalUser } from '../services/firebase';

const TerminalAuth: React.FC = () => {
  const [view, setView] = useState<'login' | 'forgot' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
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
      if (err.message?.includes("Cloud connection not active")) {
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setIsLoading(false);
      return;
    }

    try {
      await registerTerminalUser(email, password);
      // Registration automatically signs the user in
    } catch (err: any) {
      console.error("Registration Error", err);
      if (err.code === 'auth/email-already-in-use') {
        setError("Account already exists. Try logging in.");
      } else if (err.code === 'auth/invalid-email') {
        setError("Invalid email format.");
      } else if (err.code === 'auth/weak-password') {
        setError("Password is too weak.");
      } else {
        setError("Failed to create account. Check console for details.");
      }
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    if (!email) {
      setError("Please enter your email address.");
      setIsLoading(false);
      return;
    }

    try {
      await resetTerminalPassword(email);
      setSuccess("Password reset link sent! Check your inbox.");
      setIsLoading(false);
    } catch (err: any) {
       console.error("Reset Error", err);
       if (err.code === 'auth/user-not-found') {
          // For security, usually we don't say if user exists, but for internal app it helps
          setError("No account found with this email."); 
       } else if (err.code === 'auth/invalid-email') {
          setError("Invalid email format.");
       } else {
          setError("Failed to send reset email. Try again.");
       }
       setIsLoading(false);
    }
  };

  const resetState = (newView: 'login' | 'forgot' | 'register') => {
    setView(newView);
    setError(null);
    setSuccess(null);
    setConfirmPassword('');
    // We keep email/password state for convenience when switching between register/login
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

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl transition-all duration-300">
          
          {view === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
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
                <div className="flex justify-end mt-2">
                   <button 
                     type="button" 
                     onClick={() => resetState('forgot')}
                     className="text-xs text-emerald-500 hover:text-emerald-400 font-medium"
                   >
                     Forgot Password?
                   </button>
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

              <div className="pt-4 border-t border-slate-800 text-center">
                 <p className="text-xs text-slate-500 mb-2">First time setting up?</p>
                 <button
                   type="button"
                   onClick={() => resetState('register')}
                   className="text-sm font-bold text-emerald-500 hover:text-emerald-400 transition-colors"
                 >
                   Create Administrator Account
                 </button>
              </div>
            </form>
          )}

          {view === 'register' && (
            <form onSubmit={handleRegister} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-2">
                 <h2 className="text-white font-bold text-lg flex items-center justify-center gap-2">
                   <UserPlus size={20} className="text-emerald-500" /> Create Account
                 </h2>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Email Address
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
                    placeholder="Create Password"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-lg py-3 pl-10 pr-4 text-white placeholder-slate-600 outline-none transition-all shadow-inner"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input 
                    type="password" 
                    required
                    placeholder="Confirm Password"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-lg py-3 pl-10 pr-4 text-white placeholder-slate-600 outline-none transition-all shadow-inner"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-900/20 border border-red-900/50 rounded-lg flex items-start gap-2 text-red-400 text-xs animate-in fade-in slide-in-from-top-1">
                   <AlertCircle size={16} className="shrink-0" />
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
                     <Server className="animate-pulse" size={16} /> Creating...
                   </span>
                ) : (
                   "Create Account"
                )}
              </button>

              <button 
                type="button"
                onClick={() => resetState('login')}
                className="w-full text-slate-500 hover:text-white text-xs py-2 flex items-center justify-center gap-1 transition-colors"
              >
                <ArrowLeft size={12} /> Back to Login
              </button>
            </form>
          )}

          {view === 'forgot' && (
            <form onSubmit={handleResetPassword} className="space-y-5 animate-in fade-in slide-in-from-left-4 duration-300">
              <div className="text-center mb-2">
                 <h2 className="text-white font-bold text-lg flex items-center justify-center gap-2">
                   <KeyRound size={20} className="text-emerald-500" /> Reset Password
                 </h2>
                 <p className="text-slate-500 text-xs mt-1">Enter your admin email to receive a reset link.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input 
                    type="email" 
                    autoFocus
                    required
                    placeholder="admin@hotel.com"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-lg py-3 pl-10 pr-4 text-white placeholder-slate-600 outline-none transition-all shadow-inner"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(null); setSuccess(null); }}
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-900/20 border border-red-900/50 rounded-lg flex items-center gap-2 text-red-400 text-xs animate-in fade-in slide-in-from-top-1">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="p-3 bg-emerald-900/20 border border-emerald-900/50 rounded-lg flex items-center gap-2 text-emerald-400 text-xs animate-in fade-in slide-in-from-top-1">
                  <CheckCircle2 size={16} />
                  <span>{success}</span>
                </div>
              )}

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-all border border-slate-700 shadow-lg flex items-center justify-center gap-2"
              >
                {isLoading ? (
                   <span className="flex items-center gap-2">
                     <Server className="animate-pulse" size={16} /> Sending...
                   </span>
                ) : (
                   "Send Reset Link"
                )}
              </button>

              <button 
                type="button"
                onClick={() => resetState('login')}
                className="w-full text-slate-500 hover:text-white text-xs py-2 flex items-center justify-center gap-1 transition-colors"
              >
                <ArrowLeft size={12} /> Back to Login
              </button>
            </form>
          )}

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