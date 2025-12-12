import Dexie, { Table } from 'dexie';
import { Room, Guest, MaintenanceTicket, Staff, Transaction, BookingHistory, AppSettings } from '../types';

export class StaySyncDatabase extends Dexie {
  rooms!: Table<Room>;
  guests!: Table<Guest>;
  maintenance!: Table<MaintenanceTicket>;
  staff!: Table<Staff>;
  transactions!: Table<Transaction>;
  history!: Table<BookingHistory>;
  settings!: Table<AppSettings & { id: string }>;

  constructor() {
    super('StaySyncDB');
    
    // Define schema
    // We only index properties we might want to query by specifically in the future
    (this as any).version(1).stores({
      rooms: 'id, number, status, type',
      guests: 'id, roomNumber, status, name',
      maintenance: 'id, roomNumber, status',
      staff: 'id, role, status',
      transactions: 'id, date, type, category',
      history: 'id, guestId, checkIn',
      settings: 'id' // Singleton store
    });
  }
}

export const db = new StaySyncDatabase();