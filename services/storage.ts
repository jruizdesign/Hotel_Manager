import { Room, Guest, MaintenanceTicket, Staff, Transaction, BookingHistory, AppSettings } from '../types';
import { MOCK_ROOMS, MOCK_GUESTS, MOCK_MAINTENANCE, MOCK_STAFF, MOCK_TRANSACTIONS, MOCK_HISTORY } from '../constants';
import { db } from './db';
import { initializeFirebase, getFirebaseDB } from './firebase';
import { collection, getDocs, doc, writeBatch, Firestore } from 'firebase/firestore';

const SETTINGS_ID = 'app_settings';

const DEFAULT_SETTINGS: AppSettings = {
  dataSource: 'Local',
  demoMode: true,
  firebaseConfig: {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  }
};

// --- Cloud Helper Methods ---

const getCloudData = async <T>(collectionName: string): Promise<T[]> => {
  const firestore = getFirebaseDB();
  if (!firestore) throw new Error("Cloud database not connected");
  
  const querySnapshot = await getDocs(collection(firestore, collectionName));
  const data: T[] = [];
  querySnapshot.forEach((doc) => {
    // We assume the doc ID is part of the data object as 'id'
    data.push(doc.data() as T);
  });
  return data;
};

const saveCloudData = async <T extends { id: string }>(collectionName: string, data: T[]): Promise<void> => {
  const firestore = getFirebaseDB();
  if (!firestore) throw new Error("Cloud database not connected");

  // Firestore Batch allows up to 500 operations. For a small hotel app, this is okay.
  // For larger scale, we would need to chunk this.
  const batch = writeBatch(firestore);
  
  data.forEach((item) => {
    const docRef = doc(firestore, collectionName, item.id);
    batch.set(docRef, item);
  });

  await batch.commit();
};


