
import React, { useState, useEffect, useRef } from 'react';
import { Guest, UserRole, BookingHistory, Room, Transaction, RoomStatus, DNRRecord } from '../types';
import { 
  Users, Plus, X, Search, Calendar, Star, AlertCircle, History, 
  Clock, UserCheck, UserPlus, Receipt, DollarSign, CheckCircle2, 
  Pencil, Ban, Trash2, Camera, Upload, LogOut, Mail, Sparkles, 
  Send, ChevronRight, RefreshCw, MoreVertical, Phone, MessageSquare, AlertTriangle, FileText
} from 'lucide-react';
import { generateAIResponse } from '../services/geminiService';

interface GuestListProps {
  guests: Guest[];
  rooms: Room[];
  transactions: Transaction[];
  history?: BookingHistory[];
  dnrRecords?: DNRRecord[];
  onAddGuest: (guest: Omit<Guest, 'id'>) => boolean;
  onUpdateGuest: (guest: Guest) => void;
  onAddPayment: (guestId: string, amount: number, date: string, note: string) => void;
  onCheckOut: (roomId: string) => void;
  onAddDNR?: (record: Omit<DNRRecord, 'id' | 'dateAdded'>) => void;
  onDeleteDNR?: (id: string) => void;
  userRole: UserRole;
  externalBookingRequest?: {
    isOpen: boolean;
    roomNumber?: string;
  };
  onClearExternalRequest?: () => void;
}

const API_URL = 'http://localhost:3000'; 

const GuestList: React.FC<GuestListProps> = ({ 
  guests, 
  rooms,
  transactions,
  history = [], 
  dnrRecords = [],
  onAddGuest, 
  onUpdateGuest,
  onAddPayment,
  onCheckOut,
  onAddDNR,
  onDeleteDNR,
  userRole, 
  externalBookingRequest, 
  onClearExternalRequest 
}) => {
  const [activeTab, setActiveTab] = useState<'directory' | 'dnr'>('directory');
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isDNRModalOpen, setIsDNRModalOpen] = useState(false);
  
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const [formData, setFormData] = useState<Omit<Guest, 'id'>>({
    name: '', email: '', phone: '', roomNumber: '', checkIn: '', checkOut: '', vip: false, status: 'Reserved', balance: 0
  });
  const [dnrForm, setDnrForm] = useState<{name: string, reason: string, notes: string, photo: string}>({
    name: '', reason: '', notes: '', photo: ''
  });
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentNote, setPaymentNote] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedGuest = guests.find(g => g.id === selectedGuestId) || null;
  const filteredGuests = guests.filter(guest => 
    guest.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    guest.roomNumber.includes(searchTerm) ||
    guest.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredDNR = dnrRecords.filter(record => 
    record.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getGuestTransactions = (guestId: string) => transactions.filter(t => t.guestId === guestId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const calculateTotalPaid = (guestId: string) => {
    return getGuestTransactions(guestId).filter(t => t.type === 'Income').reduce((acc, t) => acc + t.amount, 0);
  };

  useEffect(() => {
    if (externalBookingRequest?.isOpen) {
      setActiveTab('directory');
      resetBookingForm();
      setIsBookingModalOpen(true);
      if (externalBookingRequest.roomNumber) {
        setFormData(prev => ({ ...prev, roomNumber: externalBookingRequest.roomNumber || '' }));
      }
      if (onClearExternalRequest) onClearExternalRequest();
    }
  }, [externalBookingRequest, onClearExternalRequest]);

  const resetBookingForm = () => {
    setFormData({ name: '', email: '', phone: '', roomNumber: '', checkIn: '', checkOut: '', vip: false, status: 'Reserved', balance: 0 });
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onAddGuest(formData)) {
      setIsBookingModalOpen(false);
      resetBookingForm();
    } else {
      alert("Room unavailable or error creating booking.");
    }
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedGuest && paymentAmount) {
      onAddPayment(selectedGuest.id, parseFloat(paymentAmount), paymentDate, paymentNote);
      setPaymentAmount(''); setPaymentNote('');
    }
  };

  const handleCheckOutGuest = () => {
    if (selectedGuest) {
      if (selectedGuest.balance > 0) {
        alert(`Cannot checkout: Guest has an outstanding balance of $${selectedGuest.balance}. Please log a payment first.`);
        return;
      }
      const room = rooms.find(r => r.number === selectedGuest.roomNumber);
      if (room) onCheckOut(room.id);
    }
  };

  const generateEmailDraft = async (topic: string) => {
    if (!selectedGuest) return;
    setIsGeneratingAI(true);

    const context = `
      Guest Name: ${selectedGuest.name}
      Room: ${selectedGuest.roomNumber}
      Balance: $${selectedGuest.balance}
      Status: ${selectedGuest.status}
      VIP: ${selectedGuest.vip ? 'Yes' : 'No'}
      Check-In: ${selectedGuest.checkIn}
      Check-Out: ${selectedGuest.checkOut}
      Hotel Name: StaySync Hotel
    `;

    const prompt = `Write a professional, warm, and concise email for a hotel guest.
    Context: ${context}
    Topic: ${topic}
    Structure: Subject Line, Body.
    Output: Only the email content. Do not include "Here is the email" prefix.`;

    const response = await generateAIResponse(prompt, context);
    const lines = response.split('\n');
    let subject = "Update from StaySync";
    let body = response;

    const subjectLine = lines.find(l => l.toLowerCase().startsWith('subject:'));
    if (subjectLine) {
      subject = subjectLine.replace(/subject:/i, '').trim();
      body = lines.filter(l => !l.toLowerCase().startsWith('subject:')).join('\n').trim();
    }

    setEmailSubject(subject);
    setEmailBody(body);
    setIsGeneratingAI(false);
  };

  const sendEmail = async () => {
    if (!selectedGuest?.email) return;
    setIsSendingEmail(true);
    try {
      const response = await fetch(`${API_URL}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: selectedGuest.email,
          subject: emailSubject,
          body: emailBody
        }),
      });
      if (response.ok) {
        alert("Email sent successfully!");
        setEmailSubject('');
        setEmailBody('');
        setAiPrompt('');
      } else {
        alert("Failed to send email via backend.");
      }
    } catch (e) {
      console.error(e);
      alert("Network error sending email.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const renderGuestList = () => (
    <div className="flex-1 bg-white rounded-l-2xl shadow-sm border-r border-slate-200 flex flex-col h-[calc(100vh-140px)]">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h3 className="font-bold text-slate-700">Guest Directory ({filteredGuests.length})</h3>
        <button 
           onClick={() => { resetBookingForm(); setIsBookingModalOpen(true); }}
           className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredGuests.map(guest => (
          <div 
            key={guest.id}
            onClick={() => setSelectedGuestId(guest.id)}
            className={`p-4 border-b border-slate-100 cursor-pointer transition-all hover:bg-slate-50 ${
              selectedGuestId === guest.id ? 'bg-emerald-50 border-l-4 border-l-emerald-500 pl-[13px]' : 'pl-4'
            }`}
          >
             <div className="flex justify-between items-start">
                <div>
                   <p className={`font-bold text-sm ${selectedGuestId === guest.id ? 'text-emerald-900' : 'text-slate-800'}`}>
                     {guest.name}
                   </p>
                   <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-500 font-mono">#{guest.roomNumber}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        guest.status === 'Checked In' ? 'bg-emerald-100 text-emerald-700' : 
                        guest.status === 'Reserved' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {guest.status}
                      </span>
                      {guest.vip && <Star size={10} className="text-amber-400 fill-amber-400" />}
                      {guest.balance > 0 && <span className="w-1.5 h-1.5 bg-red-500 rounded-full" title="Outstanding Balance"></span>}
                   </div>
                </div>
                <ChevronRight size={16} className={`mt-2 transition-transform ${selectedGuestId === guest.id ? 'text-emerald-500 translate-x-1' : 'text-slate-300'}`} />
             </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderGuestDetail = () => {
    if (!selectedGuest) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-r-2xl border-y border-r border-slate-200">
           <Users size={48} className="mb-4 text-slate-300" />
           <p>Select a guest to view profile</p>
        </div>
      );
    }

    const historyItems = history.filter(h => h.guestId === selectedGuest.id);
    const hasBalance = selectedGuest.balance > 0;

    return (
      <div className="flex-[2] bg-white rounded-r-2xl border-y border-r border-slate-200 h-[calc(100vh-140px)] overflow-y-auto flex flex-col">
         <div className="p-6 border-b border-slate-100">
            <div className="flex justify-between items-start mb-4">
               <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-2xl font-bold text-slate-500">
                    {selectedGuest.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                      {selectedGuest.name}
                      {selectedGuest.vip && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-bold flex items-center gap-1"><Star size={10} /> VIP</span>}
                    </h2>
                    <div className="flex gap-4 text-sm text-slate-500 mt-1">
                      <span className="flex items-center gap-1"><Mail size={14} /> {selectedGuest.email}</span>
                      <span className="flex items-center gap-1"><Phone size={14} /> {selectedGuest.phone}</span>
                    </div>
                  </div>
               </div>
               <div className="flex flex-col items-end gap-2">
                 {selectedGuest.status === 'Checked In' && (
                   <button 
                     onClick={handleCheckOutGuest}
                     className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all border ${
                       hasBalance 
                        ? 'bg-red-50 text-red-600 border-red-200 cursor-not-allowed opacity-80' 
                        : 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-700'
                     }`}
                     title={hasBalance ? "Payment Required before Checkout" : "Proceed with Checkout"}
                   >
                     {hasBalance ? <AlertTriangle size={14} /> : <LogOut size={14} />} 
                     {hasBalance ? "Blocked (Pay Balance)" : "Check Out"}
                   </button>
                 )}
                 {hasBalance && (
                    <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider flex items-center gap-1">
                       <DollarSign size={10}/> $0 Balance required for checkout
                    </p>
                 )}
               </div>
            </div>
            
            <div className="grid grid-cols-4 gap-4 mt-6">
               <div className="p-3 bg-slate-50 rounded-lg">
                 <p className="text-[10px] uppercase font-bold text-slate-400">Room</p>
                 <p className="font-mono font-bold text-lg text-slate-800">{selectedGuest.roomNumber}</p>
               </div>
               <div className="p-3 bg-slate-50 rounded-lg">
                 <p className="text-[10px] uppercase font-bold text-slate-400">Dates</p>
                 <p className="font-medium text-sm text-slate-800">{new Date(selectedGuest.checkIn).toLocaleDateString()} - {selectedGuest.checkOut ? new Date(selectedGuest.checkOut).toLocaleDateString() : 'Undetermined' } </p>
               </div>
               <div className={`p-3 rounded-lg border ${hasBalance ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
                 <p className="text-[10px] uppercase font-bold text-slate-400">Balance Due</p>
                 <p className={`font-bold text-lg ${hasBalance ? 'text-red-500' : 'text-emerald-600'}`}>${selectedGuest.balance}</p>
               </div>
               <div className="p-3 bg-slate-50 rounded-lg">
                 <p className="text-[10px] uppercase font-bold text-slate-400">Status</p>
                 <p className="font-medium text-sm text-emerald-600">{selectedGuest.status}</p>
               </div>
            </div>
         </div>

         <div className="flex-1 p-6 space-y-8">
            <section className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-1 border border-indigo-100">
               <div className="bg-white/60 backdrop-blur rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-4">
                     <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg text-white">
                       <Sparkles size={18} />
                     </div>
                     <div>
                       <h3 className="font-bold text-indigo-900">AI Communicator</h3>
                       <p className="text-xs text-indigo-600">Draft personalized emails instantly.</p>
                     </div>
                  </div>

                  {!emailBody ? (
                    <div className="space-y-4">
                       <div className="flex gap-2 overflow-x-auto pb-2">
                          <button onClick={() => generateEmailDraft("Welcome and Check-in details")} className="whitespace-nowrap px-3 py-1.5 bg-white border border-indigo-200 rounded-full text-xs font-medium text-indigo-700 hover:bg-indigo-50 transition-colors">👋 Welcome Email</button>
                          {hasBalance && <button onClick={() => generateEmailDraft("Friendly balance reminder")} className="whitespace-nowrap px-3 py-1.5 bg-white border border-red-200 rounded-full text-xs font-medium text-red-700 hover:bg-red-50 transition-colors">💸 Payment Reminder</button>}
                          <button onClick={() => generateEmailDraft("Confirm late check-out")} className="whitespace-nowrap px-3 py-1.5 bg-white border border-indigo-200 rounded-full text-xs font-medium text-indigo-700 hover:bg-indigo-50 transition-colors">⏰ Late Checkout</button>
                          <button onClick={() => generateEmailDraft("Ask for feedback after stay")} className="whitespace-nowrap px-3 py-1.5 bg-white border border-indigo-200 rounded-full text-xs font-medium text-indigo-700 hover:bg-indigo-50 transition-colors">⭐ Request Feedback</button>
                       </div>
                       
                       <div className="relative">
                          <input 
                            type="text" 
                            placeholder="Or describe what you want to say..." 
                            className="w-full pl-4 pr-12 py-3 bg-white border border-indigo-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && generateEmailDraft(aiPrompt)}
                          />
                          <button 
                            onClick={() => generateEmailDraft(aiPrompt)}
                            disabled={isGeneratingAI || !aiPrompt}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                          >
                            {isGeneratingAI ? <RefreshCw size={16} className="animate-spin"/> : <Sparkles size={16} />}
                          </button>
                       </div>
                    </div>
                  ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-2">
                       <div className="mb-3">
                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Subject</label>
                         <input 
                           type="text"
                           value={emailSubject}
                           onChange={(e) => setEmailSubject(e.target.value)}
                           className="w-full font-bold text-slate-800 bg-transparent border-b border-slate-200 py-1 focus:border-indigo-500 outline-none"
                         />
                       </div>
                       <div className="mb-4">
                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Message Body</label>
                         <textarea 
                           rows={6}
                           value={emailBody}
                           onChange={(e) => setEmailBody(e.target.value)}
                           className="w-full mt-1 text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                         />
                       </div>
                       <div className="flex gap-3">
                          <button 
                            onClick={() => { setEmailBody(''); setEmailSubject(''); }}
                            className="flex-1 py-2 text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors"
                          >
                            Discard
                          </button>
                          <button 
                             onClick={sendEmail}
                             disabled={!selectedGuest.email || isSendingEmail}
                             className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm shadow-md shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 transition-all flex justify-center items-center gap-2"
                          >
                             {isSendingEmail ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />} 
                             Send Email
                          </button>
                       </div>
                       {!selectedGuest.email && (
                         <p className="text-xs text-red-500 text-center mt-2 flex items-center justify-center gap-1"><AlertCircle size={12}/> Guest has no email address on file.</p>
                       )}
                    </div>
                  )}
               </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                 <h3 className="font-bold text-slate-800 flex items-center gap-2"><Receipt size={18} className="text-slate-400" /> Billing & Payments</h3>
                 {hasBalance && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold animate-pulse">Payment Pending</span>}
              </div>
              <div className="flex gap-6">
                 <div className="flex-1 space-y-3">
                    <form onSubmit={handlePaymentSubmit} className="space-y-3">
                       <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                          <input 
                            type="number" step="0.01" min="0" placeholder="Amount" required
                            className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-emerald-500 font-bold"
                            value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)}
                          />
                       </div>
                       <input 
                         type="text" placeholder="Method (e.g. Cash, Visa)"
                         className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-emerald-500"
                         value={paymentNote} onChange={e => setPaymentNote(e.target.value)}
                       />
                       <button type="submit" className="w-full bg-slate-800 text-white py-2 rounded-lg text-sm font-bold hover:bg-slate-900 transition-colors shadow-sm flex items-center justify-center gap-2">
                         <DollarSign size={14}/> Log Payment & Receipt
                       </button>
                    </form>
                 </div>
                 <div className="flex-1 bg-slate-50 rounded-lg p-4 border border-slate-100 max-h-48 overflow-y-auto">
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Recent Activity</h4>
                    <div className="space-y-2">
                       {getGuestTransactions(selectedGuest.id).map(t => (
                         <div key={t.id} className="flex justify-between items-center text-xs group">
                           <div className="flex items-center gap-2">
                              {t.type === 'Income' ? <CheckCircle2 size={12} className="text-emerald-500" /> : <FileText size={12} className="text-blue-500" />}
                              <span className="text-slate-600">{t.description}</span>
                           </div>
                           <span className={`font-mono font-bold ${t.type === 'Income' ? 'text-emerald-600' : 'text-slate-800'}`}>
                             {t.type === 'Income' ? '-' : '+'}${t.amount}
                           </span>
                         </div>
                       ))}
                       {getGuestTransactions(selectedGuest.id).length === 0 && <p className="text-xs text-slate-400 italic">No transactions yet.</p>}
                    </div>
                 </div>
              </div>
            </section>
            
            {historyItems.length > 0 && (
              <section>
                 <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><History size={18} className="text-slate-400" /> Stay History</h3>
                 <div className="space-y-2">
                   {historyItems.map(h => (
                     <div key={h.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm">
                        <span className="font-medium text-slate-700">{h.checkIn} — {h.checkOut}</span>
                        <div className="flex gap-4 text-slate-500">
                           <span>Room {h.roomNumber}</span>
                           <span className="font-mono">${h.totalAmount}</span>
                        </div>
                     </div>
                   ))}
                 </div>
              </section>
            )}

         </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500 uppercase font-bold">Total Guests</p>
            <p className="text-2xl font-bold text-slate-800">{guests.length}</p>
         </div>
         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500 uppercase font-bold">Arrivals</p>
            <p className="text-2xl font-bold text-blue-600">{guests.filter(g => g.checkIn === new Date().toISOString().split('T')[0]).length}</p>
         </div>
         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500 uppercase font-bold">Departures</p>
            <p className="text-2xl font-bold text-amber-500">{guests.filter(g => g.checkOut === new Date().toISOString().split('T')[0]).length}</p>
         </div>
         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500 uppercase font-bold">Outstanding</p>
            <p className="text-2xl font-bold text-red-500">{guests.filter(g => g.balance > 0).length}</p>
         </div>
      </div>

      <div className="flex items-center justify-between">
         <div className="flex gap-4">
             <button onClick={() => setActiveTab('directory')} className={`text-sm font-bold pb-1 ${activeTab === 'directory' ? 'text-slate-800 border-b-2 border-slate-800' : 'text-slate-400'}`}>Guest Directory</button>
             <button onClick={() => setActiveTab('dnr')} className={`text-sm font-bold pb-1 ${activeTab === 'dnr' ? 'text-red-600 border-b-2 border-red-600' : 'text-slate-400'}`}>Blocked List</button>
         </div>
         <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
             <input 
               type="text" placeholder="Search..." 
               value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
               className="pl-9 pr-4 py-1.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none w-64"
             />
         </div>
      </div>

      {activeTab === 'directory' ? (
        <div className="flex items-start">
           {renderGuestList()}
           {renderGuestDetail()}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
           <div className="flex justify-between mb-6">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><Ban className="text-red-500" /> Do Not Rent List</h3>
              <button onClick={() => setIsDNRModalOpen(true)} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-700">Add Entry</button>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDNR.map(record => (
                <div key={record.id} className="border border-slate-200 rounded-lg p-4 flex gap-4 items-start">
                   {record.photo ? (
                      <img src={record.photo} className="w-16 h-16 rounded-lg object-cover bg-slate-100" />
                   ) : (
                      <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center text-slate-300"><UserCheck size={24}/></div>
                   )}
                   <div className="flex-1">
                      <p className="font-bold text-slate-800">{record.name}</p>
                      <p className="text-xs text-red-500 font-bold uppercase">{record.reason}</p>
                      <p className="text-xs text-slate-500 mt-2 line-clamp-2">"{record.notes}"</p>
                      {onDeleteDNR && <button onClick={() => onDeleteDNR(record.id)} className="text-xs text-slate-400 hover:text-red-500 mt-2 underline">Remove</button>}
                   </div>
                </div>
              ))}
              {filteredDNR.length === 0 && <p className="col-span-full text-center py-10 text-slate-400 italic">No blocked guests found.</p>}
           </div>
        </div>
      )}

      {isBookingModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                 <h3 className="font-bold text-slate-800">New Reservation</h3>
                 <button onClick={() => setIsBookingModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
              </div>
              <form onSubmit={handleBookingSubmit} className="p-6 space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <input required placeholder="Guest Name" className="p-2 border rounded-lg" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    <input required placeholder="Email" type="email" className="p-2 border rounded-lg" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    <input required placeholder="Phone" className="p-2 border rounded-lg" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    <select required className="p-2 border rounded-lg" value={formData.roomNumber} onChange={e => setFormData({...formData, roomNumber: e.target.value})}>
                       <option value="">Select Room</option>
                       {rooms.filter(r => r.status === 'Available' || r.number === formData.roomNumber).map(r => <option key={r.id} value={r.number}>{r.number} ({r.type})</option>)}
                    </select>
                    <div className="col-span-2 grid grid-cols-2 gap-4">
                       <div><label className="text-xs text-slate-500">Check In</label><input type="date" required className="w-full p-2 border rounded-lg" value={formData.checkIn} onChange={e => setFormData({...formData, checkIn: e.target.value})} /></div>
                       <div><label className="text-xs text-slate-500">Check Out</label><input type="date" required className="w-full p-2 border rounded-lg" value={formData.checkOut} onChange={e => setFormData({...formData, checkOut: e.target.value})} /></div>
                    </div>
                 </div>
                 <div className="flex gap-2 items-center mt-2">
                    <input type="checkbox" checked={formData.vip} onChange={e => setFormData({...formData, vip: e.target.checked})} className="w-4 h-4 text-emerald-600 rounded" />
                    <span className="text-sm font-medium text-slate-700">VIP Guest</span>
                 </div>
                 <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700">Confirm Booking</button>
              </form>
           </div>
        </div>
      )}

      {isDNRModalOpen && onAddDNR && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
              <div className="p-4 bg-red-600 text-white flex justify-between items-center">
                 <h3 className="font-bold">Block List Entry</h3>
                 <button onClick={() => setIsDNRModalOpen(false)}><X size={20} className="text-white" /></button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); onAddDNR({ ...dnrForm }); setIsDNRModalOpen(false); setDnrForm({name:'',reason:'',notes:'',photo:''}); }} className="p-6 space-y-4">
                 <input required placeholder="Name" className="w-full p-2 border rounded-lg" value={dnrForm.name} onChange={e => setDnrForm({...dnrForm, name: e.target.value})} />
                 <input required placeholder="Reason" className="w-full p-2 border rounded-lg" value={dnrForm.reason} onChange={e => setDnrForm({...dnrForm, reason: e.target.value})} />
                 <textarea placeholder="Notes" className="w-full p-2 border rounded-lg" rows={3} value={dnrForm.notes} onChange={e => setDnrForm({...dnrForm, notes: e.target.value})} />
                 <div className="border-2 border-dashed p-4 text-center rounded-lg cursor-pointer hover:bg-slate-50" onClick={() => fileInputRef.current?.click()}>
                    <span className="text-xs text-slate-500">Upload Photo (Optional)</span>
                    <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => {
                       const file = e.target.files?.[0];
                       if (file) { const reader = new FileReader(); reader.onloadend = () => setDnrForm(prev => ({ ...prev, photo: reader.result as string })); reader.readAsDataURL(file); }
                    }} />
                    {dnrForm.photo && <p className="text-xs text-emerald-600 font-bold mt-1">Photo Attached</p>}
                 </div>
                 <button type="submit" className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700">Add to Block List</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default GuestList;
