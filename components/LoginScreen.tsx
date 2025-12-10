import React from 'react';
import { UserRole } from '../types';
import { Shield, Users, Wrench, Briefcase } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (role: UserRole) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-white mb-4">
          <span className="text-emerald-400">S</span>taySync
        </h1>
        <p className="text-slate-400 text-lg">Select your role to access the system</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
        {/* Manager Card */}
        <button
          onClick={() => onLogin('Manager')}
          className="bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500 p-8 rounded-2xl transition-all duration-200 group text-left"
        >
          <div className="w-14 h-14 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-emerald-500 group-hover:text-white text-emerald-500 transition-colors">
            <Shield size={32} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Management</h3>
          <p className="text-slate-400 text-sm">
            Full access to all modules including Accounting, Staff Management, and Room configurations.
          </p>
        </button>

        {/* Staff Card */}
        <button
          onClick={() => onLogin('Staff')}
          className="bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-blue-500 p-8 rounded-2xl transition-all duration-200 group text-left"
        >
          <div className="w-14 h-14 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-500 group-hover:text-white text-blue-500 transition-colors">
            <Users size={32} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Staff</h3>
          <p className="text-slate-400 text-sm">
            Operational access to Guest services, Room status updates, and Staff rosters.
          </p>
        </button>

        {/* Contractor Card */}
        <button
          onClick={() => onLogin('Contractor')}
          className="bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-amber-500 p-8 rounded-2xl transition-all duration-200 group text-left"
        >
          <div className="w-14 h-14 bg-amber-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-amber-500 group-hover:text-white text-amber-500 transition-colors">
            <Wrench size={32} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Contractor</h3>
          <p className="text-slate-400 text-sm">
            Limited access to Maintenance tickets and work orders only.
          </p>
        </button>
      </div>
    </div>
  );
};

export default LoginScreen;