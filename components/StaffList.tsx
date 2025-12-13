import React, { useState } from 'react';
import { Staff } from '../types';
import { Briefcase, UserPlus, X, Trash2, CheckCircle, Lock } from 'lucide-react';

interface StaffListProps {
  staff: Staff[];
  onAddStaff: (staff: Omit<Staff, 'id'>) => void;
  onDeleteStaff: (id: string) => void;
  onUpdateStatus: (id: string, status: Staff['status']) => void;
}

const StaffList: React.FC<StaffListProps> = ({ staff, onAddStaff, onDeleteStaff, onUpdateStatus }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStaff, setNewStaff] = useState<Omit<Staff, 'id'>>({
    name: '',
    role: 'Reception',
    shift: 'Morning',
    status: 'On Duty',
    pin: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddStaff(newStaff);
    setIsModalOpen(false);
    setNewStaff({ name: '', role: 'Reception', shift: 'Morning', status: 'On Duty', pin: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Briefcase className="text-emerald-600" /> Staff Management</h2>
          <p className="text-sm text-slate-500">Manage your team, shifts, and roles.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-sm"
        >
          <UserPlus size={18} /> Add Staff
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.length > 0 ? (
          staff.map(s => (
            <div key={s.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col gap-4 relative group">
              <button 
                onClick={() => { if(window.confirm('Remove this staff member?')) onDeleteStaff(s.id); }}
                className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 size={18} />
              </button>

              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl text-white ${
                  s.role === 'Superuser' ? 'bg-purple-600' :
                  s.role === 'Manager' ? 'bg-purple-500' :
                  s.role === 'Maintenance' ? 'bg-amber-500' :
                  s.role === 'Housekeeping' ? 'bg-blue-500' : 'bg-emerald-500'
                }`}>
                  {s.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">{s.name}</h3>
                  <span className="text-sm text-slate-500 font-medium px-2 py-0.5 bg-slate-100 rounded-full">{s.role}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-xs text-slate-400 uppercase font-bold">Shift</p>
                  <p className="font-medium text-slate-700">{s.shift}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-xs text-slate-400 uppercase font-bold">Status</p>
                  <select 
                    value={s.status}
                    onChange={(e) => onUpdateStatus(s.id, e.target.value as any)}
                    className="bg-transparent font-medium text-slate-700 outline-none w-full cursor-pointer hover:text-emerald-600"
                  >
                    <option value="On Duty">On Duty</option>
                    <option value="Off Duty">Off Duty</option>
                    <option value="Break">Break</option>
                  </select>
                </div>
              </div>

              {/* Security Hint */}
              <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400">
                <Lock size={12} />
                <span>PIN: ••••</span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center bg-white rounded-xl border border-dashed border-slate-300">
            <p className="text-slate-400">No staff members found. Add your first employee!</p>
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Hire New Staff</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input 
                  type="text" required
                  placeholder="e.g. Jane Doe"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={newStaff.name}
                  onChange={e => setNewStaff({...newStaff, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={newStaff.role}
                  onChange={e => setNewStaff({...newStaff, role: e.target.value as any})}
                >
                  <option value="Reception">Reception</option>
                  <option value="Housekeeping">Housekeeping</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Manager">Manager</option>
                  <option value="Superuser">Superuser</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Shift</label>
                <input 
                  type="text" required
                  placeholder="e.g. Morning (9AM - 5PM)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={newStaff.shift}
                  onChange={e => setNewStaff({...newStaff, shift: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Login PIN</label>
                <input 
                  type="text" required
                  pattern="\d{4}"
                  maxLength={4}
                  placeholder="4-digit PIN (e.g. 1234)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-mono tracking-widest"
                  value={newStaff.pin}
                  onChange={e => setNewStaff({...newStaff, pin: e.target.value.replace(/\D/g, '')})}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors shadow-sm"
                >
                  Add Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffList;