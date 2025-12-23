import React, { useState, useEffect, useRef } from 'react';
import { Guest, UserRole, BookingHistory, Room, Transaction, RoomStatus, DNRRecord } from '../types';
import { 
  Users, Plus, X, Search, Star, AlertCircle, History, 
  DollarSign, CheckCircle2, Ban, LogOut, Mail, Sparkles, 
  Send, ChevronRight, RefreshCw, Phone, AlertTriangle, FileText, ArrowLeft,
  Receipt
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
    guest.roomNumber && guest.roomNumber.includes(searchTerm) ||
    guest.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredDNR = dnrRecords.filter(record => 
    record.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getGuestTransactions = (guestId: string) => transactions.filter(t => t.guestId === guestId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
    const context = `Guest: ${selectedGuest.name}, Room: ${selectedGuest.roomNumber}, Balance: $${selectedGuest.balance}`;
    const prompt = `Write a professional email for a hotel guest. Context: ${context}. Topic: ${topic}. Output: Only the email content (Subject, Body).`;
    const response = await generateAIResponse(prompt, context);
    const [subject, ...body] = response.split('\n');
    setEmailSubject(subject.replace(/subject:/i, '').trim());
    setEmailBody(body.join('\n').trim());
    setIsGeneratingAI(false);
  };

  const sendEmail = async () => {
    if (!selectedGuest?.email) return;
    setIsSendingEmail(true);
    try {
      const response = await fetch(`${API_URL}/send-email`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: selectedGuest.email, subject: emailSubject, body: emailBody }) });
      if (response.ok) {
        alert("Email sent successfully!");
        setEmailSubject(''); setEmailBody(''); setAiPrompt('');
      } else { alert("Failed to send email."); }
    } catch (e) { console.error(e); alert("Error sending email.");
    } finally { setIsSendingEmail(false); }
  };

  const renderGuestList = () => (
    <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[calc(100vh-200px)] md:h-[calc(100vh-140px)] ${selectedGuestId ? 'hidden md:flex' : 'flex'}`}>
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h3 className="font-bold text-slate-700">Guest Directory ({filteredGuests.length})</h3>
        <button onClick={() => { resetBookingForm(); setIsBookingModalOpen(true); }} className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm">
          <Plus size={18} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filteredGuests.map(guest => (
          <div key={guest.id} onClick={() => setSelectedGuestId(guest.id)} className={`p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 ${selectedGuestId === guest.id ? 'bg-emerald-50 border-l-4 border-l-emerald-500 pl-3' : 'pl-4'}`}>
            <div className="flex justify-between items-center">
              <div>
                <p className={`font-bold text-sm ${selectedGuestId === guest.id ? 'text-emerald-900' : 'text-slate-800'}`}>{guest.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-500 font-mono">#{guest.roomNumber}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${guest.status === 'Checked In' ? 'bg-emerald-100 text-emerald-700' : guest.status === 'Reserved' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>{guest.status}</span>
                  {guest.vip && <Star size={10} className="text-amber-400 fill-amber-400" />}
                  {guest.balance > 0 && <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>}
                </div>
              </div>
              <ChevronRight size={16} className={`text-slate-400 md:hidden`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderGuestDetail = () => {
    if (!selectedGuest) {
      return (
        <div className="flex-1 hidden md:flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-2xl border-y border-r border-slate-200">
          <Users size={48} className="mb-4 text-slate-300" />
          <p>Select a guest to view profile</p>
        </div>
      );
    }

    const historyItems = history.filter(h => h.guestId === selectedGuest.id);
    const hasBalance = selectedGuest.balance > 0;

    return (
      <div className={`flex-[2] bg-white md:rounded-r-2xl border-y border-r border-slate-200 h-[calc(100vh-100px)] md:h-[calc(100vh-140px)] overflow-y-auto flex flex-col ${selectedGuestId ? 'flex' : 'hidden md:flex'}`}>
         <div className="p-4 md:p-6 border-b border-slate-100">
            <div className="flex justify-between items-start mb-4">
               <div className="flex items-center gap-4">
                  <button onClick={() => setSelectedGuestId(null)} className="md:hidden p-2 -ml-2 text-slate-500"><ArrowLeft size={20} /></button>
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-slate-100 flex items-center justify-center text-xl md:text-2xl font-bold text-slate-500">
                    {selectedGuest.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-lg md:text-2xl font-bold text-slate-800 flex items-center gap-2">
                      {selectedGuest.name}
                      {selectedGuest.vip && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-bold"><Star size={10} /></span>}
                    </h2>
                    <div className="flex flex-col md:flex-row md:gap-4 text-sm text-slate-500 mt-1">
                      <span className="flex items-center gap-1"><Mail size={14} /> {selectedGuest.email}</span>
                      <span className="flex items-center gap-1"><Phone size={14} /> {selectedGuest.phone}</span>
                    </div>
                  </div>
               </div>
               {selectedGuest.status === 'Checked In' && (
                 <button onClick={handleCheckOutGuest} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border ${hasBalance ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-600 text-white'}`}>
                   <LogOut size={14} /> 
                   <span className="hidden md:inline">{hasBalance ? "Pay First" : "Check Out"}</span>
                 </button>
               )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mt-4">
               <div className="p-3 bg-slate-50 rounded-lg"><p className="text-[10px] uppercase font-bold text-slate-400">Room</p><p className="font-mono font-bold text-base md:text-lg text-slate-800">{selectedGuest.roomNumber}</p></div>
               <div className="p-3 bg-slate-50 rounded-lg col-span-2 md:col-span-1"><p className="text-[10px] uppercase font-bold text-slate-400">Dates</p><p className="font-medium text-xs md:text-sm text-slate-800">{new Date(selectedGuest.checkIn).toLocaleDateString()} - {selectedGuest.checkOut ? new Date(selectedGuest.checkOut).toLocaleDateString() : 'Present'}</p></div>
               <div className={`p-3 rounded-lg border ${hasBalance ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}><p className="text-[10px] uppercase font-bold text-slate-400">Balance</p><p className={`font-bold text-base md:text-lg ${hasBalance ? 'text-red-500' : 'text-emerald-600'}`}>${selectedGuest.balance}</p></div>
            </div>
         </div>

         <div className="flex-1 p-4 md:p-6 space-y-6 text-sm">
            <section className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100">
               <h3 className="font-bold text-indigo-900 flex items-center gap-2 mb-3"><Sparkles size={16} /> AI Communicator</h3>
               {!emailBody ? (
                 <div className="space-y-3">
                    <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2">
                       <button onClick={() => generateEmailDraft("Welcome")} className="whitespace-nowrap px-3 py-1.5 bg-white border rounded-full text-xs hover:bg-indigo-50">👋 Welcome</button>
                       {hasBalance && <button onClick={() => generateEmailDraft("Payment reminder")} className="whitespace-nowrap px-3 py-1.5 bg-white border border-red-200 text-red-700 rounded-full text-xs hover:bg-red-50">💸 Reminder</button>}
                       <button onClick={() => generateEmailDraft("Feedback request")} className="whitespace-nowrap px-3 py-1.5 bg-white border rounded-full text-xs hover:bg-indigo-50">⭐ Feedback</button>
                    </div>
                    <div className="relative">
                       <input type="text" placeholder="Or type your own prompt..." className="w-full pl-3 pr-10 py-2 bg-white border rounded-lg text-sm" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && generateEmailDraft(aiPrompt)} />
                       <button onClick={() => generateEmailDraft(aiPrompt)} disabled={isGeneratingAI || !aiPrompt} className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 text-white rounded-md"><Sparkles size={16} /></button>
                    </div>
                 </div>
               ) : (
                 <div className="animate-in fade-in">
                    <input type="text" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} className="w-full font-bold bg-transparent border-b py-1" />
                    <textarea rows={5} value={emailBody} onChange={(e) => setEmailBody(e.target.value)} className="w-full mt-2 text-slate-600 bg-slate-50/80 rounded-lg p-2" />
                    <div className="flex gap-2 mt-2">
                       <button onClick={() => { setEmailBody(''); setEmailSubject(''); }} className="flex-1 py-2 text-slate-500 text-sm font-medium">Discard</button>
                       <button onClick={sendEmail} disabled={!selectedGuest.email || isSendingEmail} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm flex justify-center items-center gap-2"><Send size={16} /> Send</button>
                    </div>
                 </div>
               )}
            </section>

            <section>
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Receipt size={16} className="text-slate-400" /> Billing</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <form onSubmit={handlePaymentSubmit} className="space-y-3">
                    <input type="number" step="0.01" min="0" placeholder="Amount" required className="w-full p-2 border rounded-lg" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} />
                    <input type="text" placeholder="Payment Note (e.g. Cash)" className="w-full p-2 border rounded-lg" value={paymentNote} onChange={e => setPaymentNote(e.target.value)} />
                    <button type="submit" className="w-full bg-slate-800 text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2"><DollarSign size={14}/> Log Payment</button>
                 </form>
                 <div className="bg-slate-50 rounded-lg p-3 border max-h-40 overflow-y-auto">
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">History</h4>
                    <div className="space-y-2">
                       {getGuestTransactions(selectedGuest.id).map(t => (
                         <div key={t.id} className="flex justify-between items-center text-xs">
                           <span className="flex items-center gap-2"><CheckCircle2 size={12} className="text-emerald-500" />{t.description}</span>
                           <span className="font-mono font-bold text-emerald-600">-${t.amount}</span>
                         </div>
                       ))}
                       {getGuestTransactions(selectedGuest.id).length === 0 && <p className="text-xs text-slate-400 italic">No payments logged.</p>}
                    </div>
                 </div>
              </div>
            </section>
            
            {historyItems.length > 0 && (
              <section>
                 <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><History size={16} className="text-slate-400" /> Stay History</h3>
                 <div className="space-y-2">
                   {historyItems.map(h => (
                     <div key={h.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border text-sm">
                        <span>{h.checkIn} — {h.checkOut}</span>
                        <div className="flex gap-4 text-slate-500"><span>Room {h.roomNumber}</span><span className="font-mono">${h.totalAmount}</span></div>
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
    <div className="h-full flex flex-col space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
         <div className="bg-white p-4 rounded-xl border shadow-sm"><p className="text-xs text-slate-500 uppercase font-bold">Guests</p><p className="text-2xl font-bold">{guests.length}</p></div>
         <div className="bg-white p-4 rounded-xl border shadow-sm"><p className="text-xs text-slate-500 uppercase font-bold">Arrivals</p><p className="text-2xl font-bold text-blue-600">{guests.filter(g => g.checkIn === new Date().toISOString().split('T')[0]).length}</p></div>
         <div className="bg-white p-4 rounded-xl border shadow-sm"><p className="text-xs text-slate-500 uppercase font-bold">Departures</p><p className="text-2xl font-bold text-amber-500">{guests.filter(g => g.checkOut === new Date().toISOString().split('T')[0]).length}</p></div>
         <div className="bg-white p-4 rounded-xl border shadow-sm"><p className="text-xs text-slate-500 uppercase font-bold">Balances</p><p className="text-2xl font-bold text-red-500">{guests.filter(g => g.balance > 0).length}</p></div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
         <div className="flex gap-4 self-start">
             <button onClick={() => setActiveTab('directory')} className={`text-sm font-bold pb-1 ${activeTab === 'directory' ? 'text-slate-800 border-b-2' : 'text-slate-400'}`}>Directory</button>
             <button onClick={() => setActiveTab('dnr')} className={`text-sm font-bold pb-1 ${activeTab === 'dnr' ? 'text-red-600 border-b-2 border-red-500' : 'text-slate-400'}`}>Blocked</button>
         </div>
         <div className="relative w-full md:w-auto">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
             <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 w-full md:w-64"/>
         </div>
      </div>

      <div className="flex-1 relative">
        {activeTab === 'directory' ? (
          <div className="md:flex md:items-start h-full">
             {renderGuestList()}
             {renderGuestDetail()}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold flex items-center gap-2"><Ban className="text-red-500" /> Do Not Rent List</h3>
              <button onClick={() => setIsDNRModalOpen(true)} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold">Add</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDNR.map(record => (
                <div key={record.id} className="border rounded-lg p-4 flex gap-4 items-start">
                   {record.photo ? <img src={record.photo} className="w-16 h-16 rounded-lg object-cover" /> : <div className="w-16 h-16 rounded-lg bg-slate-100"></div>}
                   <div>
                      <p className="font-bold">{record.name}</p>
                      <p className="text-xs text-red-500 font-bold uppercase">{record.reason}</p>
                      <p className="text-xs text-slate-500 mt-1">{record.notes}</p>
                      {onDeleteDNR && <button onClick={() => onDeleteDNR(record.id)} className="text-xs text-slate-400 hover:text-red-500 mt-1 underline">Remove</button>}
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {isBookingModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-xl w-full max-w-lg">
              <div className="p-4 border-b flex justify-between items-center"><h3 className="font-bold">New Reservation</h3><button onClick={() => setIsBookingModalOpen(false)}><X size={20} /></button></div>
              <form onSubmit={handleBookingSubmit} className="p-6 space-y-4">
                 <div className="grid grid-cols-2 gap-4 text-sm">
                    <input required placeholder="Guest Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    <input required placeholder="Email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    <input required placeholder="Phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    <select required value={formData.roomNumber} onChange={e => setFormData({...formData, roomNumber: e.target.value})}>
                       <option value="">Select Room</option>
                       {rooms.filter(r => r.status === 'Available' || r.number === formData.roomNumber).map(r => <option key={r.id} value={r.number}>{r.number} ({r.type})</option>)}
                    </select>
                    <div className="col-span-2"><label>Check In</label><input type="date" required value={formData.checkIn} onChange={e => setFormData({...formData, checkIn: e.target.value})} /></div>
                    <div className="col-span-2"><label>Check Out</label><input type="date" required value={formData.checkOut} onChange={e => setFormData({...formData, checkOut: e.target.value})} /></div>
                    <div className="col-span-2 flex items-center gap-2"><input type="checkbox" checked={formData.vip} onChange={e => setFormData({...formData, vip: e.target.checked})} /><label>VIP Guest</label></div>
                 </div>
                 <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold">Confirm Booking</button>
              </form>
           </div>
        </div>
      )}

      {isDNRModalOpen && onAddDNR && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-xl w-full max-w-md">
              <div className="p-4 bg-red-600 text-white"><h3 className="font-bold">Block List Entry</h3></div>
              <form onSubmit={(e) => { e.preventDefault(); onAddDNR({ ...dnrForm }); setIsDNRModalOpen(false); setDnrForm({name:'',reason:'',notes:'',photo:''}); }} className="p-6 space-y-4">
                 <input required placeholder="Name" value={dnrForm.name} onChange={e => setDnrForm({...dnrForm, name: e.target.value})} />
                 <input required placeholder="Reason" value={dnrForm.reason} onChange={e => setDnrForm({...dnrForm, reason: e.target.value})} />
                 <textarea placeholder="Notes" rows={3} value={dnrForm.notes} onChange={e => setDnrForm({...dnrForm, notes: e.target.value})} />
                 <div className="border-2 border-dashed p-4 text-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <span>Upload Photo</span><input type="file" ref={fileInputRef} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if(f){const r=new FileReader();r.onloadend=()=>setDnrForm(p=>({...p,photo:r.result as string}));r.readAsDataURL(f);}}} />
                 </div>
                 <button type="submit" className="w-full bg-red-600 text-white py-3 rounded-lg font-bold">Add to Block List</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default GuestList;
