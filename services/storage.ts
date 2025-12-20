import { Room, Guest, MaintenanceTicket, Staff, Transaction, BookingHistory, AppSettings, StoredDocument, FeatureRequest, AttendanceLog, DNRRecord } from '../types';
import { MOCK_ROOMS, MOCK_GUESTS, MOCK_MAINTENANCE, MOCK_STAFF, MOCK_TRANSACTIONS, MOCK_HISTORY } from '../constants';
import { db } from './db';
import { initializeFirebase, getFirebaseDB } from './firebase';
import { collection, getDocs, doc, writeBatch, Firestore } from 'firebase/firestore';

const SETTINGS_ID = 'app_settings';

// Check if environment variables are configured for Firebase
// We access process.env directly so Vite's define plugin can perform static string replacement
const hasEnvConfig = !!process.env.FIREBASE_API_KEY;

const DEFAULT_SETTINGS: AppSettings = {
  dataSource: hasEnvConfig ? 'Cloud' : 'Local',
  // If cloud config is present, disable demo mode by default to prioritize real data
  demoMode: !hasEnvConfig,
  maintenanceEmail: 'maintenance@staysync.hotel',
  recaptchaSiteKey: '',
  firebaseConfig: {
    apiKey: process.env.FIREBASE_API_KEY || '',
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.FIREBASE_APP_ID || ''
  },
  hotelName: ''
};

// --- Cloud Helper Methods ---

const getCloudData = async <T>(collectionName: string): Promise<T[]> => {
  const firestore = getFirebaseDB();
  if (!firestore) throw new Error("Cloud database not connected");
  
  try {
    const querySnapshot = await getDocs(collection(firestore, collectionName));
    const data: T[] = [];
    querySnapshot.forEach((doc) => {
      // We assume the doc ID is part of the data object as 'id'
      data.push(doc.data() as T);
    });
    return data;
  } catch (err: any) {
    if (err.code === 'permission-denied') {
      console.warn(`Permission denied accessing ${collectionName}. Check Firestore rules.`);
    } else {
      console.error(`Error fetching ${collectionName}:`, err);
    }
    return [];
  }
};

