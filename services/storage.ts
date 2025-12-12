import { Room, Guest, MaintenanceTicket, Staff, Transaction, BookingHistory } from '../types';
import { db } from './firebaseConfig';
import { collection, doc, setDoc, deleteDoc, onSnapshot, writeBatch } from 'firebase/firestore';
import { MOCK_ROOMS, MOCK_GUESTS, MOCK_STAFF, MOCK_MAINTENANCE } from '../constants';

// Collection Names
const COLS = {
  ROOMS: 'rooms',
  GUESTS: 'guests',
  MAINTENANCE: 'maintenance',
  STAFF: 'staff',
  TRANSACTIONS: 'transactions',
  HISTORY: 'history'
};

export const StorageService = {
  
  // --- Initialization ---
  
  // Helper to push demo data if DB is empty
  initializeDemoData: async () => {
    const batch = writeBatch(db);
    
    MOCK_ROOMS.forEach(r => batch.set(doc(db, COLS.ROOMS, r.id), r));
    MOCK_GUESTS.forEach(g => batch.set(doc(db, COLS.GUESTS, g.id), g));
    MOCK_STAFF.forEach(s => batch.set(doc(db, COLS.STAFF, s.id), s));
    MOCK_MAINTENANCE.forEach(m => batch.set(doc(db, COLS.MAINTENANCE, m.id), m));
    
    await batch.commit();
  },

  // --- Realtime Subscriptions ---
  
  subscribeRooms: (callback: (rooms: Room[]) => void) => {
    return onSnapshot(collection(db, COLS.ROOMS), (snapshot) => {
      const rooms = snapshot.docs.map(doc => doc.data() as Room);
      callback(rooms);
    });
  },

  subscribeGuests: (callback: (guests: Guest[]) => void) => {
    return onSnapshot(collection(db, COLS.GUESTS), (snapshot) => {
      const guests = snapshot.docs.map(doc => doc.data() as Guest);
      callback(guests);
    });
  },

  subscribeStaff: (callback: (staff: Staff[]) => void) => {
    return onSnapshot(collection(db, COLS.STAFF), (snapshot) => {
      const staff = snapshot.docs.map(doc => doc.data() as Staff);
      callback(staff);
    });
  },

  subscribeMaintenance: (callback: (tickets: MaintenanceTicket[]) => void) => {
    return onSnapshot(collection(db, COLS.MAINTENANCE), (snapshot) => {
      const tickets = snapshot.docs.map(doc => doc.data() as MaintenanceTicket);
      callback(tickets);
    });
  },

  subscribeTransactions: (callback: (txs: Transaction[]) => void) => {
    return onSnapshot(collection(db, COLS.TRANSACTIONS), (snapshot) => {
      const txs = snapshot.docs.map(doc => doc.data() as Transaction);
      // Sort by date desc
      txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      callback(txs);
    });
  },

  subscribeHistory: (callback: (history: BookingHistory[]) => void) => {
    return onSnapshot(collection(db, COLS.HISTORY), (snapshot) => {
      const history = snapshot.docs.map(doc => doc.data() as BookingHistory);
      callback(history);
    });
  },

  // --- Atomic Operations ---

  // Rooms
  addRoom: async (room: Room) => {
    await setDoc(doc(db, COLS.ROOMS, room.id), room);
  },
  updateRoom: async (roomId: string, data: Partial<Room>) => {
    await setDoc(doc(db, COLS.ROOMS, roomId), data, { merge: true });
  },
  deleteRoom: async (roomId: string) => {
    await deleteDoc(doc(db, COLS.ROOMS, roomId));
  },

  // Guests
  addGuest: async (guest: Guest) => {
    await setDoc(doc(db, COLS.GUESTS, guest.id), guest);
  },
  updateGuest: async (guestId: string, data: Partial<Guest>) => {
    await setDoc(doc(db, COLS.GUESTS, guestId), data, { merge: true });
  },
  
  // Staff
  addStaff: async (staff: Staff) => {
    await setDoc(doc(db, COLS.STAFF, staff.id), staff);
  },
  updateStaff: async (staffId: string, data: Partial<Staff>) => {
    await setDoc(doc(db, COLS.STAFF, staffId), data, { merge: true });
  },
  deleteStaff: async (staffId: string) => {
    await deleteDoc(doc(db, COLS.STAFF, staffId));
  },

  // Transactions
  addTransaction: async (tx: Transaction) => {
    await setDoc(doc(db, COLS.TRANSACTIONS, tx.id), tx);
  },

  // Utils
  clearAllData: async () => {
    // Note: Deleting collections client-side is expensive as you have to list documents and delete one by one.
    // For this simple app, we can just "Reset to Demo" which is simpler.
    console.warn("Clear All Data is not fully implemented for Firebase in this version for safety.");
  }
};