import React, { useState, useEffect } from 'react';
import { ViewState, UserRole } from '../types';
import { StorageService } from '../services/storage';
import { LayoutDashboard, BedDouble, Users, Wrench, Briefcase, DollarSign, LogOut, Settings, FileText, Lightbulb, ClipboardCheck, Lock, UserCheck, X } from 'lucide-react';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  userRole: UserRole;
  onLogout: () => void;
  onLock: () => void;
  isMobileNavOpen: boolean;
  setMobileNavOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  setView, 
  userRole, 
  onLogout, 
  onLock, 
  isMobileNavOpen, 
  setMobileNavOpen 
}) => {
  const [hotelName, setHotelName] = useState('StaySync');

  useEffect(() => {
    const fetchHotelName = async () => {
      const settings = await StorageService.getSettings();
      if (settings.hotelName) {
        setHotelName(settings.hotelName);
      }
    };
    fetchHotelName();
  }, []);

  const allNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Superuser', 'Manager', 'Staff'] },
    { id: 'check-in-out', label: 'Check In/Out', icon: UserCheck, roles: ['Superuser', 'Manager', 'Staff'] },
    { id: 'reports', label: 'Daily Report', icon: ClipboardCheck, roles: ['Superuser', 'Manager', 'Staff'] },
    { id: 'rooms', label: 'Rooms', icon: BedDouble, roles: ['Superuser', 'Manager', 'Staff'] },
    { id: 'guests', label: 'Guests', icon: Users, roles: ['Superuser', 'Manager', 'Staff'] },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench, roles: ['Superuser', 'Manager', 'Staff', 'Contractor'] },
    { id: 'documents', label: 'Documents', icon: FileText, roles: ['Superuser', 'Manager', 'Staff'] },
    { id: 'features', label: 'Requests', icon: Lightbulb, roles: ['Superuser', 'Manager', 'Staff'] },
    { id: 'staff', label: 'Staff', icon: Briefcase, roles: ['Superuser', 'Manager', 'Staff'] },
    { id: 'accounting', label: 'Accounting', icon: DollarSign, roles: ['Superuser', 'Manager'] },
  ];

  const navItems = allNavItems.filter(item => item.roles.includes(userRole));

  const handleItemClick = (view: ViewState) => {
    setView(view);
    setMobileNavOpen(false);
  };

  return (
    <>
      {isMobileNavOpen && <div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={() => setMobileNavOpen(false)}></div>}
      <div className={`w-full max-w-[280px] bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 shadow-xl z-40 transform transition-transform ${isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:w-64`}>
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-emerald-400">{hotelName}</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded border ${userRole === 'Superuser' ? 'border-purple-500 text-purple-400' : 'border-emerald-500 text-emerald-400'}`}>
                {userRole}
              </span>
            </div>
          </div>
          <button onClick={() => setMobileNavOpen(false)} className="md:hidden"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <nav className="p-4 space-y-2">
            {navItems.map((item) => (
              <button key={item.id} onClick={() => handleItemClick(item.id as ViewState)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${currentView === item.id ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                <item.icon size={20} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 space-y-2">
           {(userRole === 'Manager' || userRole === 'Superuser') && (
            <button onClick={() => handleItemClick('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${currentView === 'settings' ? 'bg-emerald-600/20 text-emerald-400' : 'text-slate-400 hover:bg-slate-800'}`}>
              <Settings size={20} />
              <span>Settings</span>
            </button>
          )}
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800 rounded-lg">
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
          {userRole === 'Superuser' && (
            <button onClick={onLock} className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-900/20 rounded-lg border border-red-900/30">
              <Lock size={20} />
              <span>Lock System</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
