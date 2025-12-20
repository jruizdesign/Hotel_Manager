import React, { useState } from 'react';
import { FeatureRequest, UserRole } from '../types';
import { Lightbulb, Plus, X, CheckCircle2, Clock, Ban, Trash2, Edit3 } from 'lucide-react';

interface FeatureRequestPanelProps {
  requests: FeatureRequest[];
  onAddRequest: (req: Omit<FeatureRequest, 'id' | 'status' | 'submittedDate'>) => void;
  onUpdateRequest: (req: FeatureRequest) => void;
  onDeleteRequest: (id: string) => void;
  userRole: UserRole;
  userName: string;
}

const FeatureRequestPanel: React.FC<FeatureRequestPanelProps> = ({ 
  requests, 
  onAddRequest, 
  onUpdateRequest, 
  onDeleteRequest,
  userRole,
  userName
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<'All' | 'Pending' | 'In Progress' | 'Completed'>('All');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Medium' as FeatureRequest['priority']
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddRequest({
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      submittedBy: userName,
      upvotes: 0
    });
  
    setFormData({ title: '', description: '', priority: 'Medium' });
    setIsModalOpen(false);
  };

  const handleStatusChange = (req: FeatureRequest, newStatus: FeatureRequest['status']) => {
    onUpdateRequest({ ...req, status: newStatus });
  };

  const filteredRequests = requests.filter(r => 
    filter === 'All' ? true : r.status === filter
  ).sort((a, b) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime());

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'In Progress': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Rejected': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const isSuperuser = userRole === 'Superuser';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Lightbulb className="text-emerald-600" /> Feature Requests
          </h2>
          <p className="text-sm text-slate-500">Submit ideas to improve the hotel system. Superusers review all requests.</p>
        </div>
        <div className="flex gap-2">
           <div className="flex bg-slate-200 p-1 rounded-lg">
             {(['All', 'Pending', 'In Progress', 'Completed'] as const).map(f => (
               <button
                 key={f}
                 onClick={() => setFilter(f)}
                 className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${filter === f ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
               >
                 {f}
               </button>
             ))}
           </div>
           <button 
             onClick={() => setIsModalOpen(true)}
             className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-sm whitespace-nowrap"
           >
             <Plus size={18} /> Submit Idea
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRequests.length > 0 ? (
          filteredRequests.map(req => (
            <div key={req.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col gap-3 relative group hover:shadow-md transition-shadow">
               <div className="flex justify-between items-start">
                  <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold border tracking-wider ${getStatusColor(req.status)}`}>
                    {req.status}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    req.priority === 'High' ? 'bg-red-50 text-red-600' :
                    req.priority === 'Medium' ? 'bg-amber-50 text-amber-600' :
                    'bg-blue-50 text-blue-600'
                  }`}>
                    {req.priority} Priority
                  </span>
               </div>
               
               <div>
                 <h3 className="font-bold text-slate-800 text-lg leading-tight">{req.title}</h3>
                 <p className="text-sm text-slate-500 mt-2 line-clamp-3">{req.description}</p>
               </div>

               <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-end">
                  <div className="text-xs text-slate-400">
                    <p className="font-medium text-slate-600">by {req.submittedBy}</p>
                    <p>{new Date(req.submittedDate).toLocaleDateString()}</p>
                  </div>
                  
                  {isSuperuser && (
                    <div className="flex gap-2">
                       {req.status === 'Pending' && (
                         <div className="flex gap-1">
                           <button 
                             onClick={() => handleStatusChange(req, 'In Progress')}
                             className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100" title="Start"
                           >
                             <Clock size={16} />
                           </button>
                           <button 
                             onClick={() => handleStatusChange(req, 'Rejected')}
                             className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100" title="Reject"
                           >
                             <Ban size={16} />
                           </button>
                         </div>
                       )}
                       {req.status === 'In Progress' && (
                         <button 
                           onClick={() => handleStatusChange(req, 'Completed')}
                           className="p-1.5 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100" title="Complete"
                         >
                           <CheckCircle2 size={16} />
                         </button>
                       )}
                       <button 
                         onClick={() => { if(window.confirm('Delete request?')) onDeleteRequest(req.id); }}
                         className="p-1.5 bg-slate-100 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                       >
                         <Trash2 size={16} />
                       </button>
                    </div>
                  )}
               </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-16 text-center bg-white rounded-xl border border-dashed border-slate-300">
             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
               <Lightbulb size={32} />
             </div>
             <p className="text-slate-500 font-medium">No feature requests found.</p>
             <p className="text-sm text-slate-400 mt-1">Submit a new idea to help us improve StaySync!</p>
          </div>
        )}
      </div>

      {/* Submission Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Submit Feature Request</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Feature Title</label>
                <input 
                  type="text" required
                  placeholder="e.g. Dark Mode Support"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="Describe the feature and why it would be useful..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Priority Level</label>
                <div className="flex gap-2">
                  {(['Low', 'Medium', 'High'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setFormData({...formData, priority: p})}
                      className={`flex-1 py-2 text-sm rounded-lg border font-medium transition-all ${
                        formData.priority === p 
                          ? 'bg-slate-800 text-white border-slate-800'
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
                   Submit Request
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeatureRequestPanel;