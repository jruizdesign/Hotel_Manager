import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import RoomList from './components/RoomList';
import GuestList from './components/GuestList';
import Accounting from './components/Accounting';
import GeminiAssistant from './components/GeminiAssistant';
import LoginScreen from './components/LoginScreen';
import { ViewState, RoomStatus, Room, CurrentUser, UserRole, Guest } from './types';
import { StorageService } from './services/storage';
import { Wrench, Briefcase } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [currentView, setView] = useState<ViewState>('dashboard');
  
  // App State - Initialized from Persistent Storage
  const [rooms, setRooms] = useState(() => StorageService.getRooms());
  const [guests, setGuests] = useState(() => StorageService.getGuests());
  const [maintenance, setMaintenance] = useState(() => StorageService.getMaintenance());
  const [staff, setStaff] = useState(() => StorageService.getStaff());
  const [transactions, setTransactions] = useState(() => StorageService.getTransactions());
  const [history, setHistory] = useState(() => StorageService.getHistory());

  // Navigation State for External Triggers
  const [bookingRequest, setBookingRequest] = useState<{ isOpen: boolean, roomNumber?: string }>({ isOpen: false });

  // --- Auth & Permission Handlers ---

  const handleLogin = (role: UserRole) => {
    let name = 'User';
    let initials = 'U';

    if (role === 'Manager') { name = 'Sarah Connor'; initials = 'SC'; }
    if (role === 'Staff') { name = 'John Doe'; initials = 'JD'; }
    if (role === 'Contractor') { name = 'Mike Fixit'; initials = 'MF'; }

    setCurrentUser({ name, role, avatarInitials: initials });
    
    // Set default view based on role
    if (role === 'Contractor') {
      setView('maintenance');
    } else {
      setView('dashboard');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('dashboard');
  };

  // --- Data Handlers ---

  const handleRoomStatusChange = (roomId: string, newStatus: RoomStatus) => {
    const updatedRooms = rooms.map(room => 
      room.id === roomId ? { ...room, status: newStatus } : room
    );
    setRooms(updatedRooms);
    StorageService.saveRooms(updatedRooms);
  };

  const handleAddRoom = (newRoomData: Omit<Room, 'id' | 'status'>) => {
    if (currentUser?.role !== 'Manager') return; // Double check permission
    const newRoom: Room = {
      ...newRoomData,
      id: Date.now().toString(),
      status: RoomStatus.AVAILABLE
    };
    const updatedRooms = [...rooms, newRoom];
    setRooms(updatedRooms);
    StorageService.saveRooms(updatedRooms);
  };

  const handleDeleteRoom = (roomId: string) => {
    if (currentUser?.role !== 'Manager') return; // Double check permission
    const updatedRooms = rooms.filter(r => r.id !== roomId);
    setRooms(updatedRooms);
    StorageService.saveRooms(updatedRooms);
  };

  // Triggered from RoomList
  const handleBookRoom = (roomNumber: string) => {
    setView('guests');
    setBookingRequest({ isOpen: true, roomNumber });
  };

  const handleAddGuest = (newGuestData: Omit<Guest, 'id'>): boolean => {
    // Only Manager and Staff can add guests
    if (currentUser?.role === 'Contractor') return false; 

    // 1. Validate Room Existence
    const targetRoomIndex = rooms.findIndex(r => r.number === newGuestData.roomNumber);
    if (targetRoomIndex === -1) {
      return false; // Room not found
    }

    const targetRoom = rooms[targetRoomIndex];

    // 2. Validate Room Availability
    // We require the room to be Available to attach a new guest.
    if (targetRoom.status !== RoomStatus.AVAILABLE) {
      return false; // Room not available
    }

    // 3. Add Guest
    const newGuest: Guest = {
      ...newGuestData,
      id: Date.now().toString(),
    };
    
    const updatedGuests = [...guests, newGuest];
    setGuests(updatedGuests);
    StorageService.saveGuests(updatedGuests);

    // 4. Automatically update room status to Occupied if they are Checking In
    if (newGuestData.status === 'Checked In') {
      const updatedRooms = [...rooms];
      updatedRooms[targetRoomIndex] = { 
        ...targetRoom, 
        status: RoomStatus.OCCUPIED, 
        guestId: newGuest.id 
      };
      setRooms(updatedRooms);
      StorageService.saveRooms(updatedRooms);
    }

    return true;
  };

  // --- Render Logic ---

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
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
            history={history}
            onAddGuest={handleAddGuest} 
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
          </div>
        );
      case 'staff':
        if (currentUser.role === 'Contractor') return <div className="p-4 text-slate-500">Access Denied</div>;
        return (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200">
               <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Briefcase /> Staff Roster</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {staff.map(s => (
                <div key={s.id} className="border border-slate-200 rounded-lg p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                    {s.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">{s.name}</h4>
                    <p className="text-sm text-slate-500">{s.role}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${s.status === 'On Duty' ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                      <span className="text-xs text-slate-400">{s.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
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
        {/* Header Area */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 capitalize">{currentView}</h1>
            <p className="text-slate-500 text-sm">Welcome back, {currentUser.name}.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-bold text-slate-700">Oct 26, 2023</p>
              <p className="text-xs text-slate-400">Thursday</p>
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