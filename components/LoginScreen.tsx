import React, { useState } from 'react';
import ReCaptcha from './reCaptcha';
import { CurrentUser, Staff, UserRole } from '../types';
import { 
  Shield, 
  Lock, 
  ChevronRight, 
  User, 
  AlertCircle, 
  Key, 
  Unlock, 
  ShieldCheck, 
  LogOut, 
  Mail, 
  AtSign, 
  Loader2, 
  ArrowLeft,
  Fingerprint,
  Info,
  CheckCircle2,
  Building2
} from 'lucide-react';
import { loginTerminal, logoutTerminal } from '../services/firebase';
import Recaptcha from './reCaptcha';
interface LoginScreenProps {
  staff: Staff[];
  onLogin: (user: CurrentUser) => void;
  onCreateAdmin: (name: string, pin: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ staff, onLogin, onCreateAdmin }) => {
  // Navigation & UI States
  const [authMethod, setAuthMethod] = useState<'pin' | 'email'>('pin');
  const [selectedUser, setSelectedUser] = useState<Staff | null>(null);
  const [showRecovery, setShowRecovery] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Core Login States (As requested)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<{ text: string, type: 'error' | 'success' | 'info' } | null>(null);
  
  // PIN State
  const [pin, setPin] = useState('');

  // Setup State
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminPin, setNewAdminPin] = useState('');

  // Staff Grouping
  const superusers = staff.filter(s => s.role === 'Superuser');
  const managers = staff.filter(s => s.role === 'Manager');
  const employees = staff.filter(s => s.role !== 'Manager' && s.role !== 'Superuser');

  const handleUserSelect = (user: Staff) => {
    setSelectedUser(user);
    setPin('');
    setMessage(null);
  };

  const attemptLogin = (user: Staff) => {
    let appRole: UserRole = 'Staff';
    if (user.role === 'Superuser') appRole = 'Superuser';
    else if (user.role === 'Manager') appRole = 'Manager';
    else if (user.role === 'Maintenance') appRole = 'Contractor';

    const names = user.name.split(' ');
    const initials = names.length >= 2 
      ? `${names[0][0]}${names[1][0]}`.toUpperCase() 
      : user.name.substring(0, 2).toUpperCase();

    onLogin({
      id: user.id,
      name: user.name,
      role: appRole,
      avatarInitials: initials
    });
  };

  const handlePinLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (pin === selectedUser.pin) {
      attemptLogin(selectedUser);
    } else {
      setMessage({ text: 'Access Denied: Invalid PIN code.', type: 'error' });
      setPin('');
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsLoading(true);

    try {
      const result = await loginTerminal(email, password);
      const authenticatedEmail = result.user.email;

      if (!authenticatedEmail) throw new Error("Authentication failed.");

      const matchedStaff = staff.find(s => s.email?.toLowerCase() === authenticatedEmail.toLowerCase());

      if (matchedStaff) {
        attemptLogin(matchedStaff);
      } else {
        onLogin({
            id: 'cloud-admin',
            name: result.user.displayName || authenticatedEmail.split('@')[0],
            role: 'Superuser',
            avatarInitials: 'AD'
        });
      }
    } catch (err: any) {
      console.error("Login failed", err);
      if (err.code === 'auth/invalid-credential') {
        setMessage({ text: "Invalid credentials. Please verify your email and password.", type: 'error' });
      } else {
        setMessage({ text: "Authentication failed. Check your connection or cloud config.", type: 'error' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAdminName && newAdminPin.length === 4) {
      onCreateAdmin(newAdminName, newAdminPin);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-emerald-500/30">
      
      {/* Cinematic Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none"></div>

      {/* Brand Header */}
      <div className="text-center mb-10 relative z-20 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="flex items-center justify-center gap-3 mb-4">
           <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)]">
              <Building2 size={32} className="text-emerald-400" />
           </div>
           <h1 className="text-4xl font-black text-white tracking-tighter">
             Stay<span className="text-emerald-500">Sync</span>
           </h1>
        </div>
        <p className="text-slate-400 font-medium tracking-wide uppercase text-[10px]">Unified Terminal Access Port</p>
      </div>

      <div className="w-full max-w-md relative z-20">
        <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl overflow-hidden relative">
          
          {/* ReCaptcha Info Icon */}
          <div className="absolute top-4 right-4 text-slate-600 hover:text-emerald-400 transition-colors cursor-help" title="Protected by Firebase App Check & ReCaptcha">
            <ShieldCheck size={18} />
          </div>

          {staff.length === 0 ? (
            /* SCENARIO: INITIAL SYSTEM SETUP */
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">Initialize System</h2>
                <p className="text-slate-400 text-sm">Create the Master Superuser profile to begin.</p>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Full Identity</label>
                  <input
                    type="text" required placeholder="Full Name"
                    value={newAdminName} onChange={(e) => setNewAdminName(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 rounded-2xl py-3.5 px-5 text-white placeholder-slate-600 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Master Access PIN</label>
                  <input
                    type="text" inputMode="numeric" required maxLength={4} pattern="\d{4}" placeholder="4-Digit Code"
                    value={newAdminPin} onChange={(e) => setNewAdminPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-950/50 border border-slate-800 focus:border-emerald-500/50 rounded-2xl py-3.5 px-5 text-white placeholder-slate-600 outline-none font-mono tracking-[1em] text-center transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!newAdminName || newAdminPin.length < 4}
                  className="w-full bg-white text-slate-950 hover:bg-emerald-400 font-bold py-4 rounded-2xl transition-all shadow-xl shadow-white/5 mt-4"
                >
                  Create Master Admin
                </button>
              </form>
            </div>
          ) : (
            /* SCENARIO: STANDARD LOGIN */
            <>
              {authMethod === 'email' ? (
                 /* CLOUD EMAIL LOGIN */
                 <form onSubmit={handleEmailLogin} className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                    <div className="text-center">

                      <button 
                        type="button"
                        onClick={() => { setAuthMethod('pin'); setMessage(null); }}
                        className="text-slate-500 text-xs hover:text-white mb-6 flex items-center justify-center gap-2 mx-auto transition-colors"
                      >
                        <ArrowLeft size={14} /> Back to Terminal Access
                      </button>
                      <h2 className="text-2xl font-bold text-white tracking-tight">Cloud Portal</h2>
                      <p className="text-slate-500 text-sm mt-1">Authorized Administrative Login</p>
                    </div>

                    <div className="space-y-5">
                       <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Work Email</label>
                          <div className="relative">
                            <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                            <input 
                              type="email" required autoFocus value={email} onChange={e => setEmail(e.target.value)}
                              className="w-full bg-slate-950/50 border border-slate-800 focus:border-emerald-500/50 rounded-2xl py-3.5 pl-11 pr-4 text-white placeholder-slate-600 outline-none transition-all"
                              placeholder="admin@staysync.com"
                            />
                          </div>
                       </div>
                       
                       <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
                          <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                            <input 
                              type="password" required value={password} onChange={e => setPassword(e.target.value)}
                              className="w-full bg-slate-950/50 border border-slate-800 focus:border-emerald-500/50 rounded-2xl py-3.5 pl-11 pr-4 text-white placeholder-slate-600 outline-none transition-all"
                              placeholder="••••••••"
                            />
                          </div>
                       </div>

                       <div className="flex justify-center">
                          <ReCaptcha 
                            sitekey="6LeCfDAsAAAAAInjL2In0SF5ihzPpktrqXLpo59_" 
                            callback={(token: string) => console.log("Captcha Token:", token)} 
                          />
                       </div>

                       {message && (
                          <div className={`flex items-center gap-3 p-4 rounded-2xl border text-sm animate-in fade-in slide-in-from-top-2 ${
                            message.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          }`}>
                            <AlertCircle size={18} className="shrink-0" />
                            {message.text}
                          </div>
                       )}

                       <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-wait text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-3"
                        >
                          {isLoading ? <Loader2 className="animate-spin" size={20} /> : <><Shield size={20} /> Sign In</>}
                        </button>
                    </div>
                 </form>
              ) : !selectedUser ? (
                /* PROFILE SELECTOR (TERMINAL MODE) */
                <div className="space-y-6 animate-in fade-in slide-in-from-left-8 duration-500">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-white tracking-tight">Staff Terminal</h2>
                    <p className="text-slate-500 text-sm mt-1">Identify your profile to unlock</p>
                  </div>
                  
                  <div className="space-y-3 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
                     {/* System Admin Group */}
                     {superusers.length > 0 && (
                      <div className="mb-4">
                        <p className="text-[10px] font-bold text-emerald-500/60 uppercase tracking-widest mb-3 ml-1">System Management</p>
                        <div className="space-y-2">
                          {superusers.map(user => (
                            <button
                              key={user.id}
                              onClick={() => handleUserSelect(user)}
                              className="w-full flex items-center justify-between bg-white/5 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/30 p-4 rounded-2xl group transition-all"
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center font-bold border border-emerald-500/20">
                                  {user.name.charAt(0)}
                                </div>
                                <div className="text-left">
                                  <p className="font-bold text-white group-hover:text-emerald-300 transition-colors">{user.name}</p>
                                  <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Superuser</p>
                                </div>
                              </div>
                              <ChevronRight className="text-slate-700 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" size={20} />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* General Staff Group */}
                    <div className="mt-4">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">Hotel Staff</p>
                      <div className="grid grid-cols-1 gap-2">
                        {[...managers, ...employees].map(user => (
                          <button
                            key={user.id}
                            onClick={() => handleUserSelect(user)}
                            className="w-full flex items-center justify-between bg-white/5 hover:bg-blue-500/10 border border-white/5 hover:border-blue-500/20 p-3.5 rounded-2xl group transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-slate-800 text-slate-400 rounded-xl flex items-center justify-center font-bold border border-white/5">
                                {user.name.charAt(0)}
                              </div>
                              <div className="text-left">
                                <p className="font-bold text-slate-200 group-hover:text-white transition-colors">{user.name}</p>
                                <p className="text-[10px] text-slate-500">{user.role}</p>
                              </div>
                            </div>
                            <ChevronRight className="text-slate-800 group-hover:text-blue-400 transition-all" size={16} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Footer Access Actions */}
                  <div className="pt-6 border-t border-white/5 text-center space-y-4">
                     <button 
                       onClick={() => { setAuthMethod('email'); setMessage(null); }}
                       className="w-full text-xs text-slate-400 hover:text-white hover:bg-white/5 py-3 rounded-2xl transition-all flex items-center justify-center gap-2 border border-transparent hover:border-white/10"
                     >
                       <Mail size={16} className="text-emerald-400" /> Admin Cloud Portal
                     </button>

                     <button 
                       onClick={() => setShowRecovery(!showRecovery)}
                       className="text-[10px] font-bold text-slate-600 hover:text-slate-400 uppercase tracking-widest transition-colors"
                     >
                       Recovery Mode
                     </button>

                     {showRecovery && (
                       <div className="mt-4 p-5 bg-slate-950/80 rounded-3xl border border-white/5 text-left animate-in fade-in zoom-in-95 duration-300 shadow-2xl">
                         <div className="flex items-center gap-2 mb-3 text-amber-500">
                            <Unlock size={14} />
                            <h4 className="font-bold text-xs uppercase tracking-wider">Access Recovery</h4>
                         </div>
                         <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                           {staff.map(s => (
                             <div key={s.id} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                               <div>
                                  <p className="text-xs font-bold text-slate-200">{s.name}</p>
                                  <p className="text-[9px] text-slate-500">{s.role}</p>
                               </div>
                               <span className="font-mono text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">{s.pin}</span>
                             </div>
                           ))}
                         </div>
                       </div>
                     )}
                  </div>
                </div>
              ) : (
                /* PIN ENTRY VIEW */
                <form onSubmit={handlePinLogin} className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
                  <div className="text-center">
                    <button 
                      type="button"
                      onClick={() => { setSelectedUser(null); setPin(''); setMessage(null); }}
                      className="text-slate-500 text-xs hover:text-white mb-8 flex items-center justify-center gap-2 mx-auto transition-colors"
                    >
                      <ArrowLeft size={14} /> Back to Identity List
                    </button>
                    
                    <div className="w-24 h-24 bg-emerald-500/10 text-emerald-400 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-emerald-500/20 shadow-[0_0_50px_-10px_rgba(16,185,129,0.2)]">
                      <Fingerprint size={48} />
                    </div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Hello, {selectedUser.name.split(' ')[0]}</h2>
                    <p className="text-slate-500 text-sm mt-1">Unlock Terminal Access</p>
                  </div>

                  <div className="space-y-6">
                    <div className="relative">
                      <input
                        type="password" inputMode="numeric" maxLength={4} value={pin} autoFocus
                        onChange={(e) => { setPin(e.target.value.replace(/\D/g, '')); setMessage(null); }}
                        placeholder="••••"
                        className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-3xl py-6 text-white placeholder-slate-800 outline-none text-center font-mono text-4xl tracking-[0.5em] transition-all shadow-inner"
                      />
                    </div>

                    {message && (
                      <div className="flex items-center justify-center gap-2 text-red-400 text-xs bg-red-500/10 p-3 rounded-2xl border border-red-500/20 animate-in fade-in slide-in-from-top-1">
                        <AlertCircle size={14} />
                        {message.text}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={pin.length < 4}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-emerald-900/40 flex items-center justify-center gap-3"
                    >
                      <ShieldCheck size={20} /> Authorize Access
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>

      {/* Footer Branding */}
      <div className="mt-12 text-slate-600 text-[10px] text-center font-bold uppercase tracking-[0.2em] relative z-20">
        <p className="flex items-center justify-center gap-2">
          <Shield size={10} className="text-slate-700" /> StaySync Security Framework v4.2
        </p>
        <p className="mt-2 opacity-40">Architected by Jason Ruiz • Global Terminal Auth</p>
      </div>
    </div>
  );
};

export default LoginScreen;