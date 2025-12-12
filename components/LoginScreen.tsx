import React, { useState } from 'react';
import { CurrentUser, Staff, UserRole } from '../types';
import { Shield, Lock, ChevronRight, User, AlertCircle, Key, Unlock, ShieldCheck } from 'lucide-react';

interface LoginScreenProps {
  staff: Staff[];
  onLogin: (user: CurrentUser) => void;
  onCreateAdmin: (name: string, pin: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ staff, onLogin, onCreateAdmin }) => {
  const [selectedUser, setSelectedUser] = useState<Staff | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Empty State Form
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminPin, setNewAdminPin] = useState('');

  // Recovery State
  const [showRecovery, setShowRecovery] = useState(false);

  // Group staff by role for better UX
  const superusers = staff.filter(s => s.role === 'Superuser');
  const managers = staff.filter(s => s.role === 'Manager');
  const employees = staff.filter(s => s.role !== 'Manager' && s.role !== 'Superuser');

  const handleUserSelect = (user: Staff) => {
    setSelectedUser(user);
    setPin('');
    setError(null);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (pin === selectedUser.pin) {
      // Map Staff Role to App Permission Role
      let appRole: UserRole = 'Staff';
      if (selectedUser.role === 'Superuser') appRole = 'Superuser';
      else if (selectedUser.role === 'Manager') appRole = 'Manager';
      else if (selectedUser.role === 'Maintenance') appRole = 'Contractor';

      // Create initials
      const names = selectedUser.name.split(' ');
      const initials = names.length >= 2 
        ? `${names[0][0]}${names[1][0]}`.toUpperCase() 
        : selectedUser.name.substring(0, 2).toUpperCase();

      onLogin({
        name: selectedUser.name,
        role: appRole,
        avatarInitials: initials
      });
    } else {
      setError('Incorrect PIN. Please try again.');
      setPin('');
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAdminName && newAdminPin.length === 4) {
      onCreateAdmin(newAdminName, newAdminPin);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-10 left-10 w-64 h-64 bg-emerald-500 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-500 rounded-full blur-[120px]"></div>
      </div>

      <div className="text-center mb-8 relative z-10">
        <h1 className="text-5xl font-bold text-white mb-2">
          <span className="text-emerald-400">S</span>taySync
        </h1>
        <p className="text-slate-400">Secure Hotel Management System</p>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl w-full max-w-md relative z-10">
        
        {/* Scenario 1: No Staff Exists (Fresh Install or Cleared Data) */}
        {staff.length === 0 ? (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500/10 text-purple-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/20">
                <ShieldCheck size={32} />
              </div>
              <h2 className="text-xl font-bold text-white">Setup Superuser Account</h2>
              <p className="text-slate-400 text-sm mt-2">Initialize the system by creating the System Administrator (Superuser) profile.</p>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">FULL NAME</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jason Ruiz"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-600 focus:border-purple-500 rounded-lg py-3 px-4 text-white placeholder-slate-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">CREATE MASTER PIN (4 DIGITS)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  maxLength={4}
                  pattern="\d{4}"
                  placeholder="0000"
                  value={newAdminPin}
                  onChange={(e) => setNewAdminPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-800/50 border border-slate-600 focus:border-purple-500 rounded-lg py-3 px-4 text-white placeholder-slate-500 outline-none font-mono tracking-widest transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={!newAdminName || newAdminPin.length < 4}
                className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-purple-900/20 mt-2"
              >
                Create System Admin
              </button>
            </form>
          </div>
        ) : (
          /* Scenario 2: Staff Exists */
          <>
            {!selectedUser ? (
              // View 2.A: Select User
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white mb-4 text-center">Select Your Profile</h2>
                
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  
                   {/* Superusers */}
                   {superusers.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">System Admin</h3>
                      <div className="space-y-2">
                        {superusers.map(user => (
                          <button
                            key={user.id}
                            onClick={() => handleUserSelect(user)}
                            className="w-full flex items-center justify-between bg-purple-900/20 hover:bg-purple-600/20 border border-purple-500/30 hover:border-purple-500 p-3 rounded-lg group transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">
                                {user.name.charAt(0)}
                              </div>
                              <div className="text-left">
                                <p className="font-medium text-white group-hover:text-purple-300">{user.name}</p>
                                <p className="text-xs text-purple-300">Superuser</p>
                              </div>
                            </div>
                            <ChevronRight className="text-purple-400 group-hover:text-white transition-colors" size={18} />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Managers */}
                  {managers.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Management</h3>
                      <div className="space-y-2">
                        {managers.map(user => (
                          <button
                            key={user.id}
                            onClick={() => handleUserSelect(user)}
                            className="w-full flex items-center justify-between bg-slate-800/50 hover:bg-emerald-600/20 border border-slate-700 hover:border-emerald-500/50 p-3 rounded-lg group transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center font-bold">
                                {user.name.charAt(0)}
                              </div>
                              <div className="text-left">
                                <p className="font-medium text-slate-200 group-hover:text-emerald-300">{user.name}</p>
                                <p className="text-xs text-slate-500">{user.role}</p>
                              </div>
                            </div>
                            <ChevronRight className="text-slate-600 group-hover:text-emerald-400 transition-colors" size={18} />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Staff */}
                  {employees.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Staff</h3>
                      <div className="space-y-2">
                        {employees.map(user => (
                          <button
                            key={user.id}
                            onClick={() => handleUserSelect(user)}
                            className="w-full flex items-center justify-between bg-slate-800/50 hover:bg-blue-600/20 border border-slate-700 hover:border-blue-500/50 p-3 rounded-lg group transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-slate-700 text-slate-300 rounded-full flex items-center justify-center font-bold">
                                {user.name.charAt(0)}
                              </div>
                              <div className="text-left">
                                <p className="font-medium text-slate-200 group-hover:text-blue-300">{user.name}</p>
                                <p className="text-xs text-slate-500">{user.role}</p>
                              </div>
                            </div>
                            <ChevronRight className="text-slate-600 group-hover:text-blue-400 transition-colors" size={18} />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Emergency Recovery Button */}
                <div className="pt-4 border-t border-slate-700/50 text-center">
                   <button 
                     onClick={() => setShowRecovery(!showRecovery)}
                     className="text-xs text-slate-500 hover:text-slate-300 flex items-center justify-center gap-1 mx-auto transition-colors"
                   >
                     <Key size={12} /> Lost Access?
                   </button>

                   {showRecovery && (
                     <div className="mt-4 p-4 bg-slate-800/80 rounded-lg border border-slate-600 text-left animate-in fade-in zoom-in duration-200">
                       <h4 className="text-amber-400 font-bold text-sm mb-2 flex items-center gap-2">
                         <Unlock size={14} /> Emergency Recovery
                       </h4>
                       <p className="text-slate-400 text-xs mb-3">
                         Since this application is running locally on your device, you can view the stored PINs below to regain access.
                       </p>
                       <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                         {staff.map(s => (
                           <div key={s.id} className="flex justify-between text-xs py-1 border-b border-slate-700 last:border-0">
                             <span className="text-slate-300">{s.name} <span className="text-[10px] opacity-50">({s.role})</span></span>
                             <span className="font-mono text-emerald-400">{s.pin}</span>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}
                </div>
              </div>
            ) : (
              // View 2.B: Enter PIN
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="text-center">
                  <button 
                    type="button"
                    onClick={() => { setSelectedUser(null); setPin(''); setError(null); }}
                    className="text-slate-400 text-sm hover:text-white mb-4 flex items-center justify-center gap-1 mx-auto"
                  >
                    ← Back to User List
                  </button>
                  
                  <div className="w-20 h-20 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                    <User size={32} />
                  </div>
                  <h2 className="text-xl font-bold text-white">Welcome, {selectedUser.name.split(' ')[0]}</h2>
                  <p className="text-slate-400 text-sm">Enter your 4-digit PIN to continue</p>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      value={pin}
                      onChange={(e) => { setPin(e.target.value); setError(null); }}
                      placeholder="PIN"
                      autoFocus
                      className="w-full bg-slate-800/50 border border-slate-600 focus:border-emerald-500 rounded-lg py-3 pl-10 pr-4 text-white placeholder-slate-500 outline-none text-center font-mono text-xl tracking-[0.5em] transition-all"
                    />
                  </div>

                  {error && (
                    <div className="flex items-center justify-center gap-2 text-red-400 text-sm bg-red-900/20 p-2 rounded-lg border border-red-900/30 animate-in fade-in slide-in-from-top-1">
                      <AlertCircle size={14} />
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={pin.length < 4}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-emerald-900/20 mt-4 flex items-center justify-center gap-2"
                  >
                    <Shield size={18} /> Secure Login
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>

      <div className="mt-8 text-slate-500 text-xs text-center">
        <p>Protected by StaySync Secure Access</p>
        <p className="mt-2 opacity-50">© Jason Ruiz with JRuizDesign</p>
      </div>
    </div>
  );
};

export default LoginScreen;