import React, { useState } from 'react';
import { MaintenanceTicket, UserRole, Room } from '../types';
import { Wrench, Plus, CheckCircle2, AlertTriangle, Clock, X, DollarSign, Calendar } from 'lucide-react';

interface MaintenancePanelProps {
  tickets: MaintenanceTicket[];
  rooms: Room[];
  userRole: UserRole;
  onAddTicket: (ticket: Omit<MaintenanceTicket, 'id' | 'status' | 'date'>) => void;
  onResolveTicket: (id: string, cost: number, notes: string) => void;
}

const MaintenancePanel: React.FC<MaintenancePanelProps> = ({ tickets, rooms, userRole, onAddTicket, onResolveTicket }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [resolveTicketId, setResolveTicketId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'Active' | 'Resolved'>('Active');

  // Add Form State
  const [newTicket, setNewTicket] = useState({
    roomNumber: '',
    description: '',
    priority: 'Medium' as 'Low' | 'Medium' | 'High',
    reportedBy: userRole === 'Contractor' ? 'Contractor' : 'Staff' // Default
  });

  // Resolve Form State
  const [resolveCost, setResolveCost] = useState('');
  const [resolveNote, setResolveNote] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddTicket({
      roomNumber: newTicket.roomNumber,
      description: newTicket.description,
      priority: newTicket.priority,
      reportedBy: newTicket.reportedBy
    });
    setIsAddModalOpen(false);
    setNewTicket({ roomNumber: '', description: '', priority: 'Medium', reportedBy: 'Staff' });
  };

  const handleResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (resolveTicketId) {
      onResolveTicket(resolveTicketId, Number(resolveCost), resolveNote);
      setResolveTicketId(null);
      setResolveCost('');
      setResolveNote('');
    }
  };

  const displayedTickets = tickets.filter(t => 
    filter === 'Active' ? t.status !== 'Resolved' : t.status === 'Resolved'
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const canResolve = ['Superuser', 'Manager', 'Contractor'].includes(userRole);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Wrench className="text-emerald-600" /> Maintenance Center</h2>
          <p className="text-sm text-slate-500">Track repairs, manage costs, and schedule fixes.</p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-slate-200 p-1 rounded-lg">
             <button 
               onClick={() => setFilter('Active')}
               className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${filter === 'Active' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
             >
               Active
             </button>
             <button 
               onClick={() => setFilter('Resolved')}
               className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${filter === 'Resolved' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
             >
               History
             </button>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-sm"
          >
            <Plus size={18} /> Report Issue
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {displayedTickets.length === 0 ? (
           <div className="p-12 text-center text-slate-400">
             <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
               <CheckCircle2 size={32} className="text-slate-300" />
             </div>
             <p>No {filter.toLowerCase()} tickets found.</p>
           </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-800 font-semibold uppercase">
                <tr>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Room / Area</th>
                  <th className="px-6 py-4">Issue</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Reported</th>
                  {filter === 'Resolved' && <th className="px-6 py-4 text-right">Cost</th>}
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedTickets.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        t.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                        t.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold">
                       {t.roomNumber}
                    </td>
                    <td className="px-6 py-4">{t.description}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {t.priority === 'High' && <AlertTriangle size={14} className="text-red-500" />}
                        <span className={`${t.priority === 'High' ? 'text-red-600 font-bold' : ''}`}>
                          {t.priority}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col text-xs">
                        <span className="font-medium text-slate-700">{t.date}</span>
                        <span>by {t.reportedBy}</span>
                      </div>
                    </td>
                    {filter === 'Resolved' && (
                       <td className="px-6 py-4 text-right font-mono text-emerald-600 font-bold">
                         ${t.cost || 0}
                       </td>
                    )}
                    <td className="px-6 py-4 text-right">
                       {t.status !== 'Resolved' && canResolve && (
                         <button 
                           onClick={() => setResolveTicketId(t.id)}
                           className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
                         >
                           Resolve & Bill
                         </button>
                       )}
                       {t.status !== 'Resolved' && !canResolve && (
                         <span className="text-xs text-slate-400 italic">Reported</span>
                       )}
                       {t.status === 'Resolved' && (
                          <span className="text-xs text-emerald-600 flex items-center justify-end gap-1">
                            <CheckCircle2 size={12} /> Complete
                          </span>
                       )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD TICKET MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Report Maintenance Issue</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Room / Area</label>
                <input 
                  type="text" required
                  list="roomsList"
                  placeholder="e.g. 101 or Lobby"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={newTicket.roomNumber}
                  onChange={e => setNewTicket({...newTicket, roomNumber: e.target.value})}
                />
                <datalist id="roomsList">
                  {rooms.map(r => <option key={r.id} value={r.number} />)}
                  <option value="Lobby" />
                  <option value="Pool" />
                  <option value="Kitchen" />
                  <option value="Parking" />
                </datalist>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description of Issue</label>
                <textarea 
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                  value={newTicket.description}
                  onChange={e => setNewTicket({...newTicket, description: e.target.value})}
                  placeholder="Describe what needs fixing..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                <div className="flex gap-2">
                  {(['Low', 'Medium', 'High'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setNewTicket({...newTicket, priority: p})}
                      className={`flex-1 py-2 text-sm rounded-lg border font-medium transition-all ${
                        newTicket.priority === p 
                          ? p === 'High' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-slate-800 text-white border-slate-800'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                 <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-bold shadow-sm">
                   Submit Ticket
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESOLVE & COST MODAL */}
      {resolveTicketId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
             <div className="bg-emerald-600 px-6 py-4 flex justify-between items-center text-white">
               <div>
                  <h3 className="text-lg font-bold">Resolve Ticket</h3>
                  <p className="text-emerald-100 text-xs">Record cost and close issue.</p>
               </div>
               <button onClick={() => setResolveTicketId(null)} className="text-emerald-100 hover:text-white">
                 <X size={20} />
               </button>
             </div>

             <form onSubmit={handleResolveSubmit} className="p-6 space-y-4">
               <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm text-slate-600 mb-4">
                 Closing Ticket ID: <span className="font-mono font-bold">{resolveTicketId}</span>
               </div>

               <div>
                 <label className="block text-sm font-bold text-slate-700 mb-1">Total Repair Cost ($)</label>
                 <div className="relative">
                   <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                   <input 
                     type="number" 
                     min="0" step="0.01" required
                     placeholder="0.00"
                     className="w-full pl-9 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-lg font-bold text-slate-800"
                     value={resolveCost}
                     onChange={e => setResolveCost(e.target.value)}
                   />
                 </div>
                 <p className="text-xs text-slate-500 mt-1">This will be added to Expenses in Accounting.</p>
               </div>

               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Resolution Notes</label>
                 <input 
                   type="text" 
                   required
                   placeholder="e.g. Replaced fan motor"
                   className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                   value={resolveNote}
                   onChange={e => setResolveNote(e.target.value)}
                 />
               </div>

               <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-bold shadow-sm mt-2">
                 Confirm Resolution & Cost
               </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenancePanel;