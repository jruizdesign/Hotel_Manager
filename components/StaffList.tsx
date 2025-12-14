import React, { useState } from 'react';
import { Staff, AttendanceLog, AttendanceAction, UserRole } from '../types';
import { Briefcase, UserPlus, X, Trash2, CheckCircle, Lock, Clock, Coffee, LogIn, LogOut, History, CalendarClock, Filter, Calendar, User } from 'lucide-react';

interface StaffListProps {
  staff: Staff[];
  attendanceLogs: AttendanceLog[];
  currentUserId?: string;
  userRole: UserRole;
  onAddStaff: (staff: Omit<Staff, 'id'>) => void;
  onDeleteStaff: (id: string) => void;
  onUpdateStatus: (id: string, status: Staff['status']) => void;
  onAttendanceAction: (staffId: string, action: AttendanceAction) => void;
}

const StaffList: React.FC<StaffListProps> = ({ 
  staff, 
  attendanceLogs, 
  currentUserId,
  userRole,
  onAddStaff, 
  onDeleteStaff, 
  onUpdateStatus,
  onAttendanceAction
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'roster' | 'attendance'>('roster');
  
  // Filter States
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterStaffId, setFilterStaffId] = useState<string>('All');
  
  const [newStaff, setNewStaff] = useState<Omit<Staff, 'id'>>({
    name: '',
    role: 'Reception',
    shift: 'Morning',
    status: 'On Duty',
    pin: ''
  });

  const currentUser = staff.find(s => s.id === currentUserId);
  const isManager = userRole === 'Manager' || userRole === 'Superuser';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddStaff(newStaff);
    setIsModalOpen(false);
    setNewStaff({ name: '', role: 'Reception', shift: 'Morning', status: 'On Duty', pin: '' });
  };

  const getFilteredLogs = () => {
    return attendanceLogs.filter(log => {
      // 1. Filter by Date
      let matchesDate = true;
      if (filterDate) {
        // Convert timestamp to YYYY-MM-DD for comparison
        const logDate = new Date(log.timestamp).toLocaleDateString('en-CA'); // en-CA gives YYYY-MM-DD format
        matchesDate = logDate === filterDate;
      }

      // 2. Filter by Staff
      const matchesStaff = filterStaffId === 'All' ? true : log.staffId === filterStaffId;

      return matchesDate && matchesStaff;
    }).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const filteredLogs = getFilteredLogs();

  const getTimeClockUI = () => {
    if (!currentUser) return null;

    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6 animate-in fade-in slide-in-from-top-4">
         <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
               <h3 className="text-lg font-bold text-slate-800 flex items-center justify-center md:justify-start gap-2">
                 <Clock className="text-emerald-600" /> Time Clock
               </h3>
               <p className="text-sm text-slate-500">
                 Current Status: <span className={`font-bold ${
                   currentUser.status === 'On Duty' ? 'text-emerald-600' :
                   currentUser.status === 'Break' ? 'text-amber-500' : 'text-slate-500'
                 }`}>{currentUser.status}</span>
               </p>
               <p className="text-xs text-slate-400 mt-1">{new Date().toLocaleString()}</p>
            </div>

            <div className="flex gap-3">
               {currentUser.status === 'Off Duty' && (
                 <button 
                   onClick={() => onAttendanceAction(currentUser.id, 'CLOCK_IN')}
                   className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-bold shadow-lg shadow-emerald-200 transition-all"
                 >
                   <LogIn size={20} /> Clock In
                 </button>
               )}

               {currentUser.status === 'On Duty' && (
                 <>
                   <button 
                     onClick={() => onAttendanceAction(currentUser.id, 'START_BREAK')}
                     className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-3 rounded-lg font-medium transition-all"
                   >
                     <Coffee size={20} /> Start Break
                   </button>
                   <button 
                     onClick={() => onAttendanceAction(currentUser.id, 'CLOCK_OUT')}
                     className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white px-4 py-3 rounded-lg font-medium transition-all"
                   >
                     <LogOut size={20} /> Clock Out
                   </button>
                 </>
               )}

               {currentUser.status === 'Break' && (
                 <button 
                   onClick={() => onAttendanceAction(currentUser.id, 'END_BREAK')}
                   className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-bold shadow-lg shadow-emerald-200 transition-all"
                 >
                   <Briefcase size={20} /> End Break
                 </button>
               )}
            </div>
         </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Time Clock Section */}
      {getTimeClockUI()}

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-1">
         <div className="flex gap-4">
            <button 
              onClick={() => setActiveTab('roster')}
              className={`pb-2 text-sm font-bold flex items-center gap-2 transition-colors ${activeTab === 'roster' ? 'border-b-2 border-emerald-500 text-emerald-700' : 'text-slate-500 hover:text-slate-700'}`}
            >
               <Briefcase size={16} /> Staff Roster
            </button>
            {isManager && (
              <button 
                onClick={() => setActiveTab('attendance')}
                className={`pb-2 text-sm font-bold flex items-center gap-2 transition-colors ${activeTab === 'attendance' ? 'border-b-2 border-emerald-500 text-emerald-700' : 'text-slate-500 hover:text-slate-700'}`}
              >
                 <History size={16} /> Attendance Logs
              </button>
            )}
         </div>

         {activeTab === 'roster' && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-lg transition-colors text-sm font-medium shadow-sm"
            >
              <UserPlus size={16} /> Add Staff
            </button>
         )}
      </div>

      {activeTab === 'roster' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-left-4">
          {staff.length > 0 ? (
            staff.map(s => (
              <div key={s.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col gap-4 relative group">
                {isManager && (
                  <button 
                    onClick={() => { if(window.confirm('Remove this staff member?')) onDeleteStaff(s.id); }}
                    className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                )}

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
                    {isManager ? (
                       <select 
                         value={s.status}
                         onChange={(e) => onUpdateStatus(s.id, e.target.value as any)}
                         className="bg-transparent font-medium text-slate-700 outline-none w-full cursor-pointer hover:text-emerald-600"
                       >
                         <option value="On Duty">On Duty</option>
                         <option value="Off Duty">Off Duty</option>
                         <option value="Break">Break</option>
                       </select>
                    ) : (
                       <span className={`font-medium ${
                         s.status === 'On Duty' ? 'text-emerald-600' :
                         s.status === 'Break' ? 'text-amber-500' : 'text-slate-500'
                       }`}>
                         {s.status}
                       </span>
                    )}
                  </div>
                </div>

                {isManager && (
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400">
                    <Lock size={12} />
                    <span>PIN: ••••</span>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center bg-white rounded-xl border border-dashed border-slate-300">
              <p className="text-slate-400">No staff members found.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'attendance' && isManager && (
         <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-right-4">
             {/* Header & Filters */}
             <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                   <CalendarClock size={20} className="text-slate-500" /> Attendance History
                </h3>
                
                <div className="flex flex-wrap items-center gap-2">
                   {/* Date Filter */}
                   <div className="relative">
                      <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input 
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="pl-8 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                   </div>

                   {/* Staff Filter */}
                   <div className="relative">
                      <User className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <select
                        value={filterStaffId}
                        onChange={(e) => setFilterStaffId(e.target.value)}
                        className="pl-8 pr-8 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none appearance-none bg-white"
                      >
                         <option value="All">All Staff</option>
                         {staff.map(s => (
                           <option key={s.id} value={s.id}>{s.name}</option>
                         ))}
                      </select>
                   </div>

                   {/* Reset Button */}
                   {(filterDate || filterStaffId !== 'All') && (
                     <button 
                       onClick={() => { setFilterDate(''); setFilterStaffId('All'); }}
                       className="text-xs text-slate-500 hover:text-slate-800 underline px-2"
                     >
                       Reset
                     </button>
                   )}
                </div>
             </div>

             {/* Table */}
             <div className="overflow-x-auto">
               <table className="w-full text-left text-sm text-slate-600">
                 <thead className="bg-slate-50 border-b border-slate-200 text-slate-800 font-semibold uppercase">
                   <tr>
                     <th className="px-6 py-4">Time</th>
                     <th className="px-6 py-4">Staff Member</th>
                     <th className="px-6 py-4">Action</th>
                     <th className="px-6 py-4">Status</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {filteredLogs.map(log => (
                     <tr key={log.id} className="hover:bg-slate-50">
                       <td className="px-6 py-4 font-mono text-xs">
                          {new Date(log.timestamp).toLocaleDateString()} <span className="text-slate-400">|</span> {new Date(log.timestamp).toLocaleTimeString()}
                       </td>
                       <td className="px-6 py-4 font-medium text-slate-800">{log.staffName}</td>
                       <td className="px-6 py-4">{log.action.replace('_', ' ')}</td>
                       <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                             log.action === 'CLOCK_IN' ? 'bg-emerald-100 text-emerald-700' :
                             log.action === 'CLOCK_OUT' ? 'bg-slate-100 text-slate-600' :
                             'bg-amber-100 text-amber-700'
                          }`}>
                             {log.action === 'CLOCK_IN' ? 'Started Shift' : 
                              log.action === 'CLOCK_OUT' ? 'Ended Shift' : 
                              log.action === 'START_BREAK' ? 'On Break' : 'Back to Work'}
                          </span>
                       </td>
                     </tr>
                   ))}
                   {filteredLogs.length === 0 && (
                     <tr><td colSpan={4} className="p-8 text-center text-slate-400">No attendance logs found matching filters.</td></tr>
                   )}
                 </tbody>
               </table>
             </div>
         </div>
      )}

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