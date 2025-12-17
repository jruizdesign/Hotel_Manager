import Dexie, { Table } from 'dexie';
import { Room, Guest, MaintenanceTicket, Staff, Transaction, BookingHistory, AppSettings, StoredDocument, FeatureRequest, AttendanceLog, DNRRecord } from '../types';

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
  settings!: Table<AppSettings & { id: string }>;

  constructor() {
    super('StaySyncDB');
    
    // Define schema
    // We only index properties we might want to query by specifically in the future
    (this as any).version(5).stores({
      rooms: 'id, number, status, type',
      guests: 'id, roomNumber, status, name',
      maintenance: 'id, roomNumber, status',
      staff: 'id, role, status',
      attendance: 'id, staffId, timestamp', 
      transactions: 'id, date, type, category',
      history: 'id, guestId, checkIn',
      documents: 'id, category, date',
      features: 'id, status, priority, submittedBy',
      dnr: 'id, name, dateAdded', // New Table
      settings: 'id' // Singleton store
    });
  }
}

export const db = new StaySyncDatabase();