const saveCloudData = async <T extends { id: string }>(collectionName: string, data: T[]): Promise<void> => {
  const firestore = getFirebaseDB();
  if (!firestore) throw new Error("Cloud database not connected");

  // Firestore Batch allows up to 500 operations.
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
        const appSettings = settings as AppSettings;
        if (appSettings.dataSource === 'Cloud' && appSettings.firebaseConfig) {
          initializeFirebase(appSettings);
        }
        return appSettings;
      }
      
      // If no local settings, use defaults
      if (DEFAULT_SETTINGS.dataSource === 'Cloud' && DEFAULT_SETTINGS.firebaseConfig) {
        initializeFirebase(DEFAULT_SETTINGS);
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
        
        // Strict Rule: Never auto-seed STAFF or Guests in Cloud Mode to avoid polluting real DB with mocks.
        // User must manually create their first admin.
        if (collectionName === 'staff' || collectionName === 'guests') {
          return cloudData;
        }

        // For other collections (Rooms, etc.), we only seed if explicitly requested via Demo Mode toggle (handled in Settings)
        // or if we really want a baseline. For now, we return empty if Cloud is empty.
        // This effectively "Replaces mock data with real data" (or lack thereof).
        return cloudData;

      } catch (error) {
        console.error(`Cloud fetch failed for ${collectionName}:`, error);
        // Fallback to local if cloud fails? 
        // For security, if cloud fails, we probably shouldn't show local data unless synced.
        return []; 
      }
    }

    // 2. Local DB Mode
    const count = await localTable.count();
    
    // If DB is empty and Demo Mode is ON, seed it
    if (count === 0 && settings.demoMode && mockData.length > 0) {
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

  getAttendanceLogs: async (): Promise<AttendanceLog[]> => {
    return StorageService.getOrSeedData(db.attendance, [], 'attendance');
  },
  saveAttendanceLogs: async (logs: AttendanceLog[]) => {
    return StorageService.saveData(db.attendance, logs, 'attendance');
  },

  getTransactions: async (): Promise<Transaction[]> => {
    return StorageService.getOrSeedData(db.transactions, MOCK_TRANSACTIONS, 'transactions');
  },
  saveTransactions: async (transactions: Transaction[]) => {
    return StorageService.saveData(db.transactions, transactions, 'transactions');
  },

  getDocuments: async (): Promise<StoredDocument[]> => {
    return StorageService.getOrSeedData(db.documents, [], 'documents');
  },
  saveDocuments: async (documents: StoredDocument[]) => {
    return StorageService.saveData(db.documents, documents, 'documents');
  },
  
  getFeatureRequests: async (): Promise<FeatureRequest[]> => {
    return StorageService.getOrSeedData(db.features, [], 'features');
  },
  saveFeatureRequests: async (features: FeatureRequest[]) => {
    return StorageService.saveData(db.features, features, 'features');
  },

  getDNRRecords: async (): Promise<DNRRecord[]> => {
    return StorageService.getOrSeedData(db.dnr, [], 'dnr');
  },
  saveDNRRecords: async (records: DNRRecord[]) => {
    return StorageService.saveData(db.dnr, records, 'dnr');
  },

  // --- Utility Methods ---

  clearAllData: async () => {
    await Promise.all([
      db.rooms.clear(),
      db.guests.clear(),
      db.maintenance.clear(),
      db.staff.clear(),
      db.attendance.clear(),
      db.transactions.clear(),
      db.history.clear(),
      db.documents.clear(),
      db.features.clear(),
      db.dnr.clear()
    ]);
  },

  resetToDemo: async () => {
    await StorageService.clearAllData();
  },

  exportAllData: async () => {
    const [rooms, guests, maintenance, staff, attendance, transactions, history, documents, features, dnr] = await Promise.all([
      db.rooms.toArray(),
      db.guests.toArray(),
      db.maintenance.toArray(),
      db.staff.toArray(),
      db.attendance.toArray(),
      db.transactions.toArray(),
      db.history.toArray(),
      db.documents.toArray(),
      db.features.toArray(),
      db.dnr.toArray()
    ]);

    return {
      version: '4.0',
      timestamp: new Date().toISOString(),
      data: {
        staysync_rooms: rooms,
        staysync_guests: guests,
        staysync_maintenance: maintenance,
        staysync_staff: staff,
        staysync_attendance: attendance,
        staysync_transactions: transactions,
        staysync_history: history,
        staysync_documents: documents,
        staysync_features: features,
        staysync_dnr: dnr
      }
    };
  },

  importData: async (backupData: any) => {
    if (!backupData || !backupData.data) {
      throw new Error("Invalid backup file format");
    }
    
    const data = backupData.data;
    
    await (db as any).transaction('rw', db.rooms, db.guests, db.maintenance, db.staff, db.attendance, db.transactions, db.history, db.documents, db.features, db.dnr, async () => {
      await db.rooms.clear();
      if (data.staysync_rooms) await db.rooms.bulkAdd(data.staysync_rooms);
      
      await db.guests.clear();
      if (data.staysync_guests) await db.guests.bulkAdd(data.staysync_guests);
      
      await db.maintenance.clear();
      if (data.staysync_maintenance) await db.maintenance.bulkAdd(data.staysync_maintenance);
      
      await db.staff.clear();
      if (data.staysync_staff) await db.staff.bulkAdd(data.staysync_staff);

      await db.attendance.clear();
      if (data.staysync_attendance) await db.attendance.bulkAdd(data.staysync_attendance);
      
      await db.transactions.clear();
      if (data.staysync_transactions) await db.transactions.bulkAdd(data.staysync_transactions);

      await db.history.clear();
      if (data.staysync_history) await db.history.bulkAdd(data.staysync_history);

      await db.documents.clear();
      if (data.staysync_documents) await db.documents.bulkAdd(data.staysync_documents);
      
      await db.features.clear();
      if (data.staysync_features) await db.features.bulkAdd(data.staysync_features);

      await db.dnr.clear();
      if (data.staysync_dnr) await db.dnr.bulkAdd(data.staysync_dnr);
    });
  },

  testConnection: async (apiKey: string): Promise<boolean> => {
     // Simple validation check
     return apiKey.length > 20;
  }
};
