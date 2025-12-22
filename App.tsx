import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import RoomList from './components/RoomList';
import GuestList from './components/GuestList';
import Accounting from './components/Accounting';
import GeminiAssistant from './components/GeminiAssistant';
import LoginScreen from './components/LoginScreen';
import StaffList from './components/StaffList';
import Settings from './components/Settings';
import SetupWizard from './components/SetupWizard';
import MaintenancePanel from './components/MaintenancePanel';
import DocumentCenter from './components/DocumentCenter';
import FeatureRequestPanel from './components/FeatureRequestPanel';
import TerminalAuth from './components/TerminalAuth';
import DailyReport from './components/DailyReport';
import CheckInCheckOutPanel from './components/CheckInCheckOutPanel';
import BookingModal from './components/BookingModal';
import { ViewState, RoomStatus, Room, CurrentUser, Guest, Staff, Transaction, BookingHistory, MaintenanceTicket, StoredDocument, FeatureRequest, AttendanceLog, AttendanceAction, DNRRecord } from './types';
import { StorageService } from './services/storage';
import { subscribeToAuthChanges, logoutTerminal } from './services/firebase';
import { Wrench, Loader2, Mail, AlertTriangle, FileText, CheckCircle, Menu } from 'lucide-react'; // Added Menu icon
import { sendMaintenanceRequestEmail, sendMaintenanceResolvedEmail } from './services/emailService';
import { SpeedInsights } from "@vercel/speed-insights/next"

