import Dexie, { Table } from 'dexie';
import { Room, Guest, MaintenanceTicket, Staff, Transaction, BookingHistory, AppSettings, StoredDocument, FeatureRequest, AttendanceLog, DNRRecord, SentEmail, RoomStatus, StaffStatus, AttendanceAction } from '../types';

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
      transactions: 'id, date, type, category',
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
    return settingsCount > 0;
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
export const addGuest = async (guest: Guest, roomNumber: string): Promise<boolean> => {
    try {
        await db.transaction('rw', db.guests, db.rooms, async () => {
            await db.guests.add(guest);
            await db.rooms.update(roomNumber, { status: RoomStatus.OCCUPIED, guestId: guest.id });
        });
        return true;
    } catch (error) {
        console.error("Failed to add guest and update room:", error);
        return false;
    }
};

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
export const addStaff = (staff: Omit<Staff, 'id'>) => {
    const newStaff = { ...staff, id: crypto.randomUUID(), status: StaffStatus.OFF_DUTY };
    return db.staff.add(newStaff as Staff);
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

// Document Functions
export const getDocuments = () => db.documents.toArray();

// Feature Request Functions
export const getFeatureRequests = () => db.features.toArray();

// DNR List Functions
export const getDNRList = () => db.dnr.toArray();