export const StorageService = {
  // --- Settings Management ---
  getSettings: async (): Promise<AppSettings> => {
    try {
      const record = await db.settings.get(SETTINGS_ID);
      if (record) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...settings } = record;
        // Initialize firebase if config exists
        const appSettings = settings as AppSettings;
        if (appSettings.dataSource === 'Cloud' && appSettings.firebaseConfig) {
          initializeFirebase(appSettings);
        }
        return appSettings;
      }
      return DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  getSettingsSync: (): AppSettings => {
    return DEFAULT_SETTINGS;
  },

  saveSettings: async (settings: AppSettings) => {
    await db.settings.put({ ...settings, id: SETTINGS_ID });
    if (settings.dataSource === 'Cloud' && settings.firebaseConfig) {
      initializeFirebase(settings);
    }
  },

  // --- Data Loader ---
  async getOrSeedData<T extends { id: string }>(localTable: any, mockData: T[], collectionName: string): Promise<T[]> {
    const settings = await StorageService.getSettings();
    
    // 1. Cloud Mode
    if (settings.dataSource === 'Cloud') {
      try {
        const cloudData = await getCloudData<T>(collectionName);
        if (cloudData.length === 0 && settings.demoMode) {
           // Seed Cloud with Mock Data if empty
           await saveCloudData(collectionName, mockData);
           return mockData;
        }
        return cloudData;
      } catch (error) {
        console.error(`Cloud fetch failed for ${collectionName}:`, error);
        alert(`Failed to fetch ${collectionName} from Cloud. Switching to offline view.`);
        // Fallback to local
      }
    }

    // 2. Local DB Mode
    const count = await localTable.count();
    
    // If DB is empty and Demo Mode is ON, seed it
    if (count === 0 && settings.demoMode) {
      console.log(`Seeding ${localTable.name} with mock data...`);
      await localTable.bulkAdd(mockData);
      return mockData;
    }

    // Return data from DB
    return await localTable.toArray();
  },

  async saveData<T extends { id: string }>(localTable: any, data: T[], collectionName: string): Promise<void> {
    const settings = await StorageService.getSettings();

    // 1. Always save to Local DB (for offline capability/cache)
    await (db as any).transaction('rw', localTable, async () => {
      await localTable.clear();
      await localTable.bulkAdd(data);
    });

    // 2. Sync to Cloud if enabled
    if (settings.dataSource === 'Cloud') {
      try {
        await saveCloudData(collectionName, data);
      } catch (error) {
        console.error(`Failed to save to cloud`, error);
        alert("Warning: Saved locally, but Cloud sync failed. Check internet connection.");
      }
    }
  },

  // --- Entity Specific Methods ---

  getRooms: async (): Promise<Room[]> => {
    return StorageService.getOrSeedData(db.rooms, MOCK_ROOMS, 'rooms');
  },
  saveRooms: async (rooms: Room[]) => {
    return StorageService.saveData(db.rooms, rooms, 'rooms');
  },

  getGuests: async (): Promise<Guest[]> => {
    return StorageService.getOrSeedData(db.guests, MOCK_GUESTS, 'guests');
  },
  saveGuests: async (guests: Guest[]) => {
    return StorageService.saveData(db.guests, guests, 'guests');
  },

  getHistory: async (): Promise<BookingHistory[]> => {
    return StorageService.getOrSeedData(db.history, MOCK_HISTORY, 'history');
  },
  saveHistory: async (history: BookingHistory[]) => {
    return StorageService.saveData(db.history, history, 'history');
  },

  getMaintenance: async (): Promise<MaintenanceTicket[]> => {
    return StorageService.getOrSeedData(db.maintenance, MOCK_MAINTENANCE, 'maintenance');
  },
  saveMaintenance: async (tickets: MaintenanceTicket[]) => {
    return StorageService.saveData(db.maintenance, tickets, 'maintenance');
  },

  getStaff: async (): Promise<Staff[]> => {
    return StorageService.getOrSeedData(db.staff, MOCK_STAFF, 'staff');
  },
  saveStaff: async (staff: Staff[]) => {
    return StorageService.saveData(db.staff, staff, 'staff');
  },

  getTransactions: async (): Promise<Transaction[]> => {
    return StorageService.getOrSeedData(db.transactions, MOCK_TRANSACTIONS, 'transactions');
  },
  saveTransactions: async (transactions: Transaction[]) => {
    return StorageService.saveData(db.transactions, transactions, 'transactions');
  },

  // --- Utility Methods ---

  clearAllData: async () => {
    await Promise.all([
      db.rooms.clear(),
      db.guests.clear(),
      db.maintenance.clear(),
      db.staff.clear(),
      db.transactions.clear(),
      db.history.clear()
    ]);
  },

  resetToDemo: async () => {
    await StorageService.clearAllData();
  },

  exportAllData: async () => {
    const [rooms, guests, maintenance, staff, transactions, history] = await Promise.all([
      db.rooms.toArray(),
      db.guests.toArray(),
      db.maintenance.toArray(),
      db.staff.toArray(),
      db.transactions.toArray(),
      db.history.toArray()
    ]);

    return {
      version: '1.0',
      timestamp: new Date().toISOString(),
      data: {
        staysync_rooms: rooms,
        staysync_guests: guests,
        staysync_maintenance: maintenance,
        staysync_staff: staff,
        staysync_transactions: transactions,
        staysync_history: history
      }
    };
  },

  importData: async (backupData: any) => {
    if (!backupData || !backupData.data) {
      throw new Error("Invalid backup file format");
    }
    
    const data = backupData.data;
    
    await (db as any).transaction('rw', db.rooms, db.guests, db.maintenance, db.staff, db.transactions, db.history, async () => {
      await db.rooms.clear();
      if (data.staysync_rooms) await db.rooms.bulkAdd(data.staysync_rooms);
      
      await db.guests.clear();
      if (data.staysync_guests) await db.guests.bulkAdd(data.staysync_guests);
      
      await db.maintenance.clear();
      if (data.staysync_maintenance) await db.maintenance.bulkAdd(data.staysync_maintenance);
      
      await db.staff.clear();
      if (data.staysync_staff) await db.staff.bulkAdd(data.staysync_staff);
      
      await db.transactions.clear();
      if (data.staysync_transactions) await db.transactions.bulkAdd(data.staysync_transactions);

      await db.history.clear();
      if (data.staysync_history) await db.history.bulkAdd(data.staysync_history);
    });
  },

  testConnection: async (apiKey: string): Promise<boolean> => {
     // Simple validation check
     return apiKey.length > 20;
  }
};