import React from 'react';
import { ViewState, UserRole } from '../types';
import { LayoutDashboard, BedDouble, Users, Wrench, Briefcase, DollarSign, LogOut, Settings } from 'lucide-react';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  userRole: UserRole;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, userRole, onLogout }) => {
  // Define all possible items
  const allNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Manager', 'Staff'] },
    { id: 'rooms', label: 'Rooms', icon: BedDouble, roles: ['Manager', 'Staff'] },
    { id: 'guests', label: 'Guests', icon: Users, roles: ['Manager', 'Staff'] },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench, roles: ['Manager', 'Staff', 'Contractor'] },
    { id: 'staff', label: 'Staff', icon: Briefcase, roles: ['Manager', 'Staff'] },
    { id: 'accounting', label: 'Accounting', icon: DollarSign, roles: ['Manager'] },
  ];

  // Filter based on role
  const navItems = allNavItems.filter(item => item.roles.includes(userRole));

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col h-full fixed left-0 top-0 shadow-xl z-10">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-emerald-400">
          <span className="text-3xl">S</span>taySync
        </h1>
        <div className="flex items-center gap-2 mt-2">
          <span className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded border ${
            userRole === 'Manager' ? 'border-emerald-500 text-emerald-400' :
            userRole === 'Staff' ? 'border-blue-500 text-blue-400' :
            'border-amber-500 text-amber-400'
          }`}>
            {userRole}
          </span>
          <p className="text-xs text-slate-500">v1.2</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id as ViewState)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-2">
         {userRole === 'Manager' && (
          <button 
            onClick={() => setView('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              currentView === 'settings' 
                ? 'bg-emerald-600/20 text-emerald-400' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Settings size={20} />
            <span className="font-medium">Settings</span>
          </button>
        )}
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-900/20 hover:text-red-300 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;