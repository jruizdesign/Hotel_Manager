import React, { useState, useEffect } from 'react';
import { signInTerminal, resetPassword, getAuthInstance, onAuthChanged } from '../services/firebase'; 
import { StorageService } from '../services/storage';
import { User, Shield, Key, Mail, ArrowLeft, Hotel, Fingerprint, Loader2 } from 'lucide-react';
import { AppSettings } from '../types';

interface TerminalAuthProps {
  onAuthenticated: (user: any) => void; 
}

const TerminalAuth: React.FC<TerminalAuthProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState('login'); // 'login', 'forgot', 'pin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState(Array(4).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCloudMode, setIsCloudMode] = useState(false);
  const [isPwa, setIsPwa] = useState(false);
  const [hotelName, setHotelName] = useState('StaySync');

  useEffect(() => {
    const checkPwa = () => {
      return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone || document.referrer.includes('android-app://');
    };
    setIsPwa(checkPwa());

    const fetchSettings = async () => {
      const settings: AppSettings = await StorageService.getSettings();
      setIsCloudMode(settings.dataSource === 'Cloud');
      if(settings.hotelName) {
        setHotelName(settings.hotelName);
      }
    };
    fetchSettings();
    
    // Listen for auth state changes from Firebase
    const auth = getAuthInstance();
    if(auth) {
      const unsubscribe = onAuthChanged(auth, (user) => {
        if (user) {
          onAuthenticated(user);
        }
      });
      return () => unsubscribe(); // Cleanup subscription
    }
  }, [onAuthenticated]);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const user = await signInTerminal(email, password);
      setSuccess("Login successful! Redirecting...");
      setTimeout(() => onAuthenticated(user), 1000);
    } catch (err: any) {
      console.error(err);
      if (err.code) {
        switch (err.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            setError("Invalid email or password.");
            break;
          case 'auth/too-many-requests':
            setError("Too many attempts. Please try again later.");
            break;
          default:
            setError("An unexpected error occurred.");
        }
      } else {
        setError(err.message);
      }
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      await resetPassword(email);
      setSuccess("Password reset email sent! Check your inbox.");
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setError("No account found with this email address.");
      } else {
        setError("Failed to send reset email. Please try again.");
      }
    }
    setIsLoading(false);
  };
  
  const handlePinLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // PIN login logic here
    console.log("PIN submitted:", pin.join(''));
    setError('PIN login is not yet implemented.');
  }

  const resetState = (newMode: 'login' | 'forgot' | 'pin') => {
    setMode(newMode);
    setEmail('');
    setPassword('');
    setPin(Array(4).fill(''));
    setError(null);
    setSuccess(null);
    setIsLoading(false);
  };

  const PinInput = () => {
    const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
      const { value } = e.target;
      if (/^[0-9]$/.test(value) || value === '') {
        const newPin = [...pin];
        newPin[index] = value;
        setPin(newPin);
        
        // Focus next input
        if (value !== '' && index < 3) {
          const nextSibling = document.getElementById(`pin-${index + 1}`);
          if (nextSibling) {
            nextSibling.focus();
          }
        }
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
      if (e.key === 'Backspace' && pin[index] === '' && index > 0) {
        const prevSibling = document.getElementById(`pin-${index - 1}`);
        if (prevSibling) {
          prevSibling.focus();
        }
      }
    }

    return (
      <div className="flex justify-center gap-3 mb-4">
        {pin.map((digit, index) => (
          <input
            key={index}
            id={`pin-${index}`}
            type="password"
            maxLength={1}
            value={digit}
            onChange={(e) => handlePinChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className="w-14 h-16 bg-slate-800/70 border-2 border-slate-700 rounded-lg text-center text-3xl font-bold text-white focus:border-emerald-500 focus:ring-emerald-500 focus:outline-none transition"
            autoComplete="one-time-code"
          />
        ))}
      </div>
    );
  };


  return (
    <div className="bg-slate-900 min-h-screen flex items-center justify-center p-4 selection:bg-emerald-500/30">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-emerald-400 flex items-center justify-center gap-3">
             <Hotel size={48} /> {hotelName}
          </h1>
          <p className="text-slate-400 mt-2">Hotel Management Terminal</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl shadow-2xl shadow-slate-950/50 backdrop-blur-sm">
          <div className="p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white">
                {mode === 'login' && 'Terminal Access'}
                {mode === 'forgot' && 'Reset Password'}
                {mode === 'pin' && 'Enter PIN'}
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                {mode === 'login' && 'Sign in to continue'}
                {mode === 'forgot' && 'Enter your email to get a reset link'}
                {mode === 'pin' && 'Use your 4-digit staff PIN'}
              </p>
            </div>

            {/* Login Form */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="email" 
                    placeholder="Email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-slate-800/70 border-2 border-slate-700 rounded-lg pl-10 pr-3 py-2.5 text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-0 outline-none transition"
                  />
                </div>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="password" 
                    placeholder="Password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-slate-800/70 border-2 border-slate-700 rounded-lg pl-10 pr-3 py-2.5 text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-0 outline-none transition"
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-400 bg-red-500/10 border border-red-400/20 rounded-md p-2 text-center">{error}</p>
                )}
                {success && (
                  <p className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-400/20 rounded-md p-2 text-center">{success}</p>
                )}

                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 disabled:bg-slate-600"
                >
                  {isLoading ? <><Loader2 size={20} className="animate-spin" /> Authenticating...</> : 'Sign In'}
                </button>

                <div className="text-center">
                  <button 
                    type="button"
                    onClick={() => resetState('forgot')}
                    className="text-xs text-slate-400 hover:text-emerald-400 transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
                
                {/* Conditionally render PIN login button */}
                {!isPwa && (
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <span className="h-px w-full bg-slate-700"></span>
                    <span className="text-slate-500 text-xs uppercase">OR</span>
                    <span className="h-px w-full bg-slate-700"></span>
                  </div>
                )}
                
                {!isPwa && (
                   <button 
                    type="button"
                    onClick={() => resetState('pin')}
                    className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Fingerprint size={18} /> Use PIN
                  </button>
                )}
              </form>
            )}

            {/* Forgot Password Form */}
            {mode === 'forgot' && (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="email" 
                    placeholder="Email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-slate-800/70 border-2 border-slate-700 rounded-lg pl-10 pr-3 py-2.5 text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-0 outline-none transition"
                  />
                </div>
                
                {error && (
                  <p className="text-xs text-red-400 bg-red-500/10 border border-red-400/20 rounded-md p-2">{error}</p>
                )}
                {success && (
                  <p className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-400/20 rounded-md p-2">{success}</p>
                )}

                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 disabled:bg-slate-600"
                >
                  {isLoading ? <><Loader2 size={20} className="animate-spin" /> Sending...</> : 'Send Reset Link'}
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
            
            {/* PIN Login Form */}
            {mode === 'pin' && (
                <form onSubmit={handlePinLogin} className="space-y-4">
                  <PinInput />
                  
                  {error && (
                    <p className="text-xs text-red-400 bg-red-500/10 border border-red-400/20 rounded-md p-2 text-center">{error}</p>
                  )}
                  {success && (
                    <p className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-400/20 rounded-md p-2 text-center">{success}</p>
                  )}

                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 disabled:bg-slate-600"
                  >
                    {isLoading ? <><Loader2 size={20} className="animate-spin" /> Verifying...</> : 'Login with PIN'}
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
               <div className="text-slate-600 text-[10px] text-center font-bold uppercase tracking-[0.2em]">
                <p className="flex items-center justify-center gap-2">
                  <Shield size={10} className="text-slate-700" /> StaySync Security Framework v4.2
                </p>
                <p className="mt-2 opacity-40">Architected by Jason Ruiz • Global Terminal Auth</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
    };
    
    export default TerminalAuth;