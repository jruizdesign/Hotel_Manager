import React, { useState, useEffect } from 'react';
import { Guest, UserRole, BookingHistory, Room, Transaction } from '../types';
import { Users, Plus, X, Search, Calendar, Star, AlertCircle, History, Clock, UserCheck, UserPlus, Receipt, DollarSign, CheckCircle2, Pencil } from 'lucide-react';

interface GuestListProps {
  guests: Guest[];
  rooms: Room[]; // Needed for calculating billing rates
  transactions: Transaction[]; // Needed for history
  history?: BookingHistory[];
  onAddGuest: (guest: Omit<Guest, 'id'>) => boolean;
  onUpdateGuest: (guest: Guest) => void;
  onAddPayment: (guestId: string, amount: number, date: string, note: string) => void;
  userRole: UserRole;
  externalBookingRequest?: {
    isOpen: boolean;
    roomNumber?: string;
  };
  onClearExternalRequest?: () => void;
}

const GuestList: React.FC<GuestListProps> = ({ 
  guests, 
  rooms,
  transactions,
  history = [], 
  onAddGuest, 
  onUpdateGuest,
  onAddPayment,
  userRole, 
  externalBookingRequest, 
  onClearExternalRequest 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null);

  const [billingGuest, setBillingGuest] = useState<Guest | null>(null); // For billing modal
  const [historyGuest, setHistoryGuest] = useState<Guest | null>(null); // For history modal
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isReturningUser, setIsReturningUser] = useState(false);
  
  // New/Edit Guest Form State
  const [formData, setFormData] = useState<Omit<Guest, 'id'>>({
    name: '',
    email: '',
    phone: '',
    roomNumber: '',
    checkIn: '',
    checkOut: '',
    vip: false,
    status: 'Reserved',
    balance: 0
  });

  // Payment Form State
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentNote, setPaymentNote] = useState('');

  // Handle external triggers
  useEffect(() => {
    if (externalBookingRequest?.isOpen) {
      resetForm();
      setIsModalOpen(true);
      setError(null);
      if (externalBookingRequest.roomNumber) {
        setFormData(prev => ({ ...prev, roomNumber: externalBookingRequest.roomNumber || '' }));
      }
      if (onClearExternalRequest) onClearExternalRequest();
    }
  }, [externalBookingRequest, onClearExternalRequest]);

  const resetForm = () => {
    setEditingGuestId(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      roomNumber: '',
      checkIn: '',
      checkOut: '',
      vip: false,
      status: 'Reserved',
      balance: 0
    });
    setIsReturningUser(false);
    setError(null);
  };

  const handleEditClick = (guest: Guest) => {
    setEditingGuestId(guest.id);
    setFormData({
      name: guest.name,
      email: guest.email,
      phone: guest.phone,
      roomNumber: guest.roomNumber,
      checkIn: guest.checkIn,
      checkOut: guest.checkOut,
      vip: guest.vip,
      status: guest.status,
      balance: guest.balance
    });
    setIsModalOpen(true);
    setIsReturningUser(false);
  };

  const filteredGuests = guests.filter(guest => 
    guest.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    guest.roomNumber.includes(searchTerm) ||
    guest.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Calculations for Billing ---

  const getGuestTransactions = (guestId: string) => {
    return transactions.filter(t => t.guestId === guestId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const calculateAccruedCharges = (guest: Guest) => {
    // 1. Find the room price
    const room = rooms.find(r => r.number === guest.roomNumber);
    if (!room) return 0;

    let price = room.price;
    if (room.discount) {
      price = price * (1 - room.discount / 100);
    }

    // 2. Calculate nights stayed (CheckIn vs Current Date)
    const checkIn = new Date(guest.checkIn);
    const checkOut = new Date(guest.checkOut);
    const today = new Date();
    
    // Determine the end date for calculation (cannot be in the future beyond check-out)
    const endDate = today < checkOut ? today : checkOut;
    
    // Calculate difference in days
    const diffTime = Math.abs(endDate.getTime() - checkIn.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    // Ensure at least 1 day charge if checked in today
    const billableDays = diffDays === 0 ? 1 : diffDays;

    return Math.round(billableDays * price);
  };

  const calculateTotalPaid = (guestId: string) => {
    const txs = getGuestTransactions(guestId);
    return txs.filter(t => t.type === 'Income').reduce((acc, t) => acc + t.amount, 0);
  };

  // --- Handlers ---

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (editingGuestId) {
      // Update existing guest
      const updatedGuest: Guest = { ...formData, id: editingGuestId };
      onUpdateGuest(updatedGuest);
      setIsModalOpen(false);
      resetForm();
    } else {
      // Create new guest
      const success = onAddGuest(formData);
      if (success) {
        setIsModalOpen(false);
        resetForm();
      } else {
        setError(`Room ${formData.roomNumber} is currently unavailable or does not exist.`);
      }
    }
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!billingGuest || !paymentAmount) return;
    
    onAddPayment(billingGuest.id, parseFloat(paymentAmount), paymentDate, paymentNote);
    
    // Reset form
    setPaymentAmount('');
    setPaymentNote('');
  };

  // Get the up-to-date billing guest object from the main list
  const activeBillingGuest = billingGuest ? guests.find(g => g.id === billingGuest.id) : null;
  
  // Calculate specific billing numbers for the modal
  const accruedAmount = activeBillingGuest ? calculateAccruedCharges(activeBillingGuest) : 0;
  const totalPaid = activeBillingGuest ? calculateTotalPaid(activeBillingGuest.id) : 0;
  const liveBalance = accruedAmount - totalPaid;

  const canEdit = userRole === 'Manager' || userRole === 'Staff' || userRole === 'Superuser';

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="text-emerald-600" /> Guest Directory
          </h2>
          <p className="text-sm text-slate-500">Manage bookings, check-ins, and finances.</p>
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
              onClick={() => { resetForm(); setIsModalOpen(true); }}
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
                <th className="px-6 py-4">Balance</th>
                <th className="px-6 py-4">Stay Duration</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGuests.length > 0 ? (
                filteredGuests.map(g => {
                   const estCharges = calculateAccruedCharges(g);
                   const paid = calculateTotalPaid(g.id);
                   const currentBalance = estCharges - paid;
                   
                   return (
                    <tr key={g.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800">{g.name} {g.vip && <Star size={12} className="inline text-amber-400 mb-1" fill="currentColor" />}</p>
                        <p className="text-xs text-slate-500">{g.email}</p>
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
                        <div className="flex flex-col">
                           <span className={`font-bold ${currentBalance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                             ${Math.abs(currentBalance).toLocaleString()}
                           </span>
                           <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                             {currentBalance > 0 ? 'Due' : 'Paid'}
                           </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-700">
                          <Calendar size={14} className="text-slate-400" />
                          <span>{g.checkIn}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center flex items-center justify-center gap-2">
                         {canEdit && (
                           <>
                              <button 
                                onClick={() => handleEditClick(g)}
                                className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Edit Guest Details"
                              >
                                <Pencil size={18} />
                              </button>
                              <button 
                                onClick={() => setBillingGuest(g)}
                                className="flex items-center gap-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                              >
                                <DollarSign size={14} /> Bill
                              </button>
                           </>
                         )}
                        <button 
                          onClick={() => setHistoryGuest(g)}
                          className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                          title="View History"
                        >
                          <History size={18} />
                        </button>
                      </td>
                    </tr>
                   );
                })
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

      {/* BILLING MODAL */}
      {activeBillingGuest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col md:flex-row" style={{ minHeight: '500px' }}>
            
            {/* Left: Summary & Payment Form */}
            <div className="w-full md:w-1/3 bg-slate-50 border-r border-slate-200 p-6 flex flex-col">
               <div className="mb-6">
                 <h3 className="text-lg font-bold text-slate-800">{activeBillingGuest.name}</h3>
                 <p className="text-sm text-slate-500">Room #{activeBillingGuest.roomNumber}</p>
                 <div className="mt-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Current Balance</p>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-3xl font-bold ${liveBalance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        ${Math.abs(liveBalance).toLocaleString()}
                      </span>
                      {liveBalance > 0 && <span className="text-xs font-bold text-red-400">DUE</span>}
                    </div>
                    <div className="mt-3 space-y-1 text-xs text-slate-600 pt-3 border-t border-slate-100">
                      <div className="flex justify-between">
                        <span>Est. Charges:</span>
                        <span className="font-medium">${accruedAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Paid:</span>
                        <span className="font-medium text-emerald-600">-${totalPaid.toLocaleString()}</span>
                      </div>
                    </div>
                 </div>
               </div>

               {/* Payment Form */}
               <div className="flex-1">
                 <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
                   <Receipt size={16} /> Record Payment
                 </h4>
                 <form onSubmit={handlePaymentSubmit} className="space-y-3">
                   <div>
                     <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
                     <input 
                       type="date" 
                       required
                       className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                       value={paymentDate}
                       onChange={e => setPaymentDate(e.target.value)}
                     />
                   </div>
                   <div>
                     <label className="block text-xs font-medium text-slate-500 mb-1">Amount ($)</label>
                     <input 
                       type="number" 
                       required
                       min="0.01"
                       step="0.01"
                       className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                       value={paymentAmount}
                       onChange={e => setPaymentAmount(e.target.value)}
                       placeholder="0.00"
                     />
                   </div>
                   <div>
                     <label className="block text-xs font-medium text-slate-500 mb-1">Note</label>
                     <input 
                       type="text" 
                       className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                       value={paymentNote}
                       onChange={e => setPaymentNote(e.target.value)}
                       placeholder="e.g. Cash, Credit Card"
                     />
                   </div>
                   <button 
                     type="submit"
                     className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-bold text-sm shadow-sm mt-2 transition-colors"
                   >
                     Confirm Payment
                   </button>
                 </form>
               </div>
            </div>

            {/* Right: Transaction Ledger */}
            <div className="w-full md:w-2/3 flex flex-col">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
                <h3 className="font-bold text-slate-800">Transaction History</h3>
                <button onClick={() => setBillingGuest(null)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-0 bg-white">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50/50 border-b border-slate-100 text-slate-700 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 font-medium">Date</th>
                      <th className="px-6 py-3 font-medium">Description</th>
                      <th className="px-6 py-3 font-medium">Type</th>
                      <th className="px-6 py-3 font-medium text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {/* 1. Show Payment Transactions */}
                    {getGuestTransactions(activeBillingGuest.id).map(t => (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="px-6 py-3 whitespace-nowrap">{t.date}</td>
                        <td className="px-6 py-3">{t.description}</td>
                        <td className="px-6 py-3">
                           <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-semibold">Payment</span>
                        </td>
                        <td className="px-6 py-3 text-right font-bold text-emerald-600">
                          -${t.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    
                    {/* 2. Show Simulated Daily Charges (Visual Aid Only) */}
                    <tr className="bg-slate-50/50">
                       <td colSpan={4} className="px-6 py-2 text-center text-xs font-bold text-slate-400 tracking-wider uppercase">
                          System Accruals (Estimated)
                       </td>
                    </tr>
                    <tr>
                       <td className="px-6 py-3 text-slate-400">{activeBillingGuest.checkIn} - Today</td>
                       <td className="px-6 py-3 text-slate-500 italic">Room Charges (Accrued)</td>
                       <td className="px-6 py-3"><span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-semibold">Charge</span></td>
                       <td className="px-6 py-3 text-right font-medium text-slate-800">${accruedAmount.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
                
                {getGuestTransactions(activeBillingGuest.id).length === 0 && (
                   <div className="p-8 text-center text-slate-400">
                     <p>No payments recorded yet.</p>
                   </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyGuest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Clock size={20} className="text-emerald-600" /> Past Stays
                </h3>
                <p className="text-sm text-slate-500">{historyGuest.name}</p>
              </div>
              <button onClick={() => setHistoryGuest(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-0">
               {/* Simplified History View - Using Mock Data */}
               <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50/50 border-b border-slate-100 text-slate-700 font-medium">
                      <tr>
                        <th className="px-6 py-3">Dates</th>
                        <th className="px-6 py-3">Room</th>
                        <th className="px-6 py-3">Total</th>
                        <th className="px-6 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {history.filter(h => h.guestId === historyGuest.id).map(h => (
                        <tr key={h.id} className="hover:bg-slate-50">
                          <td className="px-6 py-3">{h.checkIn} - {h.checkOut}</td>
                          <td className="px-6 py-3 font-mono">#{h.roomNumber}</td>
                          <td className="px-6 py-3">${h.totalAmount}</td>
                          <td className="px-6 py-3">{h.status}</td>
                        </tr>
                      ))}
                      {history.filter(h => h.guestId === historyGuest.id).length === 0 && (
                        <tr><td colSpan={4} className="p-6 text-center text-slate-400">No past history records found.</td></tr>
                      )}
                    </tbody>
                  </table>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Booking Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">{editingGuestId ? 'Edit Booking' : 'New Booking'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            {/* User Type Toggle (Only for New Booking) */}
            {!editingGuestId && (
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
            )}
            
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
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                    <input 
                      type="text" required
                      readOnly={isReturningUser}
                      className={`w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none ${isReturningUser ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input 
                      type="email" required
                      readOnly={isReturningUser}
                      className={`w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none ${isReturningUser ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                    <input 
                      type="tel" required
                      readOnly={isReturningUser}
                      className={`w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none ${isReturningUser ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
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
                      value={formData.roomNumber}
                      onChange={e => setFormData({...formData, roomNumber: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Check In</label>
                      <input 
                        type="date" required
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={formData.checkIn}
                        onChange={e => setFormData({...formData, checkIn: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Check Out</label>
                      <input 
                        type="date" required
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={formData.checkOut}
                        onChange={e => setFormData({...formData, checkOut: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                       <select 
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={formData.status}
                          onChange={e => setFormData({...formData, status: e.target.value as any})}
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
                          checked={formData.vip}
                          onChange={e => setFormData({...formData, vip: e.target.checked})}
                          disabled={isReturningUser}
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
                  {editingGuestId ? 'Save Changes' : 'Complete Booking'}
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