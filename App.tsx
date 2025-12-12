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
import { ViewState, RoomStatus, Room, CurrentUser, UserRole, Guest, Staff, Transaction, BookingHistory, MaintenanceTicket } from './types';
import { StorageService } from './services/storage';
import { Wrench, Loader2 } from 'lucide-react';

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

  // Navigation State for External Triggers
  const [bookingRequest, setBookingRequest] = useState<{ isOpen: boolean, roomNumber?: string }>({ isOpen: false });

  // --- Realtime Data Sync ---
  useEffect(() => {
    // Setup listeners
    const unsubRooms = StorageService.subscribeRooms(setRooms);
    const unsubGuests = StorageService.subscribeGuests(setGuests);
    const unsubStaff = StorageService.subscribeStaff(setStaff);
    const unsubMaint = StorageService.subscribeMaintenance(setMaintenance);
    const unsubTrans = StorageService.subscribeTransactions(setTransactions);
    const unsubHistory = StorageService.subscribeHistory(setHistory);

    // Stop loading once listeners are attached (data comes in async)
    // In a real app we might wait for the first snapshot, but this is fast enough
    setTimeout(() => setIsLoading(false), 800);

    return () => {
      unsubRooms();
      unsubGuests();
      unsubStaff();
      unsubMaint();
      unsubTrans();
      unsubHistory();
    };
  }, []);

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

  const handleCreateAdmin = async (name: string, pin: string) => {
    const newAdmin: Staff = {
      id: Date.now().toString(),
      name,
      role: 'Manager',
      status: 'On Duty',
      shift: 'Any',
      pin
    };
    await StorageService.addStaff(newAdmin);
    
    // Auto login
    handleLogin({
      name: newAdmin.name,
      role: 'Manager',
      avatarInitials: newAdmin.name.substring(0, 2).toUpperCase()
    });
  };

  // --- Data Handlers (Atomic Operations) ---

  const handleRoomStatusChange = async (roomId: string, newStatus: RoomStatus) => {
    await StorageService.updateRoom(roomId, { status: newStatus });
  };

  const handleAddRoom = async (newRoomData: Omit<Room, 'id' | 'status'>) => {
    if (currentUser?.role !== 'Manager') return; 
    const newRoom: Room = {
      ...newRoomData,
      id: Date.now().toString(),
      status: RoomStatus.AVAILABLE
    };
    await StorageService.addRoom(newRoom);
  };

  const handleUpdateRoom = async (updatedRoom: Room) => {
    if (currentUser?.role !== 'Manager') return;
    await StorageService.updateRoom(updatedRoom.id, updatedRoom);
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (currentUser?.role !== 'Manager') return;
    await StorageService.deleteRoom(roomId);
  };

  // Triggered from RoomList
  const handleBookRoom = (roomNumber: string) => {
    setView('guests');
    setBookingRequest({ isOpen: true, roomNumber });
  };

  const handleAddGuest = (newGuestData: Omit<Guest, 'id'>): boolean => {
    if (currentUser?.role === 'Contractor') return false; 

    // Find room to validate status
    const targetRoom = rooms.find(r => r.number === newGuestData.roomNumber);
    if (!targetRoom) return false;
    if (targetRoom.status !== RoomStatus.AVAILABLE && newGuestData.status === 'Checked In') return false;

    const newGuest: Guest = {
      ...newGuestData,
      id: Date.now().toString(),
      balance: 0
    };
    
    // Perform updates
    StorageService.addGuest(newGuest).catch(err => console.error(err));

    if (newGuestData.status === 'Checked In') {
      StorageService.updateRoom(targetRoom.id, {
        status: RoomStatus.OCCUPIED,
        guestId: newGuest.id
      });
    }

    return true;
  };

  const handleAddPayment = async (guestId: string, amount: number, date: string, note: string) => {
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      date,
      amount,
      category: 'Guest Payment',
      type: 'Income',
      description: note || 'Room Payment',
      guestId
    };

    await StorageService.addTransaction(newTransaction);
    
    // Update Guest Balance
    const guest = guests.find(g => g.id === guestId);
    if (guest) {
      await StorageService.updateGuest(guestId, { balance: guest.balance - amount });
    }
  };

  // Staff Handlers
  const handleAddStaff = async (newStaffData: Omit<Staff, 'id'>) => {
    const newMember: Staff = { ...newStaffData, id: Date.now().toString() };
    await StorageService.addStaff(newMember);
  };

  const handleDeleteStaff = async (id: string) => {
    await StorageService.deleteStaff(id);
  };

  const handleUpdateStaffStatus = async (id: string, status: Staff['status']) => {
    await StorageService.updateStaff(id, { status });
  };

  // --- Render Logic ---

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mb-4" />
        <p>Connecting to Hotel Database...</p>
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
      revenue: currentUser.role === 'Manager' ? transactions.reduce((acc, t) => t.type === 'Income' ? acc + t.amount : acc, 0) : 'Restricted'
    },
    recentTransactions: currentUser.role === 'Manager' ? transactions.slice(0, 5) : [],
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
            isManager={currentUser.role === 'Manager'}
          />
        );
      case 'accounting':
        if (currentUser.role !== 'Manager') return <div className="p-4 text-slate-500">Access Denied</div>;
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
            onAddPayment={handleAddPayment} // Pass payment handler
            userRole={currentUser.role}
            externalBookingRequest={bookingRequest}
            onClearExternalRequest={() => setBookingRequest({ isOpen: false })}
          />
        );
      case 'maintenance':
        // Everyone can view maintenance
        return (
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
               <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Wrench /> Maintenance Tickets</h2>
               {currentUser.role === 'Contractor' && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">External Access</span>}
            </div>
            {maintenance.length === 0 ? (
               <div className="p-12 text-center text-slate-400">No active maintenance tickets</div>
            ) : (
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-800 font-semibold uppercase">
                  <tr>
                    <th className="px-6 py-4">Room</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4">Priority</th>
                    <th className="px-6 py-4">Status</th>
                    {currentUser.role !== 'Contractor' && <th className="px-6 py-4">Reported By</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {maintenance.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-bold">{m.roomNumber}</td>
                      <td className="px-6 py-4">{m.description}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${m.priority === 'High' ? 'bg-red-100 text-red-700' : 'bg-slate-100'}`}>
                          {m.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">{m.status}</td>
                      {currentUser.role !== 'Contractor' && <td className="px-6 py-4">{m.reportedBy}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
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
        if (currentUser.role !== 'Manager') return <div className="p-4 text-slate-500">Access Denied</div>;
        // Pass dummy or new handler for settings reset
        return <Settings onDataReset={() => window.location.reload()} />;
      default:
        return <div>View not implemented</div>;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
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
    </div>
  );
};

export default App;