const App: React.FC = () => {
  const [terminalUser, setTerminalUser] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [currentView, setView] = useState<ViewState>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileNavOpen, setMobileNavOpen] = useState(false);
  
  const [rooms, setRooms] = useState<Room[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceTicket[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [history, setHistory] = useState<BookingHistory[]>([]);
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [featureRequests, setFeatureRequests] = useState<FeatureRequest[]>([]);
  const [dnrRecords, setDnrRecords] = useState<DNRRecord[]>([]);

  const [toast, setToast] = useState<{ message: string; subtext?: string; type?: 'success' | 'error' } | null>(null);
  const [bookingRequest, setBookingRequest] = useState<{ isOpen: boolean, roomNumber?: string }>({ isOpen: false });

  useEffect(() => {
    const initApp = async () => {
      await StorageService.getSettings();
      const unsubscribe = subscribeToAuthChanges((user) => {
        setTerminalUser(user);
        setAuthLoading(false);
        if (user) loadData();
      });
      return () => unsubscribe();
    };
    initApp();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fetchedRooms, fetchedGuests, fetchedMaint, fetchedStaff, fetchedAttendance, fetchedTrans, fetchedHistory, fetchedDocs, fetchedFeatures, fetchedDNR] = await Promise.all([
        StorageService.getRooms(),
        StorageService.getGuests(),
        StorageService.getMaintenance(),
        StorageService.getStaff(),
        StorageService.getAttendanceLogs(),
        StorageService.getTransactions(),
        StorageService.getHistory(),
        StorageService.getDocuments(),
        StorageService.getFeatureRequests(),
        StorageService.getDNRRecords()
      ]);

      setRooms(fetchedRooms);
      setGuests(fetchedGuests);
      setMaintenance(fetchedMaint);
      setStaff(fetchedStaff);
      setAttendanceLogs(fetchedAttendance);
      setTransactions(fetchedTrans);
      setHistory(fetchedHistory);
      setDocuments(fetchedDocs);
      setFeatureRequests(fetchedFeatures);
      setDnrRecords(fetchedDNR);
    } catch (error) {
      console.error("Failed to load application data", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (user: CurrentUser) => {
    setCurrentUser(user);
    setView(user.role === 'Contractor' ? 'maintenance' : 'dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('dashboard');
  };

  const handleLock = async () => {
    await logoutTerminal();
    setCurrentUser(null);
    setTerminalUser(null);
    setView('dashboard');
  };

  const handleDataReset = async () => {
    await loadData();
    setView('dashboard');
  };

  const handleCreateAdmin = async (name: string, pin: string) => {
    const newAdmin: Staff = { id: Date.now().toString(), name, role: 'Superuser', status: 'Off Duty', shift: 'Any', pin };
    const updatedStaff = [newAdmin, ...staff];
    setStaff(updatedStaff);
    await StorageService.saveStaff(updatedStaff);
    handleLogin({ id: newAdmin.id, name: newAdmin.name, role: 'Superuser', avatarInitials: newAdmin.name.substring(0, 2).toUpperCase() });
  };

  const handleRegisterStaff = async (staffData: Omit<Staff, 'id' | 'status'>) => {
    const newStaff: Staff = { 
      ...staffData, 
      id: Date.now().toString(), 
      status: 'Off Duty' 
    };
    const updatedStaff = [...staff, newStaff];
    setStaff(updatedStaff);
    await StorageService.saveStaff(updatedStaff);
    setToast({ 
      message: 'Account Activated', 
      subtext: `Account for ${staffData.name} is ready for login.`,
      type: 'success' 
    });
  };

  const handleUpdateAttendanceLog = async (updatedLog: AttendanceLog) => {
    const updatedLogs = attendanceLogs.map(log => log.id === updatedLog.id ? updatedLog : log);
    setAttendanceLogs(updatedLogs);
    await StorageService.saveAttendanceLogs(updatedLogs);
    setToast({ message: 'Log Updated', subtext: 'Attendance record modified by manager.' });
  };

  const generateInvoice = async (guest: Guest, room: Room) => {
    const total = room.discount ? room.price * (1 - room.discount / 100) : room.price;
    const invoiceId = `INV-${Date.now()}`;
    const invoiceHTML = `
      <div style="font-family: sans-serif; padding: 40px; border: 1px solid #eee;">
        <h1 style="color: #059669;">StaySync Hotel Invoice</h1>
        <p>Invoice ID: ${invoiceId}</p>
        <p>Date: ${new Date().toLocaleDateString()}</p>
        <hr/>
        <h3>Guest Information</h3>
        <p>Name: ${guest.name}</p>
        <p>Room: ${room.number} (${room.type})</p>
        <h3>Billing Summary</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background: #f9fafb;">
            <th style="text-align: left; padding: 10px;">Description</th>
            <th style="text-align: right; padding: 10px;">Amount</th>
          </tr>
          <tr>
            <td style="padding: 10px;">Nightly Rate (Room ${room.number})</td>
            <td style="text-align: right; padding: 10px;">$${room.price}</td>
          </tr>
          ${room.discount ? `<tr><td style="padding: 10px;">Discount (${room.discount}%)</td><td style="text-align: right; padding: 10px; color: red;">-$${(room.price * (room.discount / 100)).toFixed(2)}</td></tr>` : ''}
          <tr style="font-weight: bold; border-top: 2px solid #059669;">
            <td style="padding: 10px;">Total Due</td>
            <td style="text-align: right; padding: 10px;">$${total.toFixed(2)}</td>
          </tr>
        </table>
        <p style="margin-top: 40px; font-size: 12px; color: #6b7280;">Thank you for staying with us!</p>
      </div>
    `;

    const newDoc: StoredDocument = {
      id: `doc-${Date.now()}`,
      title: `Invoice ${invoiceId}`,
      category: 'Invoice',
      date: new Date().toISOString(),
      fileData: `data:text/html;base64,${btoa(invoiceHTML)}`,
      fileType: 'text/html',
      size: invoiceHTML.length,
      description: `Auto-generated for Guest ${guest.name}`,
      guestId: guest.id
    };

    const updatedDocs = [newDoc, ...documents];
    setDocuments(updatedDocs);
    await StorageService.saveDocuments(updatedDocs);
  };

  const generateReceipt = async (guest: Guest, amount: number, note: string) => {
    const receiptId = `RCP-${Date.now()}`;
    const receiptHTML = `
      <div style="font-family: sans-serif; padding: 40px; border: 1px solid #0891b2;">
        <h1 style="color: #0891b2;">StaySync Payment Receipt</h1>
        <p>Receipt ID: ${receiptId}</p>
        <p>Date: ${new Date().toLocaleDateString()}</p>
        <hr/>
        <h3>Guest Information</h3>
        <p>Name: ${guest.name}</p>
        <h3>Payment Detail</h3>
        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px;">
          <p style="font-size: 1.2rem; font-weight: bold; color: #0891b2;">Amount Paid: $${amount.toFixed(2)}</p>
          <p>Method/Note: ${note || 'Standard Payment'}</p>
        </div>
        <p style="margin-top: 40px; font-size: 12px; color: #6b7280;">Remaining Balance: $${guest.balance - amount}</p>
      </div>
    `;

    const newDoc: StoredDocument = {
      id: `doc-${Date.now()}`,
      title: `Receipt ${receiptId}`,
      category: 'Receipt',
      date: new Date().toISOString(),
      fileData: `data:text/html;base64,${btoa(receiptHTML)}`,
      fileType: 'text/html',
      size: receiptHTML.length,
      description: `Payment Receipt for Guest ${guest.name}`,
      guestId: guest.id
    };

    const updatedDocs = [newDoc, ...documents];
    setDocuments(updatedDocs);
    await StorageService.saveDocuments(updatedDocs);
  };

  const handleRoomStatusChange = async (roomId: string, newStatus: RoomStatus) => {
    const updatedRooms = rooms.map(room => room.id === roomId ? { ...room, status: newStatus } : room);
    setRooms(updatedRooms);
    await StorageService.saveRooms(updatedRooms);
  };

  const handleUpdateRoom = async (updatedRoom: Room) => {
    const updatedRooms = rooms.map(r => r.id === updatedRoom.id ? updatedRoom : r);
    setRooms(updatedRooms);
    await StorageService.saveRooms(updatedRooms);
  };

  const handleAddRoom = async (newRoomData: Omit<Room, 'id' | 'status'>) => {
    const newRoom: Room = { ...newRoomData, id: Date.now().toString(), status: RoomStatus.AVAILABLE };
    const updatedRooms = [...rooms, newRoom];
    setRooms(updatedRooms);
    await StorageService.saveRooms(updatedRooms);
  };

  const handleAddGuest = (newGuestData: Omit<Guest, 'id'>): boolean => {
    const targetRoomIndex = rooms.findIndex(r => r.number === newGuestData.roomNumber);
    if (targetRoomIndex === -1) return false;
    const targetRoom = rooms[targetRoomIndex];
    if (targetRoom.status !== RoomStatus.AVAILABLE) return false;

    const newGuest: Guest = { ...newGuestData, id: Date.now().toString(), balance: targetRoom.price };
    const updatedGuests = [...guests, newGuest];
    setGuests(updatedGuests);
    StorageService.saveGuests(updatedGuests);

    if (newGuestData.status === 'Checked In') {
      const updatedRooms = [...rooms];
      updatedRooms[targetRoomIndex] = { ...targetRoom, status: RoomStatus.OCCUPIED, guestId: newGuest.id };
      setRooms(updatedRooms);
      StorageService.saveRooms(updatedRooms);
    }

    generateInvoice(newGuest, targetRoom);
    setToast({ message: 'Booking Successful', subtext: 'Invoice generated and synced to storage.' });
    return true;
  };

  const handleUpdateGuest = async (updatedGuest: Guest) => {
    const updatedGuests = guests.map(g => g.id === updatedGuest.id ? updatedGuest : g);
    setGuests(updatedGuests);
    await StorageService.saveGuests(updatedGuests);
  };

  const handleAddPayment = async (guestId: string, amount: number, date: string, note: string) => {
    const guest = guests.find(g => g.id === guestId);
    if (!guest) return;

    const newTx: Transaction = { id: Date.now().toString(), date, amount, category: 'Guest Payment', type: 'Income', description: note || 'Payment', guestId };
    const updatedTransactions = [newTx, ...transactions];
    const updatedGuests = guests.map(g => g.id === guestId ? { ...g, balance: g.balance - amount } : g);
    
    setGuests(updatedGuests);
    setTransactions(updatedTransactions);
    
    await Promise.all([
      StorageService.saveTransactions(updatedTransactions), 
      StorageService.saveGuests(updatedGuests)
    ]);
    
    generateReceipt(guest, amount, note);
    setToast({ message: 'Payment Recorded', subtext: 'Receipt generated and synced to storage.' });
  };

  const handleCheckOutGuest = async (roomId: string) => {
    const targetRoom = rooms.find(r => r.id === roomId);
    if (!targetRoom || !targetRoom.guestId) return;

    const guest = guests.find(g => g.id === targetRoom.guestId);
    if (!guest) return;

    if (guest.balance > 0) {
      setToast({ 
        message: 'Checkout Blocked', 
        subtext: `Guest has $${guest.balance} outstanding balance. Log payment first.`, 
        type: 'error' 
      });
      return;
    }

    const updatedRooms = rooms.map(r => r.id === roomId ? { ...r, status: RoomStatus.DIRTY, guestId: undefined } : r);
    const updatedGuests = guests.map(g => g.id === guest.id ? { ...g, status: 'Checked Out' as const } : g);
    
    const newHistory: BookingHistory = {
      id: Date.now().toString(),
      guestId: guest.id,
      checkIn: guest.checkIn,
      checkOut: guest.checkOut || new Date().toISOString().split('T')[0], 
      roomNumber: guest.roomNumber,
      roomType: targetRoom.type,
      totalAmount: targetRoom.price,
      status: 'Completed'
    };
    const updatedHistory = [newHistory, ...history];

    setRooms(updatedRooms);
    setGuests(updatedGuests);
    setHistory(updatedHistory);

    await Promise.all([
      StorageService.saveRooms(updatedRooms),
      StorageService.saveGuests(updatedGuests),
      StorageService.saveHistory(updatedHistory)
    ]);

    setToast({ message: 'Checked Out', subtext: `Room ${targetRoom.number} marked for housekeeping.` });
  };

  const handleAttendanceAction = async (staffId: string, action: AttendanceAction, timestamp?: string, notes?: string) => {
    const staffMember = staff.find(s => s.id === staffId);
    if (!staffMember) return;
    let newStatus: Staff['status'] = staffMember.status;
    if (action === 'CLOCK_IN') newStatus = 'On Duty';
    else if (action === 'CLOCK_OUT') newStatus = 'Off Duty';
    else if (action === 'START_BREAK') newStatus = 'Break';
    else if (action === 'END_BREAK') newStatus = 'On Duty';
    const newLog: AttendanceLog = { id: `log-${Date.now()}`, staffId, staffName: staffMember.name, action, timestamp: timestamp || new Date().toISOString(), notes };
    const updatedStaff = staff.map(s => s.id === staffId ? { ...s, status: newStatus } : s);
    const updatedLogs = [newLog, ...attendanceLogs];
    setStaff(updatedStaff);
    setAttendanceLogs(updatedLogs);
    await Promise.all([StorageService.saveStaff(updatedStaff), StorageService.saveAttendanceLogs(updatedLogs)]);
    setToast({ message: 'Status Logged', subtext: action.replace('_', ' ') });
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard rooms={rooms} guests={guests} maintenance={maintenance} transactions={transactions} />;
      case 'reports': return <DailyReport guests={guests} rooms={rooms} transactions={transactions} />;
      case 'check-in-out': return <CheckInCheckOutPanel guests={guests} rooms={rooms} onUpdateGuest={handleUpdateGuest} onUpdateRoom={handleUpdateRoom} />;
      case 'rooms': return <RoomList rooms={rooms} onStatusChange={handleRoomStatusChange} onAddRoom={handleAddRoom} onUpdateRoom={loadData} onDeleteRoom={loadData} onBookRoom={(num) => setBookingRequest({ isOpen: true, roomNumber: num })} onCheckOut={handleCheckOutGuest} isManager={currentUser?.role !== 'Staff'} />;
      case 'accounting': return <Accounting transactions={transactions} guests={[]} rooms={[]} />;
      case 'guests': return <GuestList guests={guests} rooms={rooms} transactions={transactions} history={history} dnrRecords={dnrRecords} onAddGuest={handleAddGuest} onUpdateGuest={handleUpdateGuest} onAddPayment={handleAddPayment} onCheckOut={handleCheckOutGuest} onAddDNR={loadData} onDeleteDNR={loadData} userRole={currentUser?.role || 'Staff'} />;
      case 'staff': return <StaffList staff={staff} attendanceLogs={attendanceLogs} currentUserId={currentUser?.id} userRole={currentUser?.role || 'Staff'} onAddStaff={loadData} onDeleteStaff={loadData} onUpdateStatus={loadData} onAttendanceAction={handleAttendanceAction} onUpdateAttendanceLog={handleUpdateAttendanceLog} />;
      case 'maintenance': return <MaintenancePanel tickets={maintenance} rooms={rooms} userRole={currentUser?.role || 'Staff'} onAddTicket={loadData} onResolveTicket={loadData} />;
      case 'documents': return <DocumentCenter documents={documents} onAddDocument={loadData} onDeleteDocument={loadData} userRole={currentUser?.role || 'Staff'} />;
      case 'features': return <FeatureRequestPanel requests={featureRequests} onAddRequest={loadData} onUpdateRequest={loadData} onDeleteRequest={loadData} userRole={currentUser?.role || 'Staff'} userName={currentUser?.name || ''} />;
      case 'settings': return <Settings onDataReset={handleDataReset} userRole={currentUser?.role || 'Staff'} />;
      default: return <div>View not implemented</div>;
    }
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-emerald-500"><Loader2 className="animate-spin" /></div>;
  if (!terminalUser) return <TerminalAuth />;
  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-emerald-600" /></div>;
  if (!currentUser) return <LoginScreen staff={staff} onLogin={handleLogin} onCreateAdmin={handleCreateAdmin} onRegisterStaff={handleRegisterStaff} />;

  return (
    <div className="flex min-h-screen bg-slate-50 relative">
      <Sidebar 
        currentView={currentView} 
        setView={setView} 
        userRole={currentUser.role} 
        onLogout={handleLogout} 
        onLock={handleLock} 
        isMobileNavOpen={isMobileNavOpen}
        setMobileNavOpen={setMobileNavOpen}
      />
      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileNavOpen(true)} className="md:hidden p-2 text-slate-600 hover:text-slate-900">
              <Menu size={24} />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-800 capitalize">{currentView.replace('-',' ')}</h1>
              <p className="text-slate-500 text-sm hidden md:block">Welcome back, {currentUser.name}.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className="text-sm font-bold text-slate-700">{new Date().toLocaleDateString()}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold border-2 border-emerald-200 shadow-sm">
              {currentUser.avatarInitials}
            </div>
          </div>
        </header>
        {renderContent()}
      </main>
      <GeminiAssistant contextData={{ rooms, guests, maintenance }} />
      {toast && <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-bottom-5 p-4 rounded-xl shadow-2xl flex items-center gap-3 border ${toast.type === 'error' ? 'bg-red-900 border-red-800 text-white' : 'bg-slate-900 border-slate-800 text-white'}`}>
        {toast.type === 'error' ? <AlertTriangle className="text-red-400" /> : <CheckCircle className="text-emerald-400" />}
        <div><p className="font-bold text-sm">{toast.message}</p><p className="text-xs text-slate-400">{toast.subtext}</p></div>
      </div>}
      <BookingModal 
        isOpen={bookingRequest.isOpen}
        onClose={() => setBookingRequest({ isOpen: false })}
        onBook={handleAddGuest}
        rooms={rooms}
        initialRoomNumber={bookingRequest.roomNumber}
      />
    </div>
  );
};

export default App;
