import Dexie, { Table } from 'dexie';
import { Room, Guest, MaintenanceTicket, Staff, Transaction, BookingHistory, AppSettings, StoredDocument, FeatureRequest, AttendanceLog, DNRRecord, SentEmail, RoomStatus, StaffStatus, AttendanceAction, DataSource, RoomType } from '../types';

export class StaySyncDatabase extends Dexie {
  rooms!: Table<Room>;
  guests!: Table<Guest>;
  maintenance!: Table<MaintenanceTicket>;
  staff!: Table<Staff>;
  attendance!: Table<AttendanceLog>;
  transactions!: Table<Transaction>;
  history!: Table<BookingHistory>;
  documents!: Table<StoredDocument>;
  features!: Table<FeatureRequest>;
  dnr!: Table<DNRRecord>;
  emails!: Table<SentEmail>;
  settings!: Table<AppSettings & { id: string }>;

  constructor() {
    super('StaySyncDB');
    
    (this as any).version(6).stores({
      rooms: 'id, number, status, type',
      guests: 'id, roomNumber, status, name',
      maintenance: 'id, roomNumber, status',
      staff: 'id, role, status',
      attendance: 'id, staffId, timestamp', 
      transactions: 'id, date, type, category, guestId',
      history: 'id, guestId, checkIn',
      documents: 'id, category, date',
      features: 'id, status, priority, submittedBy',
      dnr: 'id, name, dateAdded',
      emails: 'id, guestId, date, type', 
      settings: 'id'
    });
  }
}

export const db = new StaySyncDatabase();

export async function isSetupComplete(): Promise<boolean> {
    const settingsCount = await db.settings.count();
    const staffCount = await db.staff.count();
    return settingsCount > 0 && staffCount > 0;
}

export async function markSetupComplete(): Promise<void> {
    const defaultSettings: AppSettings = {
        hotelName: 'My Hotel',
        dataSource: 'Local' as DataSource,
        demoMode: false
    };
    await saveSettings(defaultSettings);
}

export async function getSettings(): Promise<AppSettings> {
    const settings = await db.settings.get('default');
    if (!settings) throw new Error('Settings not found');
    return settings;
}

export async function saveSettings(settings: AppSettings): Promise<void> {
    await db.settings.put({ ...settings, id: 'default' });
}

// Room Functions
export const getRooms = () => db.rooms.toArray();
export const getRoom = (id: string) => db.rooms.get(id);
export const addRooms = (rooms: Room[]) => db.rooms.bulkAdd(rooms);
export const updateRoom = (id: string, roomUpdate: Partial<Room>) => db.rooms.update(id, roomUpdate);
export const deleteRoom = (id: string) => db.rooms.delete(id);

// Guest Functions
export const getGuests = () => db.guests.toArray();

export const addGuest = async (guest: Guest): Promise<boolean> => {
    try {
        if (!guest.roomNumber) return false;
        const room = await db.rooms.where('number').equals(guest.roomNumber).first();
        if (!room || room.status !== RoomStatus.AVAILABLE) {
            console.error('Room not available or does not exist.');
            return false;
        }

        await db.transaction('rw', db.guests, db.rooms, async () => {
            await db.guests.add(guest);
            await db.rooms.update(room.id, { status: RoomStatus.OCCUPIED, guestId: guest.id });
        });
        return true;
    } catch (error) {
        console.error("Failed to add guest and update room:", error);
        return false;
    }
};

export const updateGuest = (id: string, guestUpdate: Partial<Guest>) => db.guests.update(id, guestUpdate);

export const checkOutGuest = async (roomId: string) => {
    try {
        await db.transaction('rw', db.guests, db.rooms, db.history, async () => {
            const room = await db.rooms.get(roomId);
            if (!room || !room.guestId) throw new Error('Room not found or no guest in room');

            const guest = await db.guests.get(room.guestId);
            if (!guest) throw new Error('Guest not found');

            // Update guest
            await db.guests.update(guest.id, { status: 'Checked Out', roomNumber: undefined });

            // Update room
            await db.rooms.update(roomId, { status: RoomStatus.DIRTY, guestId: undefined });

            // Create history record
            await db.history.add({
                id: crypto.randomUUID(),
                guestId: guest.id,
                checkIn: guest.checkIn,
                checkOut: new Date().toISOString(),
                roomNumber: room.number,
                roomType: room.type,
                totalAmount: 0, // Placeholder for total amount
                status: 'Completed'
            });
        });
        return true;
    } catch (error) {
        console.error("Failed to checkout guest:", error);
        return false;
    }
}

