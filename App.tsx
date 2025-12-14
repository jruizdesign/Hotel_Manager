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
import { ViewState, RoomStatus, Room, CurrentUser, UserRole, Guest, Staff, Transaction, BookingHistory, MaintenanceTicket, StoredDocument } from './types';
import { StorageService } from './services/storage';
import { Wrench, Loader2, CheckCircle, Mail, AlertTriangle } from 'lucide-react';
import { sendMaintenanceRequestEmail, sendMaintenanceResolvedEmail } from './services/emailService';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [currentView, setView] = useState<ViewState>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  
  // App State
  const [rooms, setRooms] = useState<Room[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceTicket[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [history, setHistory] = useState<BookingHistory[]>([]);
  const [documents, setDocuments] = useState<StoredDocument[]>([]);

  // Toast Notification State
  const [toast, setToast] = useState<{ message: string; subtext?: string; type?: 'success' | 'error' } | null>(null);

  // Navigation State for External Triggers
  const [bookingRequest, setBookingRequest] = useState<{ isOpen: boolean, roomNumber?: string }>({ isOpen: false });

  // --- Initial Data Load ---
  useEffect(() => {
    loadData();
  }, []);

  // Toast Timer
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fetchedRooms, fetchedGuests, fetchedMaint, fetchedStaff, fetchedTrans, fetchedHistory, fetchedDocs] = await Promise.all([
        StorageService.getRooms(),
        StorageService.getGuests(),
        StorageService.getMaintenance(),
        StorageService.getStaff(),
        StorageService.getTransactions(),
        StorageService.getHistory(),
        StorageService.getDocuments()
      ]);

      setRooms(fetchedRooms);
      setGuests(fetchedGuests);
      setMaintenance(fetchedMaint);
      setStaff(fetchedStaff);
      setTransactions(fetchedTrans);
      setHistory(fetchedHistory);
      setDocuments(fetchedDocs);
    } catch (error) {
      console.error("Failed to load application data", error);
      alert("Error loading data. If using Remote Mode, check your connection settings.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Auth & Permission Handlers ---

  const handleLogin = (user: CurrentUser) => {
    setCurrentUser(user);
    if (user.role === 'Contractor') {
      setView('maintenance');
    } else {
      setView('dashboard');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('dashboard');
  };

  const handleDataReset = async () => {
    // Reload all state from storage after a reset
    await loadData();
    setView('dashboard');
  };

  const handleCreateAdmin = async (name: string, pin: string) => {
    const newAdmin: Staff = {
      id: Date.now().toString(),
      name,
      role: 'Superuser', // Default the first user to Superuser
      status: 'On Duty',
      shift: 'Any',
      pin
    };
    const updatedStaff = [newAdmin];
    setStaff(updatedStaff);
    await StorageService.saveStaff(updatedStaff);
    
    // Auto login
    handleLogin({
      name: newAdmin.name,
      role: 'Superuser',
      avatarInitials: newAdmin.name.substring(0, 2).toUpperCase()
    });
  };

  // --- Data Handlers ---

  const handleRoomStatusChange = async (roomId: string, newStatus: RoomStatus) => {
    const updatedRooms = rooms.map(room => 
      room.id === roomId ? { ...room, status: newStatus } : room
    );
    setRooms(updatedRooms);
    await StorageService.saveRooms(updatedRooms);
  };

  const handleAddRoom = async (newRoomData: Omit<Room, 'id' | 'status'>) => {
    if (currentUser?.role !== 'Manager' && currentUser?.role !== 'Superuser') return; 
    const newRoom: Room = {
      ...newRoomData,
      id: Date.now().toString(),
      status: RoomStatus.AVAILABLE
    };
    const updatedRooms = [...rooms, newRoom];
    setRooms(updatedRooms);
    await StorageService.saveRooms(updatedRooms);
  };

  const handleUpdateRoom = async (updatedRoom: Room) => {
    if (currentUser?.role !== 'Manager' && currentUser?.role !== 'Superuser') return;
    const updatedRooms = rooms.map(r => r.id === updatedRoom.id ? updatedRoom : r);
    setRooms(updatedRooms);
    await StorageService.saveRooms(updatedRooms);
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (currentUser?.role !== 'Manager' && currentUser?.role !== 'Superuser') return;
    const updatedRooms = rooms.filter(r => r.id !== roomId);
    setRooms(updatedRooms);
    await StorageService.saveRooms(updatedRooms);
  };

  // Setup Wizard Completion
  const handleSetupComplete = async (newRooms: Omit<Room, 'id' | 'status'>[]) => {
    const createdRooms: Room[] = newRooms.map((r, idx) => ({
      ...r,
      id: `room-${Date.now()}-${idx}`,
      status: RoomStatus.AVAILABLE
    }));
    setRooms(createdRooms);
    await StorageService.saveRooms(createdRooms);
  };

  // Triggered from RoomList
  const handleBookRoom = (roomNumber: string) => {
    setView('guests');
    setBookingRequest({ isOpen: true, roomNumber });
  };

  const handleCheckOut = async (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room || !room.guestId) return;

    if (!window.confirm(`Confirm Check Out for Room ${room.number}? This will mark the room as Dirty.`)) return;

    try {
      // 1. Update Guest Status
      const todayStr = new Date().toISOString().split('T')[0];
      const updatedGuests = guests.map(g => {
        if (g.id === room.guestId) {
          return { ...g, status: 'Checked Out' as const, checkOut: todayStr };
        }
        return g;
      });

      // 2. Update Room Status
      const updatedRooms = rooms.map(r => 
        r.id === roomId ? { ...r, status: RoomStatus.DIRTY, guestId: undefined } : r
      );

      // 3. Save State
      setGuests(updatedGuests);
      setRooms(updatedRooms);

      await Promise.all([
        StorageService.saveGuests(updatedGuests),
        StorageService.saveRooms(updatedRooms)
      ]);
      
      setToast({ message: 'Check Out Complete', subtext: `Room ${room.number} is now Dirty.` });
    } catch (err) {
      console.error("Check out failed", err);
      setToast({ message: 'Check Out Failed', subtext: 'Could not save data. Please try again.', type: 'error' });
    }
  };

  // Maintenance Handlers
  const handleAddTicket = async (ticketData: Omit<MaintenanceTicket, 'id' | 'status' | 'date'>) => {
    try {
      const newTicket: MaintenanceTicket = {
        ...ticketData,
        id: Date.now().toString(),
        status: 'Pending',
        date: new Date().toISOString().split('T')[0]
      };
      
      // Update UI first
      const updatedMaintenance = [newTicket, ...maintenance];
      setMaintenance(updatedMaintenance);
      await StorageService.saveMaintenance(updatedMaintenance);

      // Trigger Email Notification with response handling
      sendMaintenanceRequestEmail(newTicket)
        .then(() => {
          setToast({
            message: 'Maintenance Team Notified',
            subtext: `Email sent for Room ${newTicket.roomNumber} (${newTicket.priority} Priority)`
          });
        })
        .catch((err) => {
          console.error("Email notification failed", err);
          // Ensure we call 'sendResponse' equivalent (UI feedback) even on failure
          setToast({
            message: 'Ticket Created',
            subtext: 'Warning: Email notification failed to send.',
            type: 'error'
          });
        });

    } catch (error) {
      console.error("Failed to add ticket", error);
      alert("System Error: Could not save maintenance ticket.");
    }
  };

  const handleResolveTicket = async (ticketId: string, cost: number, note: string) => {
     try {
       const today = new Date().toISOString().split('T')[0];
       const ticket = maintenance.find(t => t.id === ticketId);
       
       // 1. Update Ticket
       const updatedMaintenance = maintenance.map(t => 
         t.id === ticketId 
           ? { ...t, status: 'Resolved' as const, cost, completedDate: today } 
           : t
       );
       setMaintenance(updatedMaintenance);

       // 2. Create Transaction for Accounting
       let updatedTransactions = transactions;
       if (cost > 0) {
         const newTx: Transaction = {
           id: `tx-${Date.now()}`,
           date: today,
           category: 'Maintenance Cost',
           type: 'Expense',
           amount: cost,
           description: `Ticket #${ticketId} Resolution: ${note}`
         };
         updatedTransactions = [newTx, ...transactions];
         setTransactions(updatedTransactions);
       }

       await Promise.all([
         StorageService.saveMaintenance(updatedMaintenance),
         StorageService.saveTransactions(updatedTransactions)
       ]);

       // Trigger Email Notification with response handling
       if (ticket) {
          sendMaintenanceResolvedEmail(ticket, cost, note)
            .then(() => {
              setToast({
                message: 'Resolution Report Sent',
                subtext: `Manager notified of completion and cost ($${cost})`
              });
            })
            .catch((err) => {
              console.error("Email notification failed", err);
              // Ensure feedback is provided regardless of success/fail
              setToast({
                message: 'Ticket Resolved',
                subtext: 'Warning: Resolution email failed to send.',
                type: 'error'
              });
            });
       }
     } catch (error) {
       console.error("Failed to resolve ticket", error);
       alert("System Error: Could not update ticket status.");
     }
  };

  // NOTE: This function needs to return boolean for success/fail UI feedback, 
  // but it calls async functions. For simplicity in UI, we update state optimistically 
  // and trigger the save in background.
  const handleAddGuest = (newGuestData: Omit<Guest, 'id'>): boolean => {
    if (currentUser?.role === 'Contractor') return false; 

    const targetRoomIndex = rooms.findIndex(r => r.number === newGuestData.roomNumber);
    if (targetRoomIndex === -1) return false;

    const targetRoom = rooms[targetRoomIndex];
    if (targetRoom.status !== RoomStatus.AVAILABLE) return false;

    const newGuest: Guest = {
      ...newGuestData,
      id: Date.now().toString(),
      balance: 0
    };
    
    // Optimistic Update
    const updatedGuests = [...guests, newGuest];
    setGuests(updatedGuests);
    
    StorageService.saveGuests(updatedGuests)
      .catch(err => {
        console.error("Failed to save guest", err);
        setToast({ message: 'Save Failed', subtext: 'Data could not be persisted to storage.', type: 'error' });
      });

    if (newGuestData.status === 'Checked In') {
      const updatedRooms = [...rooms];
      updatedRooms[targetRoomIndex] = { 
        ...targetRoom, 
        status: RoomStatus.OCCUPIED, 
        guestId: newGuest.id 
      };
      setRooms(updatedRooms);
      
      StorageService.saveRooms(updatedRooms)
        .catch(err => {
          console.error("Failed to update room", err);
          // Note: In a real app we might want to revert state here
        });
    }

    return true;
  };

  const handleUpdateGuest = async (updatedGuest: Guest) => {
    try {
      const oldGuest = guests.find(g => g.id === updatedGuest.id);
      if (!oldGuest) return;

      // 1. Handle Room Swap if room number changed
      let currentRooms = [...rooms];
      if (oldGuest.roomNumber !== updatedGuest.roomNumber) {
        // Free old room
        const oldRoomIdx = currentRooms.findIndex(r => r.number === oldGuest.roomNumber);
        if (oldRoomIdx > -1) {
          currentRooms[oldRoomIdx] = { ...currentRooms[oldRoomIdx], status: RoomStatus.DIRTY, guestId: undefined };
        }
        
        // Occupy new room
        const newRoomIdx = currentRooms.findIndex(r => r.number === updatedGuest.roomNumber);
        if (newRoomIdx > -1) {
          // Only occupy if we are checking in or already checked in
          if (updatedGuest.status === 'Checked In') {
             currentRooms[newRoomIdx] = { ...currentRooms[newRoomIdx], status: RoomStatus.OCCUPIED, guestId: updatedGuest.id };
          }
        } else {
          alert(`Warning: Room ${updatedGuest.roomNumber} does not exist. Guest updated but room status not linked.`);
        }
      } else {
        // Room didn't change, but check if status changed (e.g. Reserved -> Checked In)
        const roomIdx = currentRooms.findIndex(r => r.number === updatedGuest.roomNumber);
        if (roomIdx > -1) {
           if (oldGuest.status === 'Reserved' && updatedGuest.status === 'Checked In') {
               currentRooms[roomIdx] = { ...currentRooms[roomIdx], status: RoomStatus.OCCUPIED, guestId: updatedGuest.id };
           }
        }
      }

      // 2. Update Guest List
      const updatedGuests = guests.map(g => g.id === updatedGuest.id ? updatedGuest : g);
      
      // 3. Save State
      setGuests(updatedGuests);
      setRooms(currentRooms);
      
      await Promise.all([
        StorageService.saveGuests(updatedGuests),
        StorageService.saveRooms(currentRooms)
      ]);
    } catch (error) {
      console.error("Failed to update guest", error);
      setToast({ message: 'Update Failed', subtext: 'Could not save guest changes.', type: 'error' });
    }
  };

  const handleAddPayment = async (guestId: string, amount: number, date: string, note: string) => {
    try {
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        date,
        amount,
        category: 'Guest Payment',
        type: 'Income',
        description: note || 'Room Payment',
        guestId
      };

      const updatedTransactions = [newTransaction, ...transactions];
      setTransactions(updatedTransactions);
      
      const updatedGuests = guests.map(g => {
        if (g.id === guestId) {
          return { ...g, balance: g.balance - amount };
        }
        return g;
      });
      setGuests(updatedGuests);

      // Save both
      await Promise.all([
        StorageService.saveTransactions(updatedTransactions),
        StorageService.saveGuests(updatedGuests)
      ]);
      setToast({ message: 'Payment Recorded', subtext: `$${amount} added to ledger.` });
    } catch (error) {
      console.error("Payment failed", error);
      setToast({ message: 'Payment Error', subtext: 'Could not save transaction.', type: 'error' });
    }
  };

  // Staff Handlers
  const handleAddStaff = async (newStaffData: Omit<Staff, 'id'>) => {
    const newMember: Staff = { ...newStaffData, id: Date.now().toString() };
    const updatedStaff = [...staff, newMember];
    setStaff(updatedStaff);
    await StorageService.saveStaff(updatedStaff);
  };

  const handleDeleteStaff = async (id: string) => {
    const updatedStaff = staff.filter(s => s.id !== id);
    setStaff(updatedStaff);
    await StorageService.saveStaff(updatedStaff);
  };

  const handleUpdateStaffStatus = async (id: string, status: Staff['status']) => {
    const updatedStaff = staff.map(s => s.id === id ? { ...s, status } : s);
    setStaff(updatedStaff);
    await StorageService.saveStaff(updatedStaff);
  };

  // Document Handlers
  const handleAddDocument = async (newDocData: Omit<StoredDocument, 'id' | 'date' | 'size'>) => {
     try {
       // Calculate approximate size from base64 length
       const sizeInBytes = Math.ceil((newDocData.fileData.length * 3) / 4);
       
       const newDoc: StoredDocument = {
         ...newDocData,
         id: `doc-${Date.now()}`,
         date: new Date().toISOString(),
         size: sizeInBytes
       };

       const updatedDocs = [newDoc, ...documents];
       setDocuments(updatedDocs);
       await StorageService.saveDocuments(updatedDocs);
       
       setToast({ message: 'Document Saved', subtext: newDoc.title });
     } catch (error) {
       console.error("Document save failed", error);
       setToast({ message: 'Upload Failed', subtext: 'Could not save document to storage.', type: 'error' });
     }
  };

  const handleDeleteDocument = async (id: string) => {
    const updatedDocs = documents.filter(d => d.id !== id);
    setDocuments(updatedDocs);
    await StorageService.saveDocuments(updatedDocs);
  };

  // --- Render Logic ---

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mb-4" />
        <p>Loading System Data...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen staff={staff} onLogin={handleLogin} onCreateAdmin={handleCreateAdmin} />;
  }

  // Construct context for AI
  const aiContext = {
    currentUserRole: currentUser.role,
    currentView,
    stats: {
      totalRooms: rooms.length,
      occupied: rooms.filter(r => r.status === RoomStatus.OCCUPIED).length,
      revenue: (currentUser.role === 'Manager' || currentUser.role === 'Superuser') ? transactions.reduce((acc, t) => t.type === 'Income' ? acc + t.amount : acc, 0) : 'Restricted'
    },
    recentTransactions: (currentUser.role === 'Manager' || currentUser.role === 'Superuser') ? transactions.slice(0, 5) : [],
    maintenanceIssues: maintenance.filter(m => m.status !== 'Resolved')
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        if (currentUser.role === 'Contractor') return <div className="p-4 text-slate-500">Access Denied</div>;
        return <Dashboard rooms={rooms} guests={guests} maintenance={maintenance} transactions={transactions} />;
      case 'rooms':
        if (currentUser.role === 'Contractor') return <div className="p-4 text-slate-500">Access Denied</div>;
        return (
          <RoomList 
            rooms={rooms} 
            onStatusChange={handleRoomStatusChange} 
            onAddRoom={handleAddRoom}
            onUpdateRoom={handleUpdateRoom}
            onDeleteRoom={handleDeleteRoom}
            onBookRoom={handleBookRoom}
            onCheckOut={handleCheckOut}
            isManager={currentUser.role === 'Manager' || currentUser.role === 'Superuser'}
          />
        );
      case 'accounting':
        if (currentUser.role !== 'Manager' && currentUser.role !== 'Superuser') return <div className="p-4 text-slate-500">Access Denied</div>;
        return <Accounting transactions={transactions} />;
      case 'guests':
        if (currentUser.role === 'Contractor') return <div className="p-4 text-slate-500">Access Denied</div>;
        return (
          <GuestList 
            guests={guests}
            rooms={rooms} // Pass rooms to calculate rates
            transactions={transactions} // Pass transactions to show billing history
            history={history}
            onAddGuest={handleAddGuest}
            onUpdateGuest={handleUpdateGuest}
            onAddPayment={handleAddPayment} // Pass payment handler
            userRole={currentUser.role}
            externalBookingRequest={bookingRequest}
            onClearExternalRequest={() => setBookingRequest({ isOpen: false })}
          />
        );
      case 'maintenance':
        return (
          <MaintenancePanel 
            tickets={maintenance}
            rooms={rooms}
            userRole={currentUser.role}
            onAddTicket={handleAddTicket}
            onResolveTicket={handleResolveTicket}
          />
        );
      case 'documents':
         if (currentUser.role === 'Contractor') return <div className="p-4 text-slate-500">Access Denied</div>;
         return (
           <DocumentCenter 
             documents={documents}
             onAddDocument={handleAddDocument}
             onDeleteDocument={handleDeleteDocument}
             userRole={currentUser.role}
           />
         );
      case 'staff':
        if (currentUser.role === 'Contractor') return <div className="p-4 text-slate-500">Access Denied</div>;
        return (
          <StaffList 
            staff={staff}
            onAddStaff={handleAddStaff}
            onDeleteStaff={handleDeleteStaff}
            onUpdateStatus={handleUpdateStaffStatus}
          />
        );
      case 'settings':
        if (currentUser.role !== 'Manager' && currentUser.role !== 'Superuser') return <div className="p-4 text-slate-500">Access Denied</div>;
        return <Settings onDataReset={handleDataReset} userRole={currentUser.role} />;
      default:
        return <div>View not implemented</div>;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 relative">
      <Sidebar 
        currentView={currentView} 
        setView={setView} 
        userRole={currentUser.role}
        onLogout={handleLogout}
      />
      
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 capitalize">{currentView}</h1>
            <p className="text-slate-500 text-sm">Welcome back, {currentUser.name}.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-bold text-slate-700">
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
              <p className="text-xs text-slate-400">
                {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold border-2 border-emerald-200 shadow-sm">
              {currentUser.avatarInitials}
            </div>
          </div>
        </header>

        {renderContent()}
      </main>

      <GeminiAssistant contextData={aiContext} />

      {/* Setup Wizard Overlay - Only shows if rooms are empty (meaning not in demo and not setup) */}
      {!isLoading && rooms.length === 0 && (currentUser.role === 'Manager' || currentUser.role === 'Superuser') && (
        <SetupWizard onComplete={handleSetupComplete} />
      )}

      {/* Global Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className={`text-white pl-4 pr-6 py-3 rounded-lg shadow-2xl flex items-center gap-3 border ${toast.type === 'error' ? 'bg-red-900 border-red-700' : 'bg-slate-900 border-slate-700'}`}>
            <div className={`p-2 rounded-full ${toast.type === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
              {toast.type === 'error' ? <AlertTriangle size={18} /> : <Mail size={18} />}
            </div>
            <div>
              <p className="font-bold text-sm">{toast.message}</p>
              {toast.subtext && <p className={`text-xs ${toast.type === 'error' ? 'text-red-200' : 'text-slate-400'}`}>{toast.subtext}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;