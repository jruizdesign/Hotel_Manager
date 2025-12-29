import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import RoomDashboard from './components/RoomDashboard';
import GuestList from './components/GuestList';
import MaintenancePanel from './components/MaintenancePanel';
import StaffList from './components/StaffList';
import Accounting from './components/Accounting';
import DocumentCenter from './components/DocumentCenter';
import FeatureRequestPanel from './components/FeatureRequestPanel';
import Settings from './components/Settings';
import DailyReport from './components/DailyReport';
import CheckInCheckOutPanel from './components/CheckInCheckOutPanel';
import LoginScreen from './components/LoginScreen';
import SetupWizard from './components/SetupWizard';
import TerminalAuth from './components/TerminalAuth';
import BookingModal from './components/BookingModal';
import RoomManagementModal from './components/RoomManagementModal';
import { 
    Room, Guest, MaintenanceTicket, Staff, Transaction, StoredDocument, 
    FeatureRequest, DNRRecord, ViewState, CurrentUser, AppSettings,
    RoomStatus,
    RoomType, BookingHistory, SentEmail
} from './types';
import * as db from './services/db';
import { Menu } from 'lucide-react';

const App: React.FC = () => {
    const [view, setView] = useState<ViewState>('dashboard');
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [isSetupComplete, setIsSetupComplete] = useState<boolean | null>(null);
    const [showTerminalAuth, setShowTerminalAuth] = useState(false);
    const [isMobileNavOpen, setMobileNavOpen] = useState(false);

    const [rooms, setRooms] = useState<Room[]>([]);
    const [guests, setGuests] = useState<Guest[]>([]);
    const [maintenanceTickets, setMaintenanceTickets] = useState<MaintenanceTicket[]>([]);
    const [staff, setStaff] = useState<Staff[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [documents, setDocuments] = useState<StoredDocument[]>([]);
    const [featureRequests, setFeatureRequests] = useState<FeatureRequest[]>([]);
    const [dnrList, setDnrList] = useState<DNRRecord[]>([]);
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [bookingHistory, setBookingHistory] = useState<BookingHistory[]>([]);
    const [sentEmails, setSentEmails] = useState<SentEmail[]>([]);

    // Modal States
    const [isBookingModalOpen, setBookingModalOpen] = useState(false);
    const [isRoomManagementModalOpen, setRoomManagementModalOpen] = useState(false);
    const [selectedRoomForBooking, setSelectedRoomForBooking] = useState<string | undefined>(undefined);
    const [editingRoom, setEditingRoom] = useState<Partial<Room> | null>(null);

    const fetchInitialData = useCallback(async () => {
        const setupDone = await db.isSetupComplete();
        setIsSetupComplete(setupDone);
        if(setupDone) {
            const storedSettings = await db.getSettings();
            setSettings(storedSettings);
            // Always fetch staff list for PIN login
            setStaff(await db.getStaff());
        }
    }, []);

    const fetchLoggedInData = useCallback(async () => {
        if (!currentUser) return;
        setRooms(await db.getRooms());
        setGuests(await db.getGuests());
        setMaintenanceTickets(await db.getMaintenanceTickets());
        setTransactions(await db.getTransactions());
        setDocuments(await db.getDocuments());
        setFeatureRequests(await db.getFeatureRequests());
        setDnrList(await db.getDNRList());
        // setBookingHistory(await db.getHistory());
        setSentEmails(await db.getSentEmails());
    }, [currentUser]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    useEffect(() => {
        if (currentUser) {
            fetchLoggedInData();
        }
    }, [currentUser, fetchLoggedInData]);

    const handleLogin = (user: CurrentUser) => {
        setCurrentUser(user);
    };

    const handleLogout = () => {
        setCurrentUser(null);
        setView('dashboard');
    };
    
    const handleSetupComplete = async (rooms: Omit<Room, 'id' | 'status'>[], admin: Omit<Staff, 'id'>) => {
        const roomsToSave: Room[] = rooms.map(room => ({ ...room, id: crypto.randomUUID(), status: RoomStatus.AVAILABLE }));
        await db.addRooms(roomsToSave);
        const newAdmin = await db.addStaff(admin);
        await db.markSetupComplete();
        await fetchInitialData(); // Re-fetch initial data to update setup status and staff list
        handleLogin({ id: newAdmin.id, name: newAdmin.name, role: newAdmin.role, email: newAdmin.email || '' }); // Auto-login the new admin
    };

    const handleUpdate = useCallback(async () => {
      // A generic update function that re-fetches all data for the logged-in user
      await fetchLoggedInData();
    }, [fetchLoggedInData]);

    // Room Management
    const handleOpenRoomManager = (room: Partial<Room> | null = null) => { setEditingRoom(room); setRoomManagementModalOpen(true); };
    const handleSaveRooms = async (newRooms: Partial<Room>[]) => { await db.addRooms(newRooms as Room[]); await handleUpdate(); };
    const handleUpdateRoom = async (roomUpdate: Partial<Room>) => { if(roomUpdate.id) { await db.updateRoom(roomUpdate.id, roomUpdate); await handleUpdate(); } };
    const handleDeleteRoom = async (roomId: string) => { await db.deleteRoom(roomId); await handleUpdate(); };

    // Guest Management
    const handleAddGuest = async (guestData: Omit<Guest, 'id'>) => { const success = await db.addGuest({ ...guestData, id: crypto.randomUUID() } as Guest); if(success) await handleUpdate(); return success; };
    const handleUpdateGuest = async (guestUpdate: Partial<Guest>) => { if(guestUpdate.id) { await db.updateGuest(guestUpdate.id, guestUpdate); await handleUpdate(); } };
    const handleCheckOut = async (roomId: string) => { await db.checkOutGuest(roomId); await handleUpdate(); };

    // DNR Management
    const handleAddDNR = async (record: Omit<DNRRecord, 'id' | 'dateAdded'>) => { await db.addDNR(record); await handleUpdate(); };
    const handleDeleteDNR = async (id: string) => { await db.deleteDNR(id); await handleUpdate(); };

    // Payment
    const handleAddPayment = async (guestId: string, amount: number, date: string, note: string) => { await db.addPayment(guestId, amount, date, note); await handleUpdate(); };
    
    // Document Management
    const handleAddDocument = async (doc: Omit<StoredDocument, 'id' | 'date' | 'size'>) => {
        const newDocument: Omit<StoredDocument, 'id'> = {
            ...doc,
            date: new Date().toISOString(),
            size: 0 // Placeholder, will be calculated in db service or determined by storage service
        };
        await db.addDocument(newDocument as StoredDocument);
        await handleUpdate();
    };
    const handleDeleteDocument = async (id: string) => {
        await db.deleteDocument(id);
        await handleUpdate();
    };

    // Generic open booking modal
    const handleOpenBookingModal = (roomNumber?: string) => {
      setSelectedRoomForBooking(roomNumber);
      setBookingModalOpen(true);
    };


    const renderView = () => {
        if (!currentUser) return null;
        switch (view) {
            case 'dashboard': return <Dashboard rooms={rooms} guests={guests} tickets={maintenanceTickets} transactions={transactions} />;
            case 'rooms': return <RoomDashboard rooms={rooms} guests={guests} onBook={handleOpenBookingModal} onEditRoom={handleOpenRoomManager} onAddNewRoom={() => handleOpenRoomManager()} />;
            case 'guests': return <GuestList 
                                        guests={guests} rooms={rooms} transactions={transactions} dnrRecords={dnrList} sentEmails={sentEmails}
                                        onAddGuest={handleAddGuest} onUpdateGuest={handleUpdateGuest as any} onAddPayment={handleAddPayment}
                                        onCheckOut={handleCheckOut} onAddDNR={handleAddDNR} onDeleteDNR={handleDeleteDNR}
                                        userRole={currentUser.role} 
                                     />;
            case 'maintenance': return <MaintenancePanel tickets={maintenanceTickets} rooms={rooms} onUpdate={handleUpdate} currentUser={currentUser}/>;
            case 'staff': return <StaffList staff={staff} onUpdate={handleUpdate} currentUser={currentUser} />;
            case 'accounting': return <Accounting transactions={transactions} onUpdate={handleUpdate} guests={guests} rooms={rooms}/>;
            case 'documents': return <DocumentCenter documents={documents} onAddDocument={handleAddDocument} onDeleteDocument={handleDeleteDocument} userRole={currentUser.role}/>;
            case 'features': return <FeatureRequestPanel requests={featureRequests} onAddRequest={async (req) => {await db.addFeatureRequest(req, currentUser.name); await handleUpdate()}} onUpdateRequest={async (req) => {if(req.id) {await db.updateFeatureRequest(req.id, req); await handleUpdate()}}} onDeleteRequest={async (id) => {await db.deleteFeatureRequest(id); await handleUpdate()}} userRole={currentUser.role} userName={currentUser.name}/>;
            case 'settings': return <Settings onDataReset={handleUpdate} userRole={currentUser.role}/>;
            case 'reports': return <DailyReport rooms={rooms} guests={guests} transactions={transactions} />;
            case 'check-in-out': return <CheckInCheckOutPanel guests={guests} rooms={rooms} onUpdateGuest={handleUpdateGuest} onUpdateRoom={handleUpdateRoom} />;
            default: return <Dashboard rooms={rooms} guests={guests} tickets={maintenanceTickets} transactions={transactions} />;
        }
    };

    if (isSetupComplete === null) {
        return <div>Loading...</div>; // Or a proper splash screen
    }

    if (!isSetupComplete) {
        return <SetupWizard onSetupComplete={handleSetupComplete} />;
    }

    if (!currentUser) {
        return <LoginScreen onLogin={handleLogin} staff={staff} onCreateAdmin={function (name: string, pin: string): void {
            throw new Error('Function not implemented.');
        } } onRegisterStaff={function (staffData: Omit<Staff, 'id' | 'status'>): void {
            throw new Error('Function not implemented.');
        } } />
    }

    if (showTerminalAuth) {
        return <TerminalAuth />;
    }
    
    return (
        <div className="flex h-screen bg-slate-100 font-sans">
             <button onClick={() => setMobileNavOpen(true)} className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white/80 backdrop-blur-sm rounded-md shadow">
                <Menu size={24} />
            </button>
            <Sidebar 
                currentView={view} 
                setView={setView} 
                userRole={currentUser.role}
                onLogout={handleLogout}
                onLock={handleLogout} // Using logout to lock
                isMobileNavOpen={isMobileNavOpen}
                setMobileNavOpen={setMobileNavOpen}
            />
            <main className="flex-1 overflow-y-auto p-4 pt-16 md:pt-6 md:pl-72">
                {renderView()}
            </main>

            <BookingModal 
                isOpen={isBookingModalOpen}
                onClose={() => setBookingModalOpen(false)}
                onBook={handleAddGuest}
                initialRoomNumber={selectedRoomForBooking}
                rooms={rooms}
            />

            <RoomManagementModal 
                isOpen={isRoomManagementModalOpen}
                onClose={() => setRoomManagementModalOpen(false)}
                onSave={handleSaveRooms}
                onUpdate={handleUpdateRoom}
                onDelete={handleDeleteRoom}
                existingRoom={editingRoom}
            />
        </div>
    );
};

export default App;
