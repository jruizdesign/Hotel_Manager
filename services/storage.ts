import { Room, Guest, MaintenanceTicket, Staff, Transaction, BookingHistory } from '../types';
import { MOCK_ROOMS, MOCK_GUESTS, MOCK_MAINTENANCE, MOCK_STAFF, MOCK_TRANSACTIONS, MOCK_HISTORY } from '../constants';

const STORAGE_KEYS = {
  ROOMS: 'staysync_rooms',
  GUESTS: 'staysync_guests',
  MAINTENANCE: 'staysync_maintenance',
  STAFF: 'staysync_staff',
  TRANSACTIONS: 'staysync_transactions',
  HISTORY: 'staysync_history',
};

export const StorageService = {
  // Rooms
  getRooms: (): Room[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ROOMS);
      return stored ? JSON.parse(stored) : MOCK_ROOMS;
    } catch (e) {
      console.error('Failed to load rooms', e);
      return MOCK_ROOMS;
    }
  },
  saveRooms: (rooms: Room[]) => {
    localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
  },

  // Guests
  getGuests: (): Guest[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.GUESTS);
      return stored ? JSON.parse(stored) : MOCK_GUESTS;
    } catch (e) {
      return MOCK_GUESTS;
    }
  },
  saveGuests: (guests: Guest[]) => {
    localStorage.setItem(STORAGE_KEYS.GUESTS, JSON.stringify(guests));
  },

  // History
  getHistory: (): BookingHistory[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return stored ? JSON.parse(stored) : MOCK_HISTORY;
    } catch (e) {
      return MOCK_HISTORY;
    }
  },
  saveHistory: (history: BookingHistory[]) => {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  },

  // Maintenance
  getMaintenance: (): MaintenanceTicket[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.MAINTENANCE);
      return stored ? JSON.parse(stored) : MOCK_MAINTENANCE;
    } catch (e) {
      return MOCK_MAINTENANCE;
    }
  },
  saveMaintenance: (tickets: MaintenanceTicket[]) => {
    localStorage.setItem(STORAGE_KEYS.MAINTENANCE, JSON.stringify(tickets));
  },

  // Staff
  getStaff: (): Staff[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.STAFF);
      return stored ? JSON.parse(stored) : MOCK_STAFF;
    } catch (e) {
      return MOCK_STAFF;
    }
  },
  saveStaff: (staff: Staff[]) => {
    localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staff));
  },

  // Transactions
  getTransactions: (): Transaction[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return stored ? JSON.parse(stored) : MOCK_TRANSACTIONS;
    } catch (e) {
      return MOCK_TRANSACTIONS;
    }
  },
  saveTransactions: (transactions: Transaction[]) => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }
};