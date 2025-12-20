import { Room, Guest, MaintenanceTicket, Staff, Transaction, BookingHistory, AppSettings, StoredDocument, FeatureRequest, AttendanceLog, DNRRecord } from '../types';
import { MOCK_ROOMS, MOCK_GUESTS, MOCK_MAINTENANCE, MOCK_STAFF, MOCK_TRANSACTIONS, MOCK_HISTORY } from '../constants';
import { db } from './db';
import { initializeFirebase, getFirebaseDB } from './firebase';
import { collection, getDocs, doc, writeBatch, Firestore } from 'firebase/firestore';

const SETTINGS_ID = 'app_settings';

const hasEnvConfig = !!process.env.FIREBASE_API_KEY;

const DEFAULT_SETTINGS: AppSettings = {
  hotelName: 'StaySync Hotel',
  dataSource: hasEnvConfig ? 'Cloud' : 'Local',
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
  }
};

const getCloudData = async <T>(collectionName: string): Promise<T[]> => {
  const firestore = getFirebaseDB();
  if (!firestore) throw new Error("Cloud database not connected");
  
  try {
    const querySnapshot = await getDocs(collection(firestore, collectionName));
    const data: T[] = [];
    querySnapshot.forEach((doc) => {
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

  const batch = writeBatch(firestore);
  
  data.forEach((item) => {
    const docRef = doc(firestore, collectionName, item.id);
    batch.set(docRef, item);
  });

  await batch.commit();
};


export const StorageService = {
  getSettings: async (): Promise<AppSettings> => {
    try {
      const record = await db.settings.get(SETTINGS_ID);
      if (record) {
        const { id, ...settings } = record;
        const appSettings = settings as AppSettings;
        if (appSettings.dataSource === 'Cloud' && appSettings.firebaseConfig) {
          initializeFirebase(appSettings);
        }
        return appSettings;
      }
      
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

  async getOrSeedData<T extends { id: string }>(localTable: any, mockData: T[], collectionName: string): Promise<T[]> {
    const settings = await StorageService.getSettings();
    
    if (settings.dataSource === 'Cloud') {
      try {
        const cloudData = await getCloudData<T>(collectionName);
        
        if (collectionName === 'staff' || collectionName === 'guests') {
          return cloudData;
        }
        return cloudData;

      } catch (error) {
        console.error(`Cloud fetch failed for ${collectionName}:`, error);
        return []; 
      }
    }

    const count = await localTable.count();
    
    if (count === 0 && settings.demoMode && mockData.length > 0) {
      await localTable.bulkAdd(mockData);
      return mockData;
    }

    return await localTable.toArray();
  },

  async saveData<T extends { id: string }>(localTable: any, data: T[], collectionName: string): Promise<void> {
    const settings = await StorageService.getSettings();

    await (db as any).transaction('rw', localTable, async () => {
      await localTable.clear();
      await localTable.bulkAdd(data);
    });

    if (settings.dataSource === 'Cloud') {
      try {
        await saveCloudData(collectionName, data);
      } catch (error) {
        console.error(`Failed to save to cloud`, error);
      }
    }
  },

  getRooms: (): Promise<Room[]> => StorageService.getOrSeedData(db.rooms, MOCK_ROOMS, 'rooms'),
  saveRooms: (rooms: Room[]) => StorageService.saveData(db.rooms, rooms, 'rooms'),
  getGuests: (): Promise<Guest[]> => StorageService.getOrSeedData(db.guests, MOCK_GUESTS, 'guests'),
  saveGuests: (guests: Guest[]) => StorageService.saveData(db.guests, guests, 'guests'),
  getHistory: (): Promise<BookingHistory[]> => StorageService.getOrSeedData(db.history, MOCK_HISTORY, 'history'),
  saveHistory: (history: BookingHistory[]) => StorageService.saveData(db.history, history, 'history'),
  getMaintenance: (): Promise<MaintenanceTicket[]> => StorageService.getOrSeedData(db.maintenance, MOCK_MAINTENANCE, 'maintenance'),
  saveMaintenance: (tickets: MaintenanceTicket[]) => StorageService.saveData(db.maintenance, tickets, 'maintenance'),
  getStaff: (): Promise<Staff[]> => StorageService.getOrSeedData(db.staff, MOCK_STAFF, 'staff'),
  saveStaff: (staff: Staff[]) => StorageService.saveData(db.staff, staff, 'staff'),
  getAttendanceLogs: (): Promise<AttendanceLog[]> => StorageService.getOrSeedData(db.attendance, [], 'attendance'),
  saveAttendanceLogs: (logs: AttendanceLog[]) => StorageService.saveData(db.attendance, logs, 'attendance'),
  getTransactions: (): Promise<Transaction[]> => StorageService.getOrSeedData(db.transactions, MOCK_TRANSACTIONS, 'transactions'),
  saveTransactions: (transactions: Transaction[]) => StorageService.saveData(db.transactions, transactions, 'transactions'),
  getDocuments: (): Promise<StoredDocument[]> => StorageService.getOrSeedData(db.documents, [], 'documents'),
  saveDocuments: (documents: StoredDocument[]) => StorageService.saveData(db.documents, documents, 'documents'),
  getFeatureRequests: (): Promise<FeatureRequest[]> => StorageService.getOrSeedData(db.features, [], 'features'),
  saveFeatureRequests: (features: FeatureRequest[]) => StorageService.saveData(db.features, features, 'features'),
  getDNRRecords: (): Promise<DNRRecord[]> => StorageService.getOrSeedData(db.dnr, [], 'dnr'),
  saveDNRRecords: (records: DNRRecord[]) => StorageService.saveData(db.dnr, records, 'dnr'),

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
    const all = await Promise.all([
      db.rooms.toArray(), db.guests.toArray(), db.maintenance.toArray(), db.staff.toArray(), 
      db.attendance.toArray(), db.transactions.toArray(), db.history.toArray(), db.documents.toArray(),
      db.features.toArray(), db.dnr.toArray()
    ]);

    return {
      version: '4.0', timestamp: new Date().toISOString(),
      data: { staysync_rooms: all[0], staysync_guests: all[1], staysync_maintenance: all[2], staysync_staff: all[3], staysync_attendance: all[4], staysync_transactions: all[5], staysync_history: all[6], staysync_documents: all[7], staysync_features: all[8], staysync_dnr: all[9] }
    };
  },

  importData: async (backupData: any) => {
    if (!backupData || !backupData.data) throw new Error("Invalid backup file format");
    const data = backupData.data;
    await (db as any).transaction('rw', Object.values(db), async () => {
      for (const key in data) {
        const table = db.table(key.replace('staysync_',''));
        await table.clear();
        await table.bulkAdd(data[key]);
      }
    });
  },

  testConnection: (apiKey: string): Promise<boolean> => Promise.resolve(apiKey.length > 20)
};