// Maintenance Ticket Functions
export const getMaintenanceTickets = () => db.maintenance.toArray();
export const addMaintenanceTicket = async (ticket: Omit<MaintenanceTicket, 'id' | 'status' | 'date'>) => {
  const newTicket = {
    ...ticket,
    id: crypto.randomUUID(),
    status: 'Pending' as const,
    date: new Date().toISOString(),
  };
  await db.maintenance.add(newTicket);
  return newTicket;
};
export const resolveMaintenanceTicket = async (id: string, cost: number, note: string) => {
  await db.maintenance.update(id, { 
    status: 'Resolved', 
    cost: cost, 
    completedDate: new Date().toISOString() 
  });
  if (cost > 0) {
    await db.transactions.add({
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      category: 'Maintenance Cost',
      amount: cost,
      description: `Repairs for ticket ${id}: ${note}`,
      type: 'Expense',
    });
  }
};

// Staff Functions
export const getStaff = () => db.staff.toArray();
export const addStaff = async (staff: Omit<Staff, 'id'>): Promise<Staff> => {
    const newStaff = { ...staff, id: crypto.randomUUID(), status: StaffStatus.OFF_DUTY } as Staff;
    await db.staff.add(newStaff);
    return newStaff;
};
export const deleteStaff = (id: string) => db.staff.delete(id);
export const updateStaffStatus = (id: string, status: StaffStatus) => db.staff.update(id, { status });

// Attendance Functions
export const getAttendanceLogs = () => db.attendance.orderBy('timestamp').reverse().toArray();
export const addAttendanceLog = (log: Omit<AttendanceLog, 'id'>) => {
    const newLog = { ...log, id: crypto.randomUUID() };
    return db.attendance.add(newLog as AttendanceLog);
};
export const updateAttendanceLog = (id: string, newTimestamp: string) => {
    return db.attendance.update(id, { timestamp: newTimestamp });
};

// Transaction Functions
export const getTransactions = () => db.transactions.toArray();

export const addPayment = async (guestId: string, amount: number, date: string, description: string) => {
    await db.transaction('rw', db.guests, db.transactions, async () => {
        const guest = await db.guests.get(guestId);
        if (!guest) throw new Error('Guest not found');

        // Add payment transaction
        await db.transactions.add({
            id: crypto.randomUUID(),
            date: date,
            category: 'Guest Payment',
            amount: amount,
            description: description,
            type: 'Income',
            guestId: guestId
        });

        // Update guest balance
        await db.guests.update(guestId, { balance: guest.balance - amount });
    });
};

// Document Functions
export const getDocuments = () => db.documents.toArray();
export const addDocument = async (document: Omit<StoredDocument, 'id'>) => {
    const newDocument = { ...document, id: crypto.randomUUID() };
    await db.documents.add(newDocument);
    return newDocument;
};
export const deleteDocument = (id: string) => db.documents.delete(id);


// Feature Request Functions
export const getFeatureRequests = () => db.features.toArray();
export const addFeatureRequest = async (req: Omit<FeatureRequest, 'id' | 'status' | 'submittedDate' | 'upvotes' | 'submittedBy'>, submittedBy: string) => {
    const newRequest = {
        ...req,
        id: crypto.randomUUID(),
        status: 'Pending' as const,
        submittedDate: new Date().toISOString(),
        upvotes: 0,
        submittedBy,
    };
    await db.features.add(newRequest);
    return newRequest;
};
export const updateFeatureRequest = (id: string, req: Partial<FeatureRequest>) => db.features.update(id, req);
export const deleteFeatureRequest = (id: string) => db.features.delete(id);

// DNR List Functions
export const getDNRList = () => db.dnr.toArray();
export const addDNR = (record: Omit<DNRRecord, 'id' | 'dateAdded'>) => {
    const newRecord = { ...record, id: crypto.randomUUID(), dateAdded: new Date().toISOString() };
    return db.dnr.add(newRecord);
};
export const deleteDNR = (id: string) => db.dnr.delete(id);

// Email Functions
export const getSentEmails = (id?: string | undefined) => db.emails.toArray();
export const addSentEmail = (email: Omit<SentEmail, 'id'>) => {
    const newEmail = { ...email, id: crypto.randomUUID() };
    return db.emails.add(newEmail);
};
