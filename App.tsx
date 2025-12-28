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
import GuestDetailsModal from './components/GuestDetailsModal';
import { 
    Room, Guest, MaintenanceTicket, Staff, Transaction, StoredDocument, 
    FeatureRequest, DNRRecord, ViewState, CurrentUser, AppSettings
} from './types';
import * as db from './services/db';

const App: React.FC = () => {
    const [view, setView] = useState<ViewState>('dashboard');
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [isSetupComplete, setIsSetupComplete] = useState<boolean | null>(null);
    const [showTerminalAuth, setShowTerminalAuth] = useState(false);

    const [rooms, setRooms] = useState<Room[]>([]);
    const [guests, setGuests] = useState<Guest[]>([]);
    const [maintenanceTickets, setMaintenanceTickets] = useState<MaintenanceTicket[]>([]);
    const [staff, setStaff] = useState<Staff[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [documents, setDocuments] = useState<StoredDocument[]>([]);
    const [featureRequests, setFeatureRequests] = useState<FeatureRequest[]>([]);
    const [dnrList, setDnrList] = useState<DNRRecord[]>([]);
    const [settings, setSettings] = useState<AppSettings | null>(null);

    // Modal States
    const [isBookingModalOpen, setBookingModalOpen] = useState(false);
    const [isRoomManagementModalOpen, setRoomManagementModalOpen] = useState(false);
    const [isGuestDetailsModalOpen, setGuestDetailsModalOpen] = useState(false);
    const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
    const [selectedRoomForBooking, setSelectedRoomForBooking] = useState<string | undefined>(undefined);
    const [editingRoom, setEditingRoom] = useState<Partial<Room> | null>(null);

    const fetchData = useCallback(async () => {
        if (!currentUser) return;
        setRooms(await db.getRooms());
        setGuests(await db.getGuests());
        setMaintenanceTickets(await db.getMaintenanceTickets());
        setStaff(await db.getStaff());
        setTransactions(await db.getTransactions());
        setDocuments(await db.getDocuments());
        setFeatureRequests(await db.getFeatureRequests());
        setDnrList(await db.getDNRList());
    }, [currentUser]);

    useEffect(() => {
        const checkSetup = async () => {
            const setupDone = await db.isSetupComplete();
            setIsSetupComplete(setupDone);
            if(setupDone) {
                const storedSettings = await db.getSettings();
                setSettings(storedSettings);
            }
        };
        checkSetup();
    }, []);

    useEffect(() => {
        if (currentUser) {
            fetchData();
        }
    }, [currentUser, fetchData]);

    const handleLogin = (user: CurrentUser) => {
        setCurrentUser(user);
    };

    const handleLogout = () => {
        setCurrentUser(null);
        setView('dashboard');
    };
    
    const handleSetupComplete = async () => {
        const setupDone = await db.isSetupComplete();
        setIsSetupComplete(setupDone);
        if(setupDone) {
            const storedSettings = await db.getSettings();
            setSettings(storedSettings);
        }
    };

    // Room Management Handlers
    const handleOpenRoomManager = (room: Partial<Room> | null = null) => {
        setEditingRoom(room);
        setRoomManagementModalOpen(true);
    };

    const handleSaveRooms = async (newRooms: Partial<Room>[]) => {
        await db.addRooms(newRooms as Room[]);
        await fetchData();
    };
    
    const handleUpdateRoom = async (roomUpdate: Partial<Room>) => {
        if(roomUpdate.id) {
            await db.updateRoom(roomUpdate.id, roomUpdate);
            await fetchData();
        }
    };

    const handleDeleteRoom = async (roomId: string) => {
        await db.deleteRoom(roomId);
        await fetchData();
    };

    // Booking Handlers
    const handleOpenBookingModal = (roomNumber: string) => {
        setSelectedRoomForBooking(roomNumber);
        setBookingModalOpen(true);
    };

    const handleBookRoom = async (guestData: Omit<Guest, 'id'>): Promise<boolean> => {
        const success = await db.addGuest(guestData as Guest, guestData.roomNumber || '');
        if (success) {
            await fetchData();
            return true;
        }
        return false;
    };

    // Guest Details Handlers
    const handleOpenGuestDetails = (guest: Guest) => {
        setSelectedGuest(guest);
        setGuestDetailsModalOpen(true);
    };

    const renderView = () => {
        switch (view) {
            case 'dashboard': return <Dashboard rooms={rooms} guests={guests} tickets={maintenanceTickets} onNavigate={setView} onBookRoom={handleOpenBookingModal}/>;
            case 'rooms': return <RoomDashboard rooms={rooms} guests={guests} onBook={handleOpenBookingModal} onEditRoom={(room: Room) => handleOpenRoomManager(room)} onAddNewRoom={() => handleOpenRoomManager(null)} />;
            case 'guests': return <GuestList guests={guests} onGuestSelect={handleOpenGuestDetails} />;
            case 'maintenance': return <MaintenancePanel tickets={maintenanceTickets} rooms={rooms} onUpdate={fetchData} />;
            case 'staff': return <StaffList staff={staff} onUpdate={fetchData}/>;
            case 'accounting': return <Accounting transactions={transactions} onUpdate={fetchData} guests={guests} rooms={rooms}/>;
            case 'documents': return <DocumentCenter documents={documents} onUpdate={fetchData} guests={guests}/>;
            case 'features': return <FeatureRequestPanel requests={featureRequests} onUpdate={fetchData}/>;
            case 'settings': return <Settings settings={settings} onUpdate={setSettings}/>;
            case 'reports': return <DailyReport rooms={rooms} guests={guests} transactions={transactions} tickets={maintenanceTickets}/>;
            case 'check-in-out': return <CheckInCheckOutPanel guests={guests} onUpdate={fetchData}/>;
            default: return <Dashboard rooms={rooms} guests={guests} tickets={maintenanceTickets} onNavigate={setView} onBookRoom={handleOpenBookingModal}/>;
        }
    };

    if (isSetupComplete === null) {
        return <div>Loading...</div>; // Or a proper splash screen
    }

    if (!isSetupComplete) {
        return <SetupWizard onComplete={handleSetupComplete} />;
    }

    if (settings?.recaptchaSiteKey && !currentUser) {
        return <LoginScreen onLogin={handleLogin} recaptchaSiteKey={settings.recaptchaSiteKey}/>
    }

    if (!currentUser) {
        // Fallback login if reCAPTCHA is not configured
        return <LoginScreen onLogin={handleLogin} />
    }

    if (showTerminalAuth) {
        return <TerminalAuth onAuthenticated={() => setShowTerminalAuth(false)} />;
    }
    
    return (
        <div className="flex h-screen bg-slate-100 font-sans">
            <Sidebar 
                view={view} 
                setView={setView} 
                currentUser={currentUser} 
                onLogout={handleLogout}
                onTerminalAuth={() => setShowTerminalAuth(true)}
            />
            <main className="flex-1 overflow-y-auto">
                {renderView()}
            </main>

            {/* MODALS */} 
            <BookingModal 
                isOpen={isBookingModalOpen}
                onClose={() => setBookingModalOpen(false)}
                onBook={handleBookRoom}
                initialRoomNumber={selectedRoomForBooking}
            />

            <RoomManagementModal 
                isOpen={isRoomManagementModalOpen}
                onClose={() => setRoomManagementModalOpen(false)}
                onSave={handleSaveRooms}
                onUpdate={handleUpdateRoom}
                onDelete={handleDeleteRoom}
                existingRoom={editingRoom}
            />

            {selectedGuest && <GuestDetailsModal 
                isOpen={isGuestDetailsModalOpen}
                onClose={() => setGuestDetailsModalOpen(false)}
                guest={selectedGuest}
                onUpdate={fetchData}
            />}
        </div>
    );
};

export default App;
