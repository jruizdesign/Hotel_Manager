import React, { useState, useEffect } from 'react';
import { Guest, UserRole, BookingHistory } from '../types';
import { MOCK_HISTORY } from '../constants';
import { Users, Plus, X, Search, Calendar, Star, AlertCircle, History, Clock, UserCheck, UserPlus } from 'lucide-react';

interface GuestListProps {
  guests: Guest[];
  history?: BookingHistory[]; // For finding past guests
  onAddGuest: (guest: Omit<Guest, 'id'>) => boolean;
  userRole: UserRole;
  // Props for triggering modal from outside
  externalBookingRequest?: {
    isOpen: boolean;
    roomNumber?: string;
  };
  onClearExternalRequest?: () => void;
}

const GuestList: React.FC<GuestListProps> = ({ 
  guests, 
  history = [], 
  onAddGuest, 
  userRole, 
  externalBookingRequest, 
  onClearExternalRequest 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [historyGuest, setHistoryGuest] = useState<Guest | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isReturningUser, setIsReturningUser] = useState(false);
  
  // Form State
  const [newGuest, setNewGuest] = useState<Omit<Guest, 'id'>>({
    name: '',
    email: '',
    phone: '',
    roomNumber: '',
    checkIn: '',
    checkOut: '',
    vip: false,
    status: 'Reserved'
  });

  // Handle external triggers (e.g., from RoomList "Book Now" button)
  useEffect(() => {
    if (externalBookingRequest?.isOpen) {
      setIsModalOpen(true);
      setError(null);
      if (externalBookingRequest.roomNumber) {
        setNewGuest(prev => ({ ...prev, roomNumber: externalBookingRequest.roomNumber || '' }));
      }
      // Clear the request prop so it doesn't re-trigger
      if (onClearExternalRequest) onClearExternalRequest();
    }
  }, [externalBookingRequest, onClearExternalRequest]);

  // Aggregate unique users from Active Guests and History for the dropdown
  const getUniquePastGuests = () => {
    const map = new Map();
    // Add history guests first
    history.forEach(h => {
       // We don't have full details in history, this is a mock limitation
       // In a real app, history would link to a User entity.
       // We will rely on finding guests by ID in the mock data, 
       // but since MOCK_HISTORY stores 'guestId', we can cross-reference MOCK_GUESTS if they exist there.
       // For this demo, let's assume we can search the 'guests' array (which is the main registry).
    });

    // Simpler approach for this mock: Use the provided `guests` array as the "Database of Users" 
    // plus any unique IDs we can find.
    // Let's filter the CURRENT `guests` prop to find people who are checked out or in history.
    // Actually, let's just use the `guests` array (which implies all known guests in this simple model)
    return guests;
  };

  const filteredGuests = guests.filter(guest => 
    guest.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    guest.roomNumber.includes(searchTerm) ||
    guest.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const success = onAddGuest(newGuest);
    
    if (success) {
      setIsModalOpen(false);
      // Reset form
      setNewGuest({
        name: '',
        email: '',
        phone: '',
        roomNumber: '',
        checkIn: '',
        checkOut: '',
        vip: false,
        status: 'Reserved'
      });
      setIsReturningUser(false);
    } else {
      setError(`Room ${newGuest.roomNumber} is currently unavailable or does not exist.`);
    }
  };

  const handleReturningUserSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (!selectedId) return;

    const user = guests.find(g => g.id === selectedId);
    if (user) {
      setNewGuest(prev => ({
        ...prev,
        name: user.name,
        email: user.email,
        phone: user.phone,
        vip: user.vip
      }));
    }
  };

  const getGuestHistory = (guestId: string) => {
    return history.filter(h => h.guestId === guestId);
  };

  const canEdit = userRole === 'Manager' || userRole === 'Staff';

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="text-emerald-600" /> Guest Directory
          </h2>
          <p className="text-sm text-slate-500">Manage bookings, check-ins, and VIP statuses.</p>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search guests..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none w-full sm:w-64"
            />
          </div>
          {canEdit && (
            <button 
              onClick={() => { setIsModalOpen(true); setError(null); setIsReturningUser(false); }}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-sm whitespace-nowrap"
            >
              <Plus size={18} /> <span className="hidden sm:inline">Add Booking</span>
            </button>
          )}
        </div>
      </div>

      {/* Guest Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-800 font-semibold uppercase">
              <tr>
                <th className="px-6 py-4">Guest Details</th>
                <th className="px-6 py-4">Room</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Stay Duration</th>
                <th className="px-6 py-4">VIP</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGuests.length > 0 ? (
                filteredGuests.map(g => (
                  <tr key={g.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{g.name}</p>
                      <p className="text-xs text-slate-500">{g.email}</p>
                      <p className="text-xs text-slate-500">{g.phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono bg-slate-100 px-2 py-1 rounded text-slate-700">#{g.roomNumber}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        g.status === 'Checked In' ? 'bg-emerald-100 text-emerald-700' :
                        g.status === 'Reserved' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {g.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-700">
                        <Calendar size={14} className="text-slate-400" />
                        <span>{g.checkIn}</span>
                        <span className="text-slate-400">→</span>
                        <span>{g.checkOut}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {g.vip ? (
                        <span className="flex items-center gap-1 text-amber-500 font-semibold bg-amber-50 px-2 py-1 rounded w-fit">
                          <Star size={14} fill="currentColor" /> VIP
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => setHistoryGuest(g)}
                        className="text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 p-2 rounded-lg transition-colors"
                        title="View History"
                      >
                        <History size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    No guests found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* History Modal */}
      {historyGuest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Clock size={20} className="text-emerald-600" /> Guest History
                </h3>
                <p className="text-sm text-slate-500">{historyGuest.name} ({historyGuest.email})</p>
              </div>
              <button onClick={() => setHistoryGuest(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-0">
              {getGuestHistory(historyGuest.id).length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50/50 border-b border-slate-100 text-slate-700 font-medium">
                      <tr>
                        <th className="px-6 py-3">Dates</th>
                        <th className="px-6 py-3">Room</th>
                        <th className="px-6 py-3">Type</th>
                        <th className="px-6 py-3">Total</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-right">Rating</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {getGuestHistory(historyGuest.id).map(h => (
                        <tr key={h.id} className="hover:bg-slate-50">
                          <td className="px-6 py-3">
                             <div className="flex flex-col">
                               <span className="font-medium text-slate-800">{h.checkIn}</span>
                               <span className="text-xs text-slate-400">to {h.checkOut}</span>
                             </div>
                          </td>
                          <td className="px-6 py-3 font-mono">#{h.roomNumber}</td>
                          <td className="px-6 py-3">{h.roomType}</td>
                          <td className="px-6 py-3 font-medium text-slate-800">${h.totalAmount}</td>
                          <td className="px-6 py-3">
                            <span className={`px-2 py-0.5 rounded text-xs border ${
                              h.status === 'Completed' ? 'bg-green-50 border-green-100 text-green-700' :
                              h.status === 'Cancelled' ? 'bg-red-50 border-red-100 text-red-700' :
                              'bg-gray-50 border-gray-100 text-gray-700'
                            }`}>
                              {h.status}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-right">
                             {h.rating ? (
                               <div className="flex items-center justify-end gap-1 text-amber-400">
                                 <span className="font-bold text-slate-700">{h.rating}</span>
                                 <Star size={12} fill="currentColor" />
                               </div>
                             ) : <span className="text-slate-300">-</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center flex flex-col items-center justify-center text-slate-400">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <History size={32} className="opacity-50" />
                  </div>
                  <p className="font-medium text-slate-600">No Previous History</p>
                  <p className="text-sm">This appears to be the guest's first visit.</p>
                </div>
              )}
            </div>
            
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setHistoryGuest(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-white hover:shadow-sm font-medium transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Guest / Booking Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">New Booking</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            {/* User Type Toggle */}
            <div className="px-6 pt-4 pb-0 flex gap-4 border-b border-slate-100">
               <button 
                 onClick={() => setIsReturningUser(false)}
                 className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${!isReturningUser ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
               >
                 <UserPlus size={16} /> New Guest
               </button>
               <button 
                 onClick={() => setIsReturningUser(true)}
                 className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${isReturningUser ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
               >
                 <UserCheck size={16} /> Returning Guest
               </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2 border border-red-200">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Personal Info */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-slate-900 border-b pb-2">Guest Information</h4>
                  
                  {isReturningUser && (
                     <div className="mb-2">
                       <label className="block text-sm font-medium text-slate-700 mb-1">Select Guest</label>
                       <select 
                         className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50"
                         onChange={handleReturningUserSelect}
                         defaultValue=""
                       >
                         <option value="" disabled>Search existing guest...</option>
                         {/* Filter unique guests based on name/email/id */}
                         {getUniquePastGuests().map(g => (
                           <option key={g.id} value={g.id}>{g.name} ({g.email})</option>
                         ))}
                       </select>
                     </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                    <input 
                      type="text" required
                      readOnly={isReturningUser}
                      className={`w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none ${isReturningUser ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
                      value={newGuest.name}
                      onChange={e => setNewGuest({...newGuest, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input 
                      type="email" required
                      readOnly={isReturningUser}
                      className={`w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none ${isReturningUser ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
                      value={newGuest.email}
                      onChange={e => setNewGuest({...newGuest, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                    <input 
                      type="tel" required
                      readOnly={isReturningUser}
                      className={`w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none ${isReturningUser ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
                      value={newGuest.phone}
                      onChange={e => setNewGuest({...newGuest, phone: e.target.value})}
                    />
                  </div>
                </div>

                {/* Booking Info */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-slate-900 border-b pb-2">Booking Details</h4>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Room Number</label>
                    <input 
                      type="text" required
                      placeholder="e.g. 101"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                      value={newGuest.roomNumber}
                      onChange={e => setNewGuest({...newGuest, roomNumber: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Check In</label>
                      <input 
                        type="date" required
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={newGuest.checkIn}
                        onChange={e => setNewGuest({...newGuest, checkIn: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Check Out</label>
                      <input 
                        type="date" required
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={newGuest.checkOut}
                        onChange={e => setNewGuest({...newGuest, checkOut: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                       <select 
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={newGuest.status}
                          onChange={e => setNewGuest({...newGuest, status: e.target.value as any})}
                       >
                         <option value="Reserved">Reserved</option>
                         <option value="Checked In">Checked In</option>
                       </select>
                    </div>
                    <div className="flex items-end mb-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 border-gray-300"
                          checked={newGuest.vip}
                          onChange={e => setNewGuest({...newGuest, vip: e.target.checked})}
                          disabled={isReturningUser} // VIP status comes from user profile
                        />
                        <span className={`text-sm font-medium ${isReturningUser ? 'text-slate-400' : 'text-slate-700'}`}>Mark as VIP</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors shadow-sm"
                >
                  Complete Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestList;