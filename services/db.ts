import Dexie, { Table } from 'dexie';
import { Room, Guest, MaintenanceTicket, Staff, Transaction, BookingHistory, AppSettings, StoredDocument, FeatureRequest, AttendanceLog, DNRRecord, SentEmail } from '../types';

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
    
    // Define schema
    // We only index properties we might want to query by specifically in the future
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
      emails: 'id, guestId, date, type', // New Table
      settings: 'id' // Singleton store
    });
  }
}

export const db = new StaySyncDatabase();

export function isSetupComplete() {
    throw new Error('Function not implemented.');
}
export function updateRoom(id: string, roomUpdate: Partial<Room>) {
    throw new Error('Function not implemented.');
}

export function addGuest(arg0: Guest, arg1: string) {
    throw new Error('Function not implemented.');
}

export function getMaintenanceTickets(): import("react").SetStateAction<MaintenanceTicket[]> | PromiseLike<import("react").SetStateAction<MaintenanceTicket[]>> {
    throw new Error('Function not implemented.');
}

export function getDocuments(): import("react").SetStateAction<StoredDocument[]> | PromiseLike<import("react").SetStateAction<StoredDocument[]>> {
    throw new Error('Function not implemented.');
}

export function getRooms(): import("react").SetStateAction<Room[]> | PromiseLike<import("react").SetStateAction<Room[]>> {
    throw new Error('Function not implemented.');
}

export function getGuests(): import("react").SetStateAction<Guest[]> | PromiseLike<import("react").SetStateAction<Guest[]>> {
    throw new Error('Function not implemented.');
}

export function getStaff(): import("react").SetStateAction<Staff[]> | PromiseLike<import("react").SetStateAction<Staff[]>> {
    throw new Error('Function not implemented.');
}

export function getTransactions(): import("react").SetStateAction<Transaction[]> | PromiseLike<import("react").SetStateAction<Transaction[]>> {
    throw new Error('Function not implemented.');